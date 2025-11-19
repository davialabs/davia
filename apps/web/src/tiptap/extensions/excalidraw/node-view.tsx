"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import { usePageRegistryStore } from "@/providers/page-registry";
import { ErrorBoundary } from "react-error-boundary";
import { checkAndConvertMermaid } from "@/lib/mermaid-converter";
import { ExcalidrawErrorFallback, ExcalidrawLoading } from "./fallback-views";

export function ExcalidrawNodeView(props: ReactNodeViewProps) {
  const { projectId } = useParams<{ projectId: string }>();
  const excalidrawPath = props.node.attrs["data-path"];
  const entry = usePageRegistryStore((state) =>
    state.assets.get(excalidrawPath)
  );
  const ensureAsset = usePageRegistryStore((state) => state.ensureAsset);
  const [iframeKey, setIframeKey] = useState(0);
  const [hasCheckedMermaid, setHasCheckedMermaid] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  useEffect(() => {
    if (!entry) {
      ensureAsset(excalidrawPath);
    }
  }, [excalidrawPath, ensureAsset, entry]);

  // Check for mermaid and convert if it exists
  useEffect(() => {
    if (!entry || !entry.synced || hasCheckedMermaid || isConverting) {
      return;
    }

    setHasCheckedMermaid(true);

    const checkAndConvert = async () => {
      setIsConverting(true);
      try {
        const convertedContent = await checkAndConvertMermaid(
          projectId,
          excalidrawPath
        );
        if (convertedContent) {
          // Reload iframe by updating its key to force a complete reload
          setIframeKey((prev) => prev + 1);
        }
      } catch {
        // Error during mermaid conversion
      } finally {
        setIsConverting(false);
      }
    };

    checkAndConvert();
  }, [entry, projectId, excalidrawPath, isConverting, hasCheckedMermaid]);

  if (!entry || !entry.synced || isConverting) {
    return (
      <NodeViewWrapper>
        <ExcalidrawLoading />
      </NodeViewWrapper>
    );
  }

  if (entry.error) {
    return (
      <NodeViewWrapper>
        <ExcalidrawErrorFallback
          error={entry.error}
          props={props}
          content={entry.content ?? ""}
        />
      </NodeViewWrapper>
    );
  }

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
          key={iframeKey}
          src={`/excalidraw-view/${projectId}/${excalidrawPath}`}
          className="w-full h-160"
          title="Excalidraw"
        />
      </ErrorBoundary>
    </NodeViewWrapper>
  );
}
