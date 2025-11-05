import type { FlatTree } from "@/lib/types";

export function getPageAncestors(
  pageId: string,
  tree: FlatTree
): { id: string; title: string }[] {
  const ancestors: { id: string; title: string }[] = [];

  // Helper function to find parent of a given page
  const findParent = (targetId: string): string | null => {
    for (const [nodeId, node] of Object.entries(tree)) {
      if (node && node.children.includes(targetId)) {
        return nodeId;
      }
    }
    return null;
  };

  // Build the path from current page up to root (excluding root)
  let currentId = pageId;
  while (currentId) {
    const parentId = findParent(currentId);
    if (parentId && parentId !== "root") {
      const parentNode = tree[parentId];
      if (parentNode) {
        ancestors.unshift({ id: parentId, title: parentNode.title });
      }
    }
    currentId = parentId || "";
  }

  return ancestors;
}
