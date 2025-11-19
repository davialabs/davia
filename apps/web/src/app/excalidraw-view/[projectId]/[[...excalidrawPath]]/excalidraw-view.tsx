"use client";

import { Excalidraw, serializeAsJSON } from "@excalidraw/excalidraw";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { AppState, BinaryFiles } from "@excalidraw/excalidraw/types";
import "@excalidraw/excalidraw/index.css";
import { useMemo, useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useHasMounted } from "@/hooks/use-has-mounted";
import { useDebounceCallback } from "usehooks-ts";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

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
  const [excalidrawAPI, setExcalidrawAPI] =
    useState<ExcalidrawImperativeAPI | null>(null);

  const sceneData = useMemo(() => {
    const data = JSON.parse(excalidrawContent);
    const parsed = {
      elements: data?.elements ?? [],
      files: data?.files ?? {},
      appState: data?.appState,
    };
    return parsed;
  }, [excalidrawContent]);

  // Map resolvedTheme to Excalidraw's theme format
  // resolvedTheme is "light" | "dark" | undefined
  const excalidrawTheme =
    mounted && resolvedTheme === "dark" ? "dark" : "light";

  // Set scene data and fit to viewport when Excalidraw API is ready
  useEffect(() => {
    if (excalidrawAPI) {
      // Wait for the canvas to be fully initialized
      const timeoutId = setTimeout(() => {
        // Prepare appState with zen mode and background color
        const appState = {
          zenModeEnabled: true,
          ...(excalidrawTheme === "light" && {
            viewBackgroundColor: "#fafafa",
          }),
          ...sceneData.appState,
        };

        // Update the scene with all data at once (this cleans and reloads the scene)
        excalidrawAPI.updateScene({
          elements: sceneData.elements || [],
          appState,
        });

        // Only scroll to content if there are elements
        if (sceneData.elements && sceneData.elements.length > 0) {
          excalidrawAPI.scrollToContent(undefined, {
            fitToViewport: true,
            viewportZoomFactor: 1.2,
          });
        }
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [excalidrawAPI, sceneData, excalidrawTheme]);

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
          await response.json().catch(() => ({}));
          return;
        }
      } catch {
        // Error updating content
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

  // Prepare initial appState with zen mode and background color for light mode
  const initialAppState = useMemo(() => {
    const state: Partial<AppState> = { zenModeEnabled: true };
    if (excalidrawTheme === "light") {
      state.viewBackgroundColor = "#fafafa";
    }
    return state;
  }, [excalidrawTheme]);

  return (
    <div style={{ height: "40rem" }}>
      <Excalidraw
        initialData={{
          files: sceneData.files,
          appState: initialAppState,
        }}
        excalidrawAPI={(api) => setExcalidrawAPI(api)}
        theme={excalidrawTheme}
        onChange={handleChange}
      />
    </div>
  );
}
