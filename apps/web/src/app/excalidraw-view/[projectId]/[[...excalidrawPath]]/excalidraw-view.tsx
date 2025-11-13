"use client";

import {
  Excalidraw,
  convertToExcalidrawElements,
  serializeAsJSON,
} from "@excalidraw/excalidraw";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { AppState, BinaryFiles } from "@excalidraw/excalidraw/types";
import "@excalidraw/excalidraw/index.css";
import { useMemo } from "react";
import { useTheme } from "next-themes";
import { useHasMounted } from "@/hooks/use-has-mounted";
import { useDebounceCallback } from "usehooks-ts";

export function ExcalidrawView({
  projectId,
  excalidrawPath,
  excalidrawContent,
}: {
  projectId: string;
  excalidrawPath: string;
  excalidrawContent: string;
}) {
  const mounted = useHasMounted();
  const { resolvedTheme } = useTheme();
  const elements = useMemo(() => {
    const data = JSON.parse(excalidrawContent);
    return convertToExcalidrawElements(data?.elements ?? []);
  }, [excalidrawContent]);
  const files = useMemo(() => {
    const data = JSON.parse(excalidrawContent);
    return data?.files ?? {};
  }, [excalidrawContent]);
  const appState = useMemo(() => {
    const data = JSON.parse(excalidrawContent);
    return data?.appState ?? {};
  }, [excalidrawContent]);

  // Map resolvedTheme to Excalidraw's theme format
  // resolvedTheme is "light" | "dark" | undefined
  const excalidrawTheme =
    mounted && resolvedTheme === "dark" ? "dark" : "light";

  const handleUpdate = useDebounceCallback(
    async (serializedContent: string, files: BinaryFiles) => {
      try {
        // Parse the serialized JSON string
        const parsed = JSON.parse(serializedContent);

        // Extract elements if they exist
        const contentObject: {
          elements?: unknown;
          files?: unknown;
          appState?: unknown;
        } = {};
        if (parsed?.elements) contentObject.elements = parsed.elements;
        if (parsed?.appState) contentObject.appState = parsed.appState;
        if (files && Object.keys(files).length > 0) contentObject.files = files;

        // Serialize the rebuilt object
        const content = JSON.stringify(contentObject, null, 2);

        const response = await fetch("/api/content", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            projectId,
            path: excalidrawPath,
            content,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Failed to update content:", errorData.error);
          return;
        }
      } catch (error) {
        console.error("Error updating content:", error);
      }
    },
    300 // 300ms debounce delay
  );

  const handleChange = (
    excalidrawElements: readonly ExcalidrawElement[],
    appState: AppState,
    files: BinaryFiles
  ) => {
    const serialized = serializeAsJSON(
      excalidrawElements,
      appState,
      files,
      "database"
    );
    handleUpdate(serialized, files);
  };

  return (
    <div style={{ height: "32rem" }}>
      <Excalidraw
        initialData={{ elements, files, appState, scrollToContent: true }}
        theme={excalidrawTheme}
        onChange={handleChange}
      />
    </div>
  );
}
