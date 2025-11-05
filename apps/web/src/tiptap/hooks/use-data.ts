"use client";

import { useMemo } from "react";
import { usePageRegistryStore } from "@/providers/page-registry";

/**
 * Read and update data assets via the registry store
 */
export function useData(dataPath: string) {
  const entry = usePageRegistryStore((state) => state.assets.get(dataPath));
  const updateAssetContent = usePageRegistryStore(
    (state) => state.updateAssetContent
  );

  if (!entry?.synced) {
    throw new Error(`Data ${dataPath} not loaded`);
  }

  const contentStr = entry.content || "";
  const data = useMemo(
    () => (contentStr ? JSON.parse(contentStr) : {}),
    [contentStr]
  );

  const updateData = (next: unknown) => {
    const stringified = JSON.stringify(next, null, 2);
    updateAssetContent(dataPath, stringified);
  };

  return { data, updateData };
}
