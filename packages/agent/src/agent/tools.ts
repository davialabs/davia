import { tool } from "langchain";
import { z } from "zod";
import { promises as fs } from "fs";
import * as path from "path";
import puppeteer from "puppeteer";
import {
  WRITE_TOOL_DESCRIPTION,
  SEARCH_REPLACE_TOOL_DESCRIPTION,
  MULTI_EDIT_TOOL_DESCRIPTION,
} from "./prompts/tool_descriptions.js";

// Context schema type - matches the contextSchema in agent.ts
type ContextType = {
  modelName: string;
  sourcePath: string;
  destinationPath: string;
  projectId?: string;
};

/**
 * Create a clickable terminal hyperlink using OSC 8 escape sequence
 */
function createTerminalLink(url: string, text: string): string {
  // OSC 8 escape sequence for hyperlinks: \x1b]8;;URL\x1b\\TEXT\x1b]8;;\x1b\\
  return `\x1b]8;;${url}\x1b\\${text}\x1b]8;;\x1b\\`;
}

/**
 * Generate a log message for file creation based on file type
 */
function getFileCreationMessage(
  filePath: string,
  context: ContextType
): string {
  const ext = path.extname(filePath).toLowerCase();
  const fileName = path.basename(filePath);
  const dirPath = path.dirname(filePath);

  if (ext === ".html") {
    // For HTML files, create a clickable link
    if (context.projectId) {
      // Convert file path to URL path (remove .html extension, use forward slashes)
      const urlPath = filePath.replace(/\.html$/, "").replace(/\\/g, "/");
      const url = `http://localhost:3000/${context.projectId}/${urlPath}`;
      // Get display name without .html extension
      const nameWithoutExt = fileName.replace(/\.html$/, "");
      const displayName =
        dirPath === "." ? nameWithoutExt : filePath.replace(/\.html$/, "");
      const clickableName = createTerminalLink(url, displayName);
      return `✓ Created ${clickableName} page\n   🔄 Reload the page in your browser to see the updates.\n`;
    }
    const displayName = filePath.replace(/\.html$/, "");
    return `✓ Created: ${displayName}\n   🔄 Reload the page in your browser to see the updates.\n`;
  } else if (ext === ".mdx") {
    const displayPath = dirPath === "." ? fileName : filePath;
    return `  -> Creating component: ${displayPath}\n`;
  } else if (ext === ".json") {
    const displayPath = dirPath === "." ? fileName : filePath;
    return `  -> Creating data structure: ${displayPath}`;
  } else {
    return `✓ Created: ${filePath}`;
  }
}

/**
 * Helper function to resolve file path using runtime context
 * @param filePath - Relative file path
 * @param destinationPath - Base destination path from runtime context
 * @returns Absolute file path
 * @throws Error if path validation fails
 */
function resolveFilePath(filePath: string, destinationPath: string): string {
  // Validate that path doesn't start with /
  if (filePath.startsWith("/")) {
    throw new Error(
      "Absolute paths with leading slash are not allowed. " +
        `Use relative paths like 'page1/page2/file.html' instead of '${filePath}'`
    );
  }

  // Join and normalize the path
  const absolutePath = path.normalize(path.join(destinationPath, filePath));
  const normalizedDestination = path.normalize(destinationPath);

  // Security check: ensure the resolved path doesn't escape the destination directory
  if (!absolutePath.startsWith(normalizedDestination)) {
    throw new Error(
      `Path '${filePath}' attempts to escape the destination directory`
    );
  }

  return absolutePath;
}

/**
 * Parse Mermaid diagram to Excalidraw using Puppeteer headless browser
 * This is the same approach used by mermaid-cli for reliable rendering
 * @param mermaidContent - Mermaid diagram definition
 * @returns Excalidraw elements and files
 */
async function parseMermaidWithPuppeteer(mermaidContent: string) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();

    // Set up the page with the necessary libraries and parse
    const result = await page.evaluate(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (definition: string): Promise<any> => {
        // Dynamically import the libraries in the browser context
        const { parseMermaidToExcalidraw } = await import(
          // @ts-expect-error - Runtime import in browser, not checked by TS
          "https://cdn.jsdelivr.net/npm/@excalidraw/mermaid-to-excalidraw@1.1.3/+esm"
        );
        const { convertToExcalidrawElements } = await import(
          // @ts-expect-error - Runtime import in browser, not checked by TS
          "https://cdn.jsdelivr.net/npm/@excalidraw/excalidraw@0.18.0/+esm"
        );

        const { elements, files } = await parseMermaidToExcalidraw(definition);
        const excalidrawElements = convertToExcalidrawElements(elements);

        return { elements: excalidrawElements, files };
      },
      mermaidContent
    );

    return result;
  } finally {
    await browser.close();
  }
}

/**
 * Helper function to perform robust search and replace with validation
 * @param content - Original file content
 * @param oldString - String to search for
 * @param newString - String to replace with
 * @param replaceAll - Whether to replace all occurrences
 * @returns Object with new content, success status, and error message
 */
