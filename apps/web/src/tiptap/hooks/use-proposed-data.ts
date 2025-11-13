"use client";

import { useMemo } from "react";
import { usePageRegistryStore } from "@/providers/page-registry";

/**
 * Read and update proposed data assets via the registry store
 * Falls back to current data if no proposed content exists
 */
export function useProposedData(dataPath: string) {
  const entry = usePageRegistryStore((state) => state.assets.get(dataPath));
  const updateAssetProposedContent = usePageRegistryStore(
    (state) => state.updateAssetProposedContent
  );

  if (!entry?.synced) {
    throw new Error(`Data ${dataPath} not loaded`);
  }

  // Use proposed content if it exists, otherwise fall back to content
  const hasProposed =
    entry.proposedContent !== null && entry.proposedContent !== undefined;
  const contentStr = hasProposed
    ? entry.proposedContent || ""
    : entry.content || "";

  const data = useMemo(
    () => (contentStr ? JSON.parse(contentStr) : {}),
    [contentStr]
  );

  const updateData = (next: unknown) => {
    const stringified = JSON.stringify(next, null, 2);
    // When using useProposedData, always update proposed content
    // This ensures data changes are stored as proposed, not directly in content
    updateAssetProposedContent(dataPath, stringified);
  };

  return { data, updateData, hasProposed };
}
