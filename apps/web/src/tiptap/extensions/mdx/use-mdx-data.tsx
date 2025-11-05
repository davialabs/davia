"use client";

import { useEffect, useState, useMemo } from "react";
import { usePageRegistryStore } from "@/providers/page-registry";
import type { BundleMDXResult } from "@/lib/types";

/**
 * Hook to ensure all data dependencies are loaded and synced
 * Only starts loading once the bundle is available
 */
export function useDataDependencies(bundle: BundleMDXResult | undefined) {
  const [allSynced, setAllSynced] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Get the ensureAsset action imperatively to avoid subscribing to whole store
  const ensureAsset = usePageRegistryStore((state) => state.ensureAsset);

  // Serialize dataImports for stable comparison
  const dataImportsKey = bundle ? JSON.stringify(bundle.dataImports) : null;
  const dataImports = useMemo(
    () => (dataImportsKey ? (JSON.parse(dataImportsKey) as string[]) : []),
    [dataImportsKey]
  );

  useEffect(() => {
    // Wait for bundle to be available
    if (!bundle || !dataImportsKey) {
      setAllSynced(false);
      return;
    }

    // No data imports means we're ready
    if (!dataImports.length) {
      setAllSynced(true);
      setErrors([]);
      return;
    }

    // Reset state when starting to load
    setAllSynced(false);
    setErrors([]);

    let cancelled = false;

    async function loadData() {
      try {
        // Load all data in parallel
        await Promise.all(dataImports.map((path) => ensureAsset(path)));

        if (!cancelled) {
          setAllSynced(true);
          setErrors([]);
        }
      } catch (err) {
        if (!cancelled) {
          setErrors([(err as Error).message]);
          setAllSynced(false);
        }
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, [dataImportsKey, dataImports, ensureAsset, bundle]);

  return { allSynced, errors, dataImports };
}