function robustSearchReplace(
  content: string,
  oldString: string,
  newString: string,
  replaceAll: boolean = false
): { newContent: string; success: boolean; errorMessage?: string } {
  // Check if old_string and new_string are the same
  if (oldString === newString) {
    return {
      newContent: content,
      success: false,
      errorMessage: "old_string and new_string must be different",
    };
  }

  // Check if old_string exists in content
  if (!content.includes(oldString)) {
    return {
      newContent: content,
      success: false,
      errorMessage: `The string to replace was not found in the file. Make sure old_string matches the file content exactly, including whitespace and indentation.`,
    };
  }

  // If not replacing all, check that old_string appears exactly once
  if (!replaceAll) {
    const occurrences = content.split(oldString).length - 1;
    if (occurrences > 1) {
      return {
        newContent: content,
        success: false,
        errorMessage: `The string to replace appears ${occurrences} times in the file. Either provide more context to make old_string unique, or set replace_all to true.`,
      };
    }
  }

  // Perform the replacement
  const newContent = replaceAll
    ? content.split(oldString).join(newString)
    : content.replace(oldString, newString);

  return {
    newContent,
    success: true,
  };
}

/**
 * Tool for writing content to a file
 */
export const writeTool = tool(
  async ({ filePath, content }, runtime) => {
    try {
      if (!runtime.context) {
        throw new Error("Runtime context is required");
      }

      const context = runtime.context as ContextType;

      // Check if this is a mermaid file that needs conversion
      const ext = path.extname(filePath).toLowerCase();
      if (ext === ".mermaid" || ext === ".mmd") {
        console.log("Parsing mermaid to Excalidraw");
        // Parse mermaid to Excalidraw using Puppeteer headless browser
        try {
          const { elements, files } = await parseMermaidWithPuppeteer(content);

          // Create JSON file path by replacing extension
          const jsonFilePath = filePath.replace(/\.(mermaid|mmd)$/, ".json");
          const absoluteJsonPath = resolveFilePath(
            jsonFilePath,
            context.destinationPath
          );

          // Ensure directory exists
          const directory = path.dirname(absoluteJsonPath);
          await fs.mkdir(directory, { recursive: true });

          // Write the JSON file with elements
          const result: { elements: unknown[]; files?: unknown } = {
            elements,
          };
          if (files) result.files = files;
          const jsonContent = JSON.stringify(result, null, 2);
          await fs.writeFile(absoluteJsonPath, jsonContent, "utf-8");

          console.log(`  -> Converted mermaid to Excalidraw: ${jsonFilePath}`);

          return `Converted mermaid to Excalidraw diagram. JSON saved to: ${jsonFilePath}`;
        } catch (error) {
          console.error("Error parsing mermaid to Excalidraw", error);
          throw new Error(
            `Error parsing mermaid to Excalidraw. Generate JSON instead.`
          );
        }
      }

      // Resolve the absolute path
      const absolutePath = resolveFilePath(filePath, context.destinationPath);

      // Ensure directory exists
      const directory = path.dirname(absolutePath);
      await fs.mkdir(directory, { recursive: true });

      // Write the file
      await fs.writeFile(absolutePath, content, "utf-8");

      console.log(getFileCreationMessage(filePath, context));

      return `Successfully wrote content to ${filePath}`;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Error writing '${filePath}': ${errorMessage}`);
    }
  },
  {
    name: "write_file",
    description: WRITE_TOOL_DESCRIPTION,
    schema: z.object({
      filePath: z
        .string()
        .describe(
          "The relative path to the file to write (e.g., 'page1/page2/file.html', not '/page1/page2/file.html')"
        ),
      content: z.string().describe("The content to write to the file"),
    }),
  }
);

/**
 * Tool for searching and replacing text in a file
 */
export const searchReplaceTool = tool(
  async ({ filePath, oldString, newString, replaceAll = false }, runtime) => {
    try {
      if (!runtime.context) {
        throw new Error("Runtime context is required");
      }

      const context = runtime.context as ContextType;

      // Resolve the absolute path
      const absolutePath = resolveFilePath(filePath, context.destinationPath);

      // Read the file
      const originalContent = await fs.readFile(absolutePath, "utf-8");

      // Perform robust search and replace
      const { newContent, success, errorMessage } = robustSearchReplace(
        originalContent,
        oldString,
        newString,
        replaceAll
      );

      if (!success) {
        throw new Error(
          `Failed to replace string in file '${filePath}': ${errorMessage}`
        );
      }

      // Write the updated content back
      await fs.writeFile(absolutePath, newContent, "utf-8");

      return `File '${filePath}' has been edited`;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Error editing '${filePath}': ${errorMessage}`);
    }
  },
  {
    name: "search_replace",
    description: SEARCH_REPLACE_TOOL_DESCRIPTION,
    schema: z.object({
      filePath: z
        .string()
        .describe(
          "The relative path to the file to modify (e.g., 'page1/page2/file.html', not '/page1/page2/file.html')"
        ),
      oldString: z
        .string()
        .describe(
          "The exact literal text to replace (including all whitespace, indentation, newlines, and surrounding code)"
        ),
      newString: z
        .string()
        .describe(
          "The exact literal text to replace old_string with (including all whitespace, indentation, newlines, and surrounding code)"
        ),
      replaceAll: z
        .boolean()
        .optional()
        .default(false)
        .describe("Replace all occurrences of old_string (default false)"),
    }),
  }
);

