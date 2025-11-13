"use client";

import { use, useMemo, useState } from "react";
import { useErrorBoundary } from "react-error-boundary";
import type { BundleMDXResult } from "@/lib/types";
import { useDataDependencies } from "../use-mdx-data";
import { useData } from "@/tiptap/hooks/use-data";
import { useProposedData } from "@/tiptap/hooks/use-proposed-data";
import { getMDXComponent } from "mdx-bundler/client";
import { MdxLoading } from "./fallback-views";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { DataView } from "../data-view";
import { Badge } from "@/components/ui/badge";
import { DatabaseIcon, LayoutTemplateIcon } from "lucide-react";
import { cn } from "@/lib/utils";
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
  preferProposed = false,
  hideTabs = false,
}: {
  bundlePromise: Promise<BundleMDXResult>;
  preferProposed?: boolean;
  hideTabs?: boolean;
}) {
  const { showBoundary } = useErrorBoundary();
  const bundleResult = use(bundlePromise);

  // Load all data dependencies (waits for bundle to be ready)
  const {
    allSynced: dataAllSynced,
    errors: dataErrors,
    dataImports,
  } = useDataDependencies(bundleResult);

  const FinalMDXComponent = useMemo(() => {
    if (!bundleResult.result.code) return null;
    return getMDXComponent(bundleResult.result.code, {
      ...MDX_GLOBAL_CONFIG,
      useData: preferProposed ? useProposedData : useData,
    });
  }, [bundleResult.result.code, preferProposed]);

  const [activeTab, setActiveTab] = useState("component");

  // Show errors if data loading failed
  if (dataErrors.length > 0) {
    showBoundary(new Error(`Data loading errors: ${dataErrors.join(", ")}`));
  }

  // Wait for all data dependencies to be synced
  // The hook only sets allSynced:true once bundle is ready and data is loaded
  if (!dataAllSynced) {
    return <MdxLoading />;
  }

  // If hiding tabs (e.g., in comparison view), just render the component
  if (hideTabs) {
    return (
      <MDXProvider>{FinalMDXComponent && <FinalMDXComponent />}</MDXProvider>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      {dataImports.length > 0 && (
        <div className="flex items-center gap-2 mb-2">
          <Badge
            variant="outline"
            className={cn(
              "cursor-pointer hover:bg-accent/90",
              activeTab === "component" && "bg-accent text-accent-foreground"
            )}
            onClick={() => setActiveTab("component")}
          >
            <LayoutTemplateIcon className="w-3 h-3 mr-1" />
            View
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              "cursor-pointer hover:bg-accent/90",
              activeTab === "data" && "bg-accent text-accent-foreground"
            )}
            onClick={() => setActiveTab("data")}
          >
            <DatabaseIcon className="w-3 h-3 mr-1" />
            Data
          </Badge>
        </div>
      )}
      <TabsContent value="component" className="mt-0">
        <MDXProvider>{FinalMDXComponent && <FinalMDXComponent />}</MDXProvider>
      </TabsContent>
      <TabsContent value="data" className="mt-0">
        <DataView dataImports={dataImports} />
      </TabsContent>
    </Tabs>
  );
}
