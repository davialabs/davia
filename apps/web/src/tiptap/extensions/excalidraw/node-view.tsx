"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import { usePageRegistryStore } from "@/providers/page-registry";
import { ErrorBoundary } from "react-error-boundary";
import { ExcalidrawErrorFallback, ExcalidrawLoading } from "./fallback-views";

export function ExcalidrawNodeView(props: ReactNodeViewProps) {
  const { projectId } = useParams<{ projectId: string }>();
  const excalidrawPath = props.node.attrs["data-path"];
  const entry = usePageRegistryStore((state) =>
    state.assets.get(excalidrawPath)
  );
  const ensureAsset = usePageRegistryStore((state) => state.ensureAsset);

  useEffect(() => {
    if (!entry) {
      ensureAsset(excalidrawPath);
    }
  }, [excalidrawPath, ensureAsset, entry]);

  if (!entry || !entry.synced)
    return (
      <NodeViewWrapper>
        <ExcalidrawLoading />
      </NodeViewWrapper>
    );
  if (entry.error)
    return (
      <NodeViewWrapper>
        <ExcalidrawErrorFallback
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
          <ExcalidrawErrorFallback
            error={error?.message || JSON.stringify(error, null, 2)}
            props={props}
            content={entry.content ?? ""}
          />
        )}
      >
        <iframe
          src={`/excalidraw-view/${projectId}/${excalidrawPath}`}
          className="w-full h-128"
          title="Excalidraw"
        />
      </ErrorBoundary>
    </NodeViewWrapper>
  );
}
