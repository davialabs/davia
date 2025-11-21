"use client";

import { useEffect } from "react";
import { NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import { useProjects } from "@/providers/projects-provider";
import { usePageRegistryStore } from "@/providers/page-registry";
import { ErrorBoundary } from "react-error-boundary";
import { ExcalidrawErrorFallback, ExcalidrawLoading } from "./fallback-views";

export function ExcalidrawNodeView(props: ReactNodeViewProps) {
  const { currentProject } = useProjects();
  const excalidrawPath = props.node.attrs["data-path"];
  const entry = usePageRegistryStore((state) =>
    state.assets.get(excalidrawPath)
  );
  const ensureAsset = usePageRegistryStore((state) => state.ensureAsset);

  useEffect(() => {
    if (!entry) {
      (async () => {
        await ensureAsset(excalidrawPath, { isExcalidraw: true });
      })();
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
          project={currentProject}
          path={excalidrawPath}
          content={entry.content}
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
            project={currentProject}
            path={excalidrawPath}
            content={entry.content}
          />
        )}
      >
        <iframe
          src={`/excalidraw-view/${currentProject?.id}/${excalidrawPath}`}
          className="w-full h-160"
          title="Excalidraw"
        />
      </ErrorBoundary>
    </NodeViewWrapper>
  );
}
