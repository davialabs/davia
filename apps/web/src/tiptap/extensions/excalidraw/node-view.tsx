"use client";

import { useEffect, useMemo, useState } from "react";
import { NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import { useProjects } from "@/providers/projects-provider";
import { usePageRegistryStore } from "@/providers/page-registry";
import { ErrorBoundary } from "react-error-boundary";
import { ExcalidrawErrorFallback, ExcalidrawLoading } from "./fallback-views";
import { FloatingToolbar } from "./floating-toolbar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { Maximize2 } from "lucide-react";
import { capitalCase } from "change-case";

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
        <ExcalidrawView excalidrawPath={excalidrawPath} editor={props.editor} />
      </ErrorBoundary>
    </NodeViewWrapper>
  );
}

function ExcalidrawView({
  excalidrawPath,
  editor,
}: {
  excalidrawPath: string;
  editor?: ReactNodeViewProps["editor"];
}) {
  const { currentProject } = useProjects();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const excalidrawTitle = useMemo(() => {
    // Extract filename from path (e.g., "data/my-page/my-excalidraw.json" -> "my-excalidraw.json")
    const filename = excalidrawPath.split("/").pop() || "";

    // Remove extension (e.g., "my-excalidraw.json" -> "my-excalidraw")
    const nameWithoutExtension = filename.replace(/\.[^/.]+$/, "");

    // Transform to capital case (e.g., "my-excalidraw" -> "My Excalidraw")
    return capitalCase(nameWithoutExtension);
  }, [excalidrawPath]);

  return (
    <>
      <div className="group relative w-full h-160 my-4 flex items-center justify-center bg-muted">
        {!isFullscreen ? (
          <>
            <iframe
              src={`/excalidraw-view/${currentProject?.id}/${excalidrawPath}`}
              className="w-full h-full"
              title="Excalidraw"
            />
            {/* Floating toolbar in top right corner */}
            {editor && editor.isEditable && (
              <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <FloatingToolbar
                  editor={editor}
                  onFullscreenClick={() => setIsFullscreen(true)}
                />
              </div>
            )}
          </>
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Maximize2 />
              </EmptyMedia>
              <EmptyTitle>Full Screen Mode</EmptyTitle>
              <EmptyDescription>
                {excalidrawTitle} is currently being viewed in full screen mode.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>

      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="min-w-[95dvw] h-[95dvh] gap-2 flex flex-col">
          <DialogHeader>
            <DialogTitle className="sr-only">Excalidraw</DialogTitle>
            <DialogDescription>{excalidrawTitle}</DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0">
            <iframe
              src={`/excalidraw-view/${currentProject?.id}/${excalidrawPath}`}
              className="w-full h-full"
              title="Excalidraw"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
