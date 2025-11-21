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
}: {
  projectId: string;
  excalidrawPath: string;
  excalidrawContent: string;
}) {
  return (
    <ExcalidrawView
      projectId={projectId}
      excalidrawPath={excalidrawPath}
      excalidrawContent={excalidrawContent}
    />
  );
}
