import * as path from "path";
import puppeteer from "puppeteer";
import chalk from "chalk";
import { ContextType } from "../context.js";

/**
 * Create a clickable terminal hyperlink using OSC 8 escape sequence
 */
export function createTerminalLink(url: string, text: string): string {
  // OSC 8 escape sequence for hyperlinks: \x1b]8;;URL\x1b\\TEXT\x1b]8;;\x1b\\
  return `\x1b]8;;${url}\x1b\\${text}\x1b]8;;\x1b\\`;
}

/**
 * Generate a log message for file creation based on file type
 */
export function getFileCreationMessage(
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
      return (
        chalk.green(`✓ Created ${clickableName} page`) +
        `\n   ${chalk.dim("🔄 Reload the page in your browser to see the updates.")}\n`
      );
    }
    const displayName = filePath.replace(/\.html$/, "");
    return (
      chalk.green(`✓ Created: ${displayName}`) +
      `\n   ${chalk.dim("🔄 Reload the page in your browser to see the updates.")}\n`
    );
  } else if (ext === ".mdx") {
    const displayPath = dirPath === "." ? fileName : filePath;
    return chalk.dim(`  → Creating component: ${displayPath}\n`);
  } else if (ext === ".json") {
    const displayPath = dirPath === "." ? fileName : filePath;
    return chalk.dim(`  → Creating data structure: ${displayPath}`);
  } else {
    return chalk.green(`✓ Created: ${filePath}`);
  }
}

/**
 * Get the base destination path based on isUpdate flag
 */
export function getBaseDestinationPath(
  projectPath: string,
  isUpdate: boolean
): string {
  if (isUpdate) {
    return path.join(projectPath, ".davia", "proposed");
  }
  return path.join(projectPath, ".davia", "assets");
}

/**
 * Get the assets path (for reading existing files)
 */
export function getAssetsPath(projectPath: string): string {
  return path.join(projectPath, ".davia", "assets");
}

/**
 * Helper function to resolve file path using runtime context
 * @param filePath - Relative file path
 * @param context - Runtime context with projectPath and isUpdate
 * @returns Absolute file path
 * @throws Error if path validation fails
 */
export function resolveFilePath(
  filePath: string,
  context: ContextType
): string {
  // Validate that path doesn't start with /
  if (filePath.startsWith("/")) {
    throw new Error(
      "Absolute paths with leading slash are not allowed. " +
        `Use relative paths like 'page1/page2/file.html' instead of '${filePath}'`
    );
  }

  // Get base destination path based on isUpdate flag
  const basePath = getBaseDestinationPath(
    context.projectPath,
    context.isUpdate
  );

  // Join and normalize the path
  const absolutePath = path.normalize(path.join(basePath, filePath));
  const normalizedDestination = path.normalize(basePath);

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
export async function parseMermaidWithPuppeteer(mermaidContent: string) {
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
export function robustSearchReplace(
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
