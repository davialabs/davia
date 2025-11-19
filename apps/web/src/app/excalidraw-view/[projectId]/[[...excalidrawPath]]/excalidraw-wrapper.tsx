"use client";

import dynamic from "next/dynamic";

const ExcalidrawView = dynamic(
  async () => (await import("./excalidraw-view")).ExcalidrawView,
  {
    ssr: false,
  }
);

export function ExcalidrawWrapper({
  projectId,
  excalidrawPath,
  excalidrawContent,
  isMermaid,
}: {
  projectId: string;
  excalidrawPath: string;
  excalidrawContent: string;
  isMermaid?: boolean;
}) {
  return (
    <ExcalidrawView
      projectId={projectId}
      excalidrawPath={excalidrawPath}
      excalidrawContent={excalidrawContent}
      isMermaid={isMermaid}
    />
  );
}
