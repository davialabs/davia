"use client";

import { use, useMemo } from "react";
import { useErrorBoundary } from "react-error-boundary";
import type { BundleMDXResult } from "@/lib/types";
import { useDataDependencies } from "../use-mdx-data";
import { useData } from "@/tiptap/hooks/use-data";
import { getMDXComponent } from "mdx-bundler/client";
import { MdxLoading } from "./fallback-views";
// Components
import { MDXProvider, useMDXComponents } from "@mdx-js/react";
// Scope
import * as Sonner from "sonner";
import * as NextThemes from "next-themes";

const MDX_GLOBAL_CONFIG = {
  MdxJsReact: {
    useMDXComponents,
  },
  Sonner: Sonner,
  NextThemes: NextThemes,
};

export function MdxRenderer({
  bundlePromise,
}: {
  bundlePromise: Promise<BundleMDXResult>;
}) {
  const { showBoundary } = useErrorBoundary();
  const bundleResult = use(bundlePromise);

  // Load all data dependencies (waits for bundle to be ready)
  const { allSynced: dataAllSynced, errors: dataErrors } =
    useDataDependencies(bundleResult);

  const FinalMDXComponent = useMemo(() => {
    if (!bundleResult.result.code) return null;
    return getMDXComponent(bundleResult.result.code, {
      ...MDX_GLOBAL_CONFIG,
      useData: useData,
    });
  }, [bundleResult.result.code]);

  // Show errors if data loading failed
  if (dataErrors.length > 0) {
    showBoundary(new Error(`Data loading errors: ${dataErrors.join(", ")}`));
  }

  // Wait for all data dependencies to be synced
  // The hook only sets allSynced:true once bundle is ready and data is loaded
  if (!dataAllSynced) {
    return <MdxLoading />;
  }

  return (
    <MDXProvider>{FinalMDXComponent && <FinalMDXComponent />}</MDXProvider>
  );
}
