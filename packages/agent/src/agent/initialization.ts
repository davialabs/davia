import { promises as fs } from "fs";
import * as path from "path";
import ignore from "ignore";
import { EXCLUDED_FILE_EXTENSIONS, MAX_FILES, MAX_TOKENS } from "../config.js";

/**
 * Check if a file should be excluded from content analysis.
 * @param filePath - Path to the file
 * @returns True if the file should be excluded, False otherwise
 */
export function shouldExcludeFile(filePath: string): boolean {
  // Get file extension (case insensitive)
  const filePathLower = filePath.toLowerCase();

  // Check for exact extension matches
  for (const ext of EXCLUDED_FILE_EXTENSIONS) {
    if (filePathLower.endsWith(ext.toLowerCase())) {
      return true;
    }
  }

  // Check for files without extensions that might be binary
  if (!filePathLower.includes(".")) {
    // Common text files without extensions that should be included
    const textFiles = new Set([
      "makefile",
      "dockerfile",
      "readme",
      "license",
      "changelog",
      "authors",
      "contributors",
      "install",
      "configure",
      "makefile.in",
      "gemfile",
      "rakefile",
      "procfile",
    ]);

    const filename = filePathLower.split("/").pop() || "";
    if (!textFiles.has(filename)) {
      return true;
    }
  }

  return false;
}

/**
 * Calculate the maximum characters allowed per file based on token budget.
 * Uses the rule of thumb: 4 characters = 1 token
 * @param totalChars - Total characters in all non-excluded files
 * @param numFiles - Number of non-excluded files
 * @param maxTokens - Maximum tokens allowed for the entire repository
 * @returns Maximum characters allowed per file, or -1 if no limit needed
 */
export function calculateMaxCharsPerFile(
  totalChars: number,
  numFiles: number,
  maxTokens: number
): number {
  const maxCharsTotal = maxTokens * 4;

  // If total is within budget, no trimming needed
  if (totalChars <= maxCharsTotal) {
    return -1;
  }

  // Calculate per-file limit
  return Math.floor(maxCharsTotal / numFiles);
}

/**
 * Trim file content from the middle while preserving beginning and end.
 * @param content - Original file content
 * @param maxChars - Maximum characters allowed for this file
 * @param headRatio - Ratio of content to keep from the beginning (default: 0.6)
 * @returns Trimmed content with clear markers showing what was removed
 */
export function trimFileContent(
  content: string,
  maxChars: number,
  headRatio: number = 0.6
): string {
  // If content is within limit, return unchanged
  if (content.length <= maxChars) {
    return content;
  }

  // Calculate how much to keep from beginning and end
  const headChars = Math.floor(maxChars * headRatio);
  const tailChars = maxChars - headChars;

  // Extract beginning and end portions
  const headContent = content.slice(0, headChars);
  const tailContent = content.slice(-tailChars);

  // Calculate how many characters were trimmed
  const trimmedChars = content.length - maxChars;

  // Create trimmed content with clear marker
  const trimmedContent =
    headContent +
    `\n\n... [TRIMMED ${trimmedChars} chars from middle] ...\n\n` +
    tailContent;

  return trimmedContent;
}

/**
 * Read all files from a repository recursively with intelligent trimming.
 * @param sourcePath - Path to the source directory
 * @returns Promise resolving to a dictionary of file paths to trimmed content
 */
export async function readRepositoryContent(
  sourcePath: string
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};

  // Initialize ignore instance
  const ig = ignore();

  // Try to read .gitignore file
  const gitignorePath = path.join(sourcePath, ".gitignore");
  try {
    const gitignoreContent = await fs.readFile(gitignorePath, "utf-8");
    ig.add(gitignoreContent);
  } catch {
    // No .gitignore file or can't read it, continue without it
  }

  // Always ignore common directories
  ig.add([".git", "node_modules", ".next", "dist", "build", ".turbo"]);

  // Recursively read all files
  const allFiles: string[] = [];

  async function traverseDirectory(currentPath: string): Promise<void> {
    if (allFiles.length >= MAX_FILES) {
      return;
    }

    try {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        if (allFiles.length >= MAX_FILES) {
          break;
        }

        const fullPath = path.join(currentPath, entry.name);
        const relativePath = path.relative(sourcePath, fullPath);

        // Skip if ignored by gitignore
        if (ig.ignores(relativePath)) {
          continue;
        }

        if (entry.isDirectory()) {
          await traverseDirectory(fullPath);
        } else if (entry.isFile()) {
          // Skip excluded file extensions
          if (!shouldExcludeFile(relativePath)) {
            allFiles.push(fullPath);
          }
        }
      }
    } catch {
      // Skip directories we can't read
    }
  }

  await traverseDirectory(sourcePath);

  // Read all file contents
  const fileContents: Array<{ path: string; content: string }> = [];

  for (const filePath of allFiles) {
    try {
      const content = await fs.readFile(filePath, "utf-8");
      const relativePath = path.relative(sourcePath, filePath);
      fileContents.push({ path: relativePath, content });
    } catch {
      // Skip files that can't be read
    }
  }

  // Calculate total characters
  const totalChars = fileContents.reduce(
    (sum, file) => sum + file.content.length,
    0
  );

  // Calculate max chars per file
  const maxCharsPerFile = calculateMaxCharsPerFile(
    totalChars,
    fileContents.length,
    MAX_TOKENS
  );

  // Apply trimming and build result dictionary
  for (const file of fileContents) {
    if (maxCharsPerFile === -1) {
      // No trimming needed
      result[file.path] = file.content;
    } else {
      // Apply trimming
      result[file.path] = trimFileContent(file.content, maxCharsPerFile);
    }
  }

  return result;
}
