import { tool } from "langchain";
import { z } from "zod";
import { promises as fs } from "fs";
import * as path from "path";
import chalk from "chalk";
import {
  WRITE_TOOL_DESCRIPTION,
  SEARCH_REPLACE_TOOL_DESCRIPTION,
  MULTI_EDIT_TOOL_DESCRIPTION,
} from "./prompts/tool_descriptions.js";
import {
  ContextType,
  getFileCreationMessage,
  resolveFilePath,
  parseMermaidWithPuppeteer,
  robustSearchReplace,
  getAssetsPath,
  getBaseDestinationPath,
} from "./helpers/tools.js";

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
        console.log(chalk.blue("Parsing mermaid to Excalidraw"));
        // Parse mermaid to Excalidraw using Puppeteer headless browser
        try {
          const { elements, files } = await parseMermaidWithPuppeteer(content);

          // Create JSON file path by replacing extension
          const jsonFilePath = filePath.replace(/\.(mermaid|mmd)$/, ".json");
          const absoluteJsonPath = resolveFilePath(jsonFilePath, context);

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

          console.log(
            chalk.dim(`  → Converted mermaid to Excalidraw: ${jsonFilePath}`)
          );

          return `Converted mermaid to Excalidraw diagram. JSON saved to: ${jsonFilePath}`;
        } catch (error) {
          console.error(
            chalk.red("Error parsing mermaid to Excalidraw:"),
            error instanceof Error ? error.message : String(error)
          );
          throw new Error(
            `Error parsing mermaid to Excalidraw. Generate JSON instead.`
          );
        }
      }

      // For isUpdate mode, ensure file exists in assets first
      if (context.isUpdate) {
        const assetsPath = getAssetsPath(context.daviaPath, context.projectId);
        const assetsFilePath = path.join(assetsPath, filePath);

        try {
          // Check if file exists in assets
          await fs.access(assetsFilePath);
        } catch {
          // File doesn't exist in assets, create it
          const assetsDirectory = path.dirname(assetsFilePath);
          await fs.mkdir(assetsDirectory, { recursive: true });
          await fs.writeFile(assetsFilePath, "", "utf-8");
        }
      }

      // Resolve the absolute path (will use proposed or assets based on isUpdate)
      const absolutePath = resolveFilePath(filePath, context);

      // Ensure directory exists
      const directory = path.dirname(absolutePath);
      await fs.mkdir(directory, { recursive: true });

      // Write the file
      await fs.writeFile(absolutePath, content, "utf-8");

      const message = getFileCreationMessage(filePath, context);
      // getFileCreationMessage already includes chalk formatting, so just log it
      console.log(message);

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

      // Resolve the absolute path (will use proposed or assets based on isUpdate)
      const absolutePath = resolveFilePath(filePath, context);

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

      // If isUpdate, try to read from proposed first, then fallback to assets
      if (context.isUpdate) {
        const proposedPath = getBaseDestinationPath(
          context.daviaPath,
          context.projectId,
          true
        );
        const proposedFilePath = path.join(proposedPath, filePath);

        try {
          // Try to read from proposed first
          const content = await fs.readFile(proposedFilePath, "utf-8");
          return content;
        } catch {
          // Fallback to assets
          const assetsPath = getAssetsPath(
            context.daviaPath,
            context.projectId
          );
          const assetsFilePath = path.join(assetsPath, filePath);
          const content = await fs.readFile(assetsFilePath, "utf-8");
          return content;
        }
      }

      // If not isUpdate, read from assets directly
      const assetsPath = getAssetsPath(context.daviaPath, context.projectId);
      const assetsFilePath = path.join(assetsPath, filePath);
      const content = await fs.readFile(assetsFilePath, "utf-8");

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

      let deleted = false;

      // Delete from proposed if exists
      if (context.isUpdate) {
        const proposedPath = getBaseDestinationPath(
          context.daviaPath,
          context.projectId,
          true
        );
        const proposedFilePath = path.join(proposedPath, filePath);

        try {
          await fs.unlink(proposedFilePath);
          deleted = true;
        } catch {
          // File doesn't exist in proposed, continue
        }
      }

      // Delete from assets
      const assetsPath = getAssetsPath(context.daviaPath, context.projectId);
      const assetsFilePath = path.join(assetsPath, filePath);

      try {
        await fs.unlink(assetsFilePath);
        deleted = true;
      } catch {
        // File doesn't exist in assets
      }

      if (!deleted) {
        throw new Error(`Path '${filePath}' not found`);
      }

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

      // Resolve the absolute path (will use proposed or assets based on isUpdate)
      const absolutePath = resolveFilePath(filePath, context);

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
