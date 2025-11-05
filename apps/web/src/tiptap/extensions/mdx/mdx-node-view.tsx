"use client";

import { useEffect, Suspense, useMemo } from "react";
import { useParams } from "next/navigation";
import { NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import { usePageRegistryStore } from "@/providers/page-registry";
import { ErrorBoundary } from "react-error-boundary";
import { MdxRenderer, MdxErrorFallback, MdxLoading } from "./component-view";
import type { BundleMDXResult } from "@/lib/types";

export function MdxNodeView(props: ReactNodeViewProps) {
  const componentPath = props.node.attrs["data-path"];
  const entry = usePageRegistryStore((state) =>
    state.assets.get(componentPath)
  );
  const ensureAsset = usePageRegistryStore((state) => state.ensureAsset);
  const { projectId } = useParams<{ projectId: string }>();

  // Create a promise that will fetch the bundled MDX content
  // This must be called before any early returns to satisfy React Hooks rules
  const bundlePromise = useMemo(() => {
    return new Promise<BundleMDXResult>((resolve, reject) => {
      const params = new URLSearchParams({
        projectId,
        path: componentPath,
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
  }, [projectId, componentPath]);

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
          <MdxRenderer bundlePromise={bundlePromise} />
        </Suspense>
      </ErrorBoundary>
    </NodeViewWrapper>
  );
}
