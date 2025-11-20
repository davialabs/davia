import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";
import { extractTitle } from "@/lib/utils";
import type { AssetTrees, FlatTree, Project } from "@/lib/types";

/**
 * Recursively finds all HTML files in a directory
 */
export function findHtmlFiles(
  dir: string,
  baseDir: string,
  htmlFiles: string[] = []
): string[] {
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      findHtmlFiles(fullPath, baseDir, htmlFiles);
    } else if (entry.endsWith(".html")) {
      htmlFiles.push(fullPath);
    }
  }

  return htmlFiles;
}

/**
 * Builds a flat tree structure for a project's assets
 */
function buildTreeForAsset(projectPath: string): FlatTree {
  const assetPath = join(projectPath, ".davia", "assets");

  // Find all HTML files in this asset folder
  const htmlFiles = findHtmlFiles(assetPath, assetPath);

  const tree: FlatTree = {};

  // Process each HTML file
  for (const htmlFile of htmlFiles) {
    // Get relative path from asset folder, remove .html extension
    const relativePath = relative(assetPath, htmlFile);
    const key = relativePath.replace(/\.html$/, "").replace(/\\/g, "/");

    // Read file and extract title
    try {
      const content = readFileSync(htmlFile, "utf-8");
      const title = extractTitle(content);

      tree[key] = {
        title,
        children: [],
      };
    } catch (error) {
      console.error(`Error reading ${htmlFile}:`, error);
      tree[key] = {
        title: "Untitled",
        children: [],
      };
    }
  }

  // Build parent-child relationships
  const keys = Object.keys(tree);

  for (const parentKey of keys) {
    const children: string[] = [];

    for (const candidateKey of keys) {
      // Skip if it's the same key
      if (candidateKey === parentKey) continue;

      // Check if candidateKey is a direct child of parentKey
      // A direct child starts with parentKey + '/' and has exactly one more segment
      if (candidateKey.startsWith(parentKey + "/")) {
        const remaining = candidateKey.slice(parentKey.length + 1);
        // If remaining has no more slashes, it's a direct child
        if (remaining && !remaining.includes("/")) {
          children.push(candidateKey);
        }
      }
    }

    if (tree[parentKey]) {
      tree[parentKey].children = children;
    }
  }

  // Add root node with top-level children (keys without '/')
  const rootChildren = keys.filter((key) => !key.includes("/"));

  tree["root"] = {
    title: "Root",
    children: rootChildren,
  };

  return tree;
}

/**
 * Builds flat tree structures for all projects
 */
export function buildAssetTrees(projects: Project[]): AssetTrees {
  const trees: AssetTrees = {};

  for (const project of projects) {
    try {
      trees[project.id] = buildTreeForAsset(project.path);
    } catch (error) {
      console.error(
        `Error building asset tree for project ${project.id}:`,
        error
      );
    }
  }

  return trees;
}
