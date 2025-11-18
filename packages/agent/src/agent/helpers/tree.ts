import fs from "fs-extra";
import * as path from "path";

/**
 * Recursively collect all file paths from a directory
 * @param basePath - Base directory path to collect from
 * @returns Array of relative paths (e.g., ["project-1.html", "project-1/overview.html"])
 */
export async function collectPaths(basePath: string): Promise<string[]> {
  const paths: string[] = [];

  async function traverseDirectory(
    currentPath: string,
    relativeBase: string
  ): Promise<void> {
    try {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        const relativePath = path
          .relative(relativeBase, fullPath)
          .replace(/\\/g, "/");

        if (entry.isDirectory()) {
          await traverseDirectory(fullPath, relativeBase);
        } else if (entry.isFile()) {
          paths.push(relativePath);
        }
      }
    } catch {
      // Skip directories we can't read
    }
  }

  try {
    await traverseDirectory(basePath, basePath);
  } catch {
    // If base path doesn't exist, return empty array
    return [];
  }

  return paths;
}

/**
 * Convert a list of paths into a filesystem tree structure with full paths.
 * HTML files are handled specially to maintain hierarchy by stripping .html extension
 * for tree building, then re-adding it for display.
 * @param paths - List of path strings (e.g., ["project-1.html", "project-1/overview.html"])
 * @returns Formatted string representing the filesystem tree with full paths
 */
export function formatTree(paths: string[]): string {
  if (paths.length === 0) {
    return "";
  }

  // Separate HTML files from other files
  const htmlPaths: string[] = [];
  const otherPaths: string[] = [];

  for (const filePath of paths) {
    if (filePath.endsWith(".html")) {
      htmlPaths.push(filePath);
    } else {
      otherPaths.push(filePath);
    }
  }

  // Build tree structure using a map
  const tree = new Map<string, string[]>();

  // Process HTML files with special hierarchy handling
  for (const filePath of htmlPaths.sort()) {
    // Remove leading slash and .html extension for tree building
    const cleanPath = filePath.startsWith("/") ? filePath.slice(1) : filePath;
    if (!cleanPath) {
      continue;
    }

    // Strip .html extension for hierarchy
    const pathWithoutExt = cleanPath.endsWith(".html")
      ? cleanPath.slice(0, -5)
      : cleanPath;

    const parts = pathWithoutExt.split("/");

    if (parts.length === 1) {
      // Root level file - add back .html extension for display
      const part = parts[0];
      if (part) {
        const rootFiles = tree.get("") || [];
        rootFiles.push(part + ".html");
        tree.set("", rootFiles);
      }
    } else {
      // Nested structure - add back .html extension for display
      const parent = parts.slice(0, -1).join("/");
      const lastPart = parts[parts.length - 1];
      if (lastPart) {
        const childFiles = tree.get(parent) || [];
        childFiles.push(lastPart + ".html");
        tree.set(parent, childFiles);
      }
    }
  }

  // Process non-HTML files (keep as-is)
  for (const filePath of otherPaths.sort()) {
    const cleanPath = filePath.startsWith("/") ? filePath.slice(1) : filePath;
    if (!cleanPath) {
      continue;
    }

    const parts = cleanPath.split("/");

    if (parts.length === 1) {
      // Root level file
      const part = parts[0];
      if (part) {
        const rootFiles = tree.get("") || [];
        rootFiles.push(part);
        tree.set("", rootFiles);
      }
    } else {
      // Nested structure
      const parent = parts.slice(0, -1).join("/");
      const lastPart = parts[parts.length - 1];
      if (lastPart) {
        const childFiles = tree.get(parent) || [];
        childFiles.push(lastPart);
        tree.set(parent, childFiles);
      }
    }
  }

  // Format tree as string
  function formatTreeRecursive(
    parentPath: string,
    indent: string = ""
  ): string {
    const children = tree.get(parentPath) || [];
    if (children.length === 0) {
      return "";
    }

    let result = "";
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (!child) continue;
      const isLast = i === children.length - 1;
      const prefix = isLast ? "└── " : "├── ";
      result += `${indent}${prefix}${child}\n`;

      // Recursively format children
      const childPath = parentPath
        ? `${parentPath}/${child}`
        : child.replace(/\.html$/, "");
      const childTree = formatTreeRecursive(
        childPath,
        indent + (isLast ? "    " : "│   ")
      );
      result += childTree;
    }

    return result;
  }

  return formatTreeRecursive("").trim();
}
