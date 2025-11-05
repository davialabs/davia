"use client";

import { useEffect } from "react";
import { NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import { usePageRegistryStore } from "@/providers/page-registry";
import { ErrorBoundary } from "react-error-boundary";
import { DatabaseErrorFallback, DatabaseLoading } from "./fallback-views";
import { DatabaseRenderer } from "./renderer";

export function DatabaseNodeView(props: ReactNodeViewProps) {
  const databasePath = props.node.attrs["data-path"];
  const entry = usePageRegistryStore((state) => state.assets.get(databasePath));
  const ensureAsset = usePageRegistryStore((state) => state.ensureAsset);

  useEffect(() => {
    if (!entry) {
      ensureAsset(databasePath);
    }
  }, [databasePath, ensureAsset, entry]);

  if (!entry || !entry.synced)
    return (
      <NodeViewWrapper>
        <DatabaseLoading />
      </NodeViewWrapper>
    );
  if (entry.error)
    return (
      <NodeViewWrapper>
        <DatabaseErrorFallback
          error={entry.error}
          props={props}
          content={entry.content ?? ""}
        />
      </NodeViewWrapper>
    );

  // Show synced state
  return (
    <NodeViewWrapper>
      <ErrorBoundary
        FallbackComponent={({ error }) => (
          <DatabaseErrorFallback
            error={error?.message || JSON.stringify(error, null, 2)}
            props={props}
            content={entry.content ?? ""}
          />
        )}
      >
        <DatabaseRenderer databasePath={databasePath} />
      </ErrorBoundary>
    </NodeViewWrapper>
  );
}
