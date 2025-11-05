import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";
import { AssetTrees, FlatTree } from "@/lib/types";

/**
 * Recursively finds all HTML files in a directory
 */
function findHtmlFiles(
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
 * Extracts the first <h1> tag's text content from an HTML file
 */
function extractTitle(htmlContent: string): string {
  const h1Match = htmlContent.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);

  if (!h1Match || !h1Match[1]) {
    return "Untitled";
  }

  // Strip all HTML tags from the captured content
  const textOnly = h1Match[1].replace(/<[^>]+>/g, "").trim();

  return textOnly || "Untitled";
}

/**
 * Builds a flat tree structure for a single asset folder
 */
function buildTreeForAsset(
  monorepoRoot: string,
  assetFolder: string
): FlatTree {
  const assetsPath = join(monorepoRoot, ".davia", "assets");
  const assetPath = join(assetsPath, assetFolder);

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
 * Builds flat tree structures for all asset folders
 */
export function buildAssetTrees(monorepoRoot: string): AssetTrees {
  const assetsPath = join(monorepoRoot, ".davia", "assets");
  const trees: AssetTrees = {};

  try {
    const assetFolders = readdirSync(assetsPath, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    for (const assetFolder of assetFolders) {
      trees[assetFolder] = buildTreeForAsset(monorepoRoot, assetFolder);
    }
  } catch (error) {
    console.error("Error building asset trees:", error);
  }

  return trees;
}