/**
 * Tool for reading file contents
 */
export const readFileTool = tool(
  async ({ filePath }, runtime) => {
    try {
      if (!runtime.context) {
        throw new Error("Runtime context is required");
      }

      const context = runtime.context as ContextType;

      // Resolve the absolute path
      const absolutePath = resolveFilePath(filePath, context.destinationPath);

      // Read the file
      const content = await fs.readFile(absolutePath, "utf-8");

      return content;
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        throw new Error(`Path '${filePath}' not found`);
      }
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Error reading '${filePath}': ${errorMessage}`);
    }
  },
  {
    name: "read_file",
    description:
      "Reads and returns the complete contents of a specified file. Use this tool to read the content of a file from the filesystem. This tool reads the entire content of a file and returns it as a string. If the file is not found, it returns an error message.",
    schema: z.object({
      filePath: z
        .string()
        .describe(
          "The relative path to the file to read (e.g., 'page1/page2/file.html', not '/page1/page2/file.html')"
        ),
    }),
  }
);

/**
 * Tool for deleting a file
 */
export const deleteTool = tool(
  async ({ filePath }, runtime) => {
    try {
      if (!runtime.context) {
        throw new Error("Runtime context is required");
      }

      const context = runtime.context as ContextType;

      // Resolve the absolute path
      const absolutePath = resolveFilePath(filePath, context.destinationPath);

      // Delete the file
      await fs.unlink(absolutePath);

      return `File '${filePath}' has been deleted`;
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        throw new Error(`Path '${filePath}' not found`);
      }
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Error deleting '${filePath}': ${errorMessage}`);
    }
  },
  {
    name: "delete_file",
    description:
      "Permanently deletes a specified file from the filesystem. Use this tool to delete a file from the filesystem at the specified path.",
    schema: z.object({
      filePath: z
        .string()
        .describe(
          "The relative path to the file to delete (e.g., 'page1/page2/file.html', not '/page1/page2/file.html')"
        ),
    }),
  }
);

/**
 * Tool for making multiple edits to a single file
 */
export const multiEditTool = tool(
  async ({ filePath, edits }, runtime) => {
    try {
      if (!runtime.context) {
        throw new Error("Runtime context is required");
      }

      const context = runtime.context as ContextType;

      // Validate that edits array is not empty
      if (!edits || edits.length === 0) {
        throw new Error("At least one edit operation must be provided");
      }

      // Validate each edit operation
      for (let i = 0; i < edits.length; i++) {
        const edit = edits[i];
        if (!edit) {
          throw new Error(`Edit ${i + 1} is undefined`);
        }
        if (!edit.oldString || !edit.newString) {
          throw new Error(
            `Edit ${i + 1} must contain 'oldString' and 'newString' fields`
          );
        }
        if (edit.oldString === edit.newString) {
          throw new Error(
            `Edit ${i + 1}: oldString and newString must be different`
          );
        }
      }

      // Resolve the absolute path
      const absolutePath = resolveFilePath(filePath, context.destinationPath);

      // Read the file once
      let currentContent = await fs.readFile(absolutePath, "utf-8");

      // Apply edits sequentially
      for (let i = 0; i < edits.length; i++) {
        const edit = edits[i];
        if (!edit) {
          throw new Error(`Edit ${i + 1} is undefined`);
        }
        const { oldString, newString, replaceAll = false } = edit;

        const { newContent, success, errorMessage } = robustSearchReplace(
          currentContent,
          oldString,
          newString,
          replaceAll
        );

        if (!success) {
          throw new Error(`Edit operation ${i + 1} failed: ${errorMessage}`);
        }

        // Update current content for next iteration
        currentContent = newContent;
      }

      // Write the final content
      await fs.writeFile(absolutePath, currentContent, "utf-8");

      const editCount = edits.length;
      return `File '${filePath}' has been edited with ${editCount} operation${editCount > 1 ? "s" : ""}`;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Error editing '${filePath}': ${errorMessage}`);
    }
  },
  {
    name: "multi_edit",
    description: MULTI_EDIT_TOOL_DESCRIPTION,
    schema: z.object({
      filePath: z
        .string()
        .describe(
          "The relative path to the file to modify (e.g., 'page1/page2/file.html', not '/page1/page2/file.html')"
        ),
      edits: z
        .array(
          z.object({
            oldString: z
              .string()
              .describe(
                "The exact literal text to replace (including all whitespace, indentation, newlines, and surrounding code)"
              ),
            newString: z
              .string()
              .describe(
                "The exact literal text to replace old_string with (including all whitespace, indentation, newlines, and surrounding code)"
              ),
            replaceAll: z
              .boolean()
              .optional()
              .default(false)
              .describe(
                "Replace all occurrences of old_string (default false)"
              ),
          })
        )
        .describe(
          "Array of edit operations to perform sequentially on the file"
        ),
    }),
  }
);
