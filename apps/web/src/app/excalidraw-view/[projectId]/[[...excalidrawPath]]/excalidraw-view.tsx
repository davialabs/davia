"use client";

import { useMemo, useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useHasMounted } from "@/hooks/use-has-mounted";
import { useDebounceCallback } from "usehooks-ts";
import { Excalidraw, serializeAsJSON } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { AppState, BinaryFiles } from "@excalidraw/excalidraw/types";
import "@excalidraw/excalidraw/index.css";

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
    return {
      elements: data?.elements ?? [],
      files: data?.files ?? {},
      appState: data?.appState,
    };
  }, [excalidrawContent]);

  // Set scene data and fit to viewport when Excalidraw API is ready
  useEffect(() => {
    if (!excalidrawAPI) return;

    const timeout = setTimeout(() => {
      // Update the scene with the parsed data
      excalidrawAPI.updateScene({
        elements: sceneData.elements,
        appState: sceneData.appState,
      });
      excalidrawAPI.scrollToContent(excalidrawAPI.getSceneElements(), {
        fitToContent: true,
      });

      if (sceneData.files) {
        excalidrawAPI.addFiles(sceneData.files);
      }
    }, 200);

    return () => clearTimeout(timeout);
  }, [excalidrawAPI, sceneData]);

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

  // Map resolvedTheme to Excalidraw's theme format
  // resolvedTheme is "light" | "dark" | undefined
  const excalidrawTheme =
    mounted && resolvedTheme === "dark" ? "dark" : "light";

  const initialAppState: Partial<AppState> = useMemo(() => {
    const state: Partial<AppState> = { zenModeEnabled: true };
    if (excalidrawTheme === "light") {
      state.viewBackgroundColor = "#fafafa";
    }
    return state;
  }, [excalidrawTheme]);

  if (!mounted) return null;

  return (
    <>
      <style>{`
      html, body, #__next {
        height: 100%;
        margin: 0;
        padding: 0;
      }
    `}</style>
      <div style={{ height: "100%", width: "100%" }}>
        <Excalidraw
          initialData={{
            appState: initialAppState,
          }}
          excalidrawAPI={(api) => setExcalidrawAPI(api)}
          theme={excalidrawTheme}
          onChange={handleChange}
        />
      </div>
    </>
  );
}
