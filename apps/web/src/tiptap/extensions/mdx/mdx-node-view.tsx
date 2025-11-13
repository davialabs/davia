"use client";

import { useEffect, Suspense, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import { usePageRegistryStore } from "@/providers/page-registry";
import { ErrorBoundary } from "react-error-boundary";
import { MdxRenderer, MdxErrorFallback, MdxLoading } from "./component-view";
import Comparison from "./comparison";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BundleMDXResult } from "@/lib/types";

export function MdxNodeView(props: ReactNodeViewProps) {
  const componentPath = props.node.attrs["data-path"];
  const entry = usePageRegistryStore((state) =>
    state.assets.get(componentPath)
  );
  const ensureAsset = usePageRegistryStore((state) => state.ensureAsset);
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();

  // Create promises for both current and proposed MDX bundles
  const createBundlePromise = useCallback(
    (preferProposed: boolean) => {
      return new Promise<BundleMDXResult>((resolve, reject) => {
        const params = new URLSearchParams({
          projectId,
          path: componentPath,
          preferProposed: preferProposed ? "true" : "false",
        });

        fetch(`/api/bundle-mdx?${params.toString()}`)
          .then((response) => {
            if (!response.ok) {
              reject(new Error(`Failed to bundle MDX: ${response.statusText}`));
              return;
            }
            return response.json() as Promise<BundleMDXResult>;
          })
          .then((data) => {
            if (data) {
              if (data.result.errors.length > 0) {
                reject(new Error(data.result.errors.join("\n")));
                return;
              }
              resolve(data);
            } else {
              reject(new Error("No bundle returned from bundle-mdx"));
            }
          })
          .catch((error) => {
            reject(error);
          });
      });
    },
    [projectId, componentPath]
  );

  const bundlePromise = useMemo(
    () => createBundlePromise(false),
    [createBundlePromise]
  );

  const proposedBundlePromise = useMemo(
    () => createBundlePromise(true),
    [createBundlePromise]
  );

  useEffect(() => {
    if (!entry) {
      ensureAsset(componentPath);
    }
  }, [componentPath, ensureAsset, entry]);

  if (!entry || !entry.synced)
    return (
      <NodeViewWrapper>
        <MdxLoading />
      </NodeViewWrapper>
    );
  if (entry.error)
    return (
      <NodeViewWrapper>
        <MdxErrorFallback
          error={entry.error}
          props={props}
          content={entry.content ?? ""}
        />
      </NodeViewWrapper>
    );

  // Check if there's proposed content
  const hasProposedContent =
    entry.proposedContent !== null &&
    entry.proposedContent !== undefined &&
    entry.proposedContent.trim().length > 0 &&
    entry.proposedContent !== entry.content;

  const handleAccept = async () => {
    try {
      const response = await fetch("/api/resolve-component", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          path: componentPath,
          resolveType: "accept",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.error ||
          `Failed to accept component: ${response.statusText}`;
        console.error("Failed to accept component:", errorMessage, errorData);
        // Show toast error to user
        const { toast } = await import("sonner");
        toast.error(errorMessage);
        return;
      }

      const result = await response.json().catch(() => ({}));
      // If the response indicates no proposed content (already resolved), just refresh
      if (result.message === "No proposed content to resolve") {
        console.log("No proposed content to resolve - refreshing asset");
      }

      // Refresh the asset to get updated content
      await ensureAsset(componentPath);
      router.refresh();
    } catch (error) {
      console.error("Error accepting component:", error);
      const { toast } = await import("sonner");
      toast.error(
        `Failed to accept component: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  };

  const handleReject = async () => {
    try {
      const response = await fetch("/api/resolve-component", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          path: componentPath,
          resolveType: "reject",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.error ||
          `Failed to reject component: ${response.statusText}`;
        console.error("Failed to reject component:", errorMessage, errorData);
        // Show toast error to user
        const { toast } = await import("sonner");
        toast.error(errorMessage);
        return;
      }

      const result = await response.json().catch(() => ({}));
      // If the response indicates no proposed content (already resolved), just refresh
      if (result.message === "No proposed content to resolve") {
        console.log("No proposed content to resolve - refreshing asset");
      }

      // Refresh the asset to get updated content
      await ensureAsset(componentPath);
      router.refresh();
    } catch (error) {
      console.error("Error rejecting component:", error);
      const { toast } = await import("sonner");
      toast.error(
        `Failed to reject component: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  };

  // If there's proposed content, show comparison view
  if (hasProposedContent) {
    return (
      <NodeViewWrapper className="relative my-6">
        <div className="relative bg-emerald-500/10 dark:bg-emerald-500/20 px-4 pt-4 pb-12 rounded-lg border border-emerald-500/20 dark:border-emerald-500/30">
          <ErrorBoundary
            FallbackComponent={({ error }) => (
              <MdxErrorFallback
                error={error?.message || JSON.stringify(error, null, 2)}
                props={props}
                content={entry.content ?? ""}
              />
            )}
          >
            <Suspense fallback={<MdxLoading />}>
              <Comparison
                leftComponent={
                  <MdxRenderer
                    bundlePromise={bundlePromise}
                    preferProposed={false}
                    hideTabs={true}
                  />
                }
                rightComponent={
                  <MdxRenderer
                    bundlePromise={proposedBundlePromise}
                    preferProposed={true}
                    hideTabs={true}
                  />
                }
              />
            </Suspense>
          </ErrorBoundary>
          <div className="absolute bottom-2 right-2 z-40 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReject}
              className={cn(
                "h-8 px-3 text-xs font-medium",
                "bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/50",
                "text-red-700 dark:text-red-300",
                "border-red-300 dark:border-red-800",
                "shadow-sm hover:shadow"
              )}
            >
              <X className="h-3.5 w-3.5 mr-1.5" />
              Reject
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAccept}
              className={cn(
                "h-8 px-3 text-xs font-medium",
                "bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50",
                "text-emerald-700 dark:text-emerald-300",
                "border-emerald-300 dark:border-emerald-800",
                "shadow-sm hover:shadow"
              )}
            >
              <Check className="h-3.5 w-3.5 mr-1.5" />
              Accept
            </Button>
          </div>
        </div>
      </NodeViewWrapper>
    );
  }

  // No proposed content, show normal view
  return (
    <NodeViewWrapper>
      <ErrorBoundary
        FallbackComponent={({ error }) => (
          <MdxErrorFallback
            error={error?.message || JSON.stringify(error, null, 2)}
            props={props}
            content={entry.content ?? ""}
          />
        )}
      >
        <Suspense fallback={<MdxLoading />}>
          <MdxRenderer bundlePromise={bundlePromise} preferProposed={false} />
        </Suspense>
      </ErrorBoundary>
    </NodeViewWrapper>
  );
}
