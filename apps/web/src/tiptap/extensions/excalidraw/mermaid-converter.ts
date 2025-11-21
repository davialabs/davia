"use client";

/**
 * Check if mermaid content exists and convert it to excalidraw format
 * @param data - API response data containing content, mermaid, and mermaidAbsolutePath
 * @param projectId - Project ID
 * @param path - Original path to the excalidraw file
 * @returns Converted content string or null if no mermaid
 */
export async function checkAndConvertMermaid(
  data: {
    content?: string | null;
    mermaid?: string | null;
    mermaidAbsolutePath?: string | null;
  },
  projectId: string,
  path: string
): Promise<string | null> {
  // If no mermaid, return original content
  if (!data.mermaid) {
    return data.content ?? null;
  }

  // Dynamically import to avoid SSR issues with @excalidraw/excalidraw
  const [{ parseMermaidToExcalidraw }, { convertToExcalidrawElements }] =
    await Promise.all([
      import("@excalidraw/mermaid-to-excalidraw"),
      import("@excalidraw/excalidraw"),
    ]);

  let mermaidFiles: unknown;
  let excalidrawElements: unknown[];

  try {
    // Parse mermaid to excalidraw
    const parseResult = await parseMermaidToExcalidraw(data.mermaid);
    mermaidFiles = parseResult.files;

    // Convert to excalidraw elements
    excalidrawElements = convertToExcalidrawElements(parseResult.elements);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const mermaidPath = data.mermaidAbsolutePath || path;
    throw new Error(
      `Error converting Mermaid to Excalidraw for mermaid \`${mermaidPath}\`: ${errorMessage}`
    );
  }

  // Build result object
  const result: {
    elements: unknown[];
    appState?: unknown;
    files?: unknown;
  } = {
    elements: excalidrawElements,
  };

  // If original content exists, merge it
  if (data.content) {
    try {
      const existingContent = JSON.parse(data.content);

      // Preserve appState if it exists
      if (existingContent.appState) {
        result.appState = existingContent.appState;
      }

      // Merge files if they exist
      if (mermaidFiles || existingContent.files) {
        if (
          Array.isArray(mermaidFiles) &&
          Array.isArray(existingContent.files)
        ) {
          result.files = [...existingContent.files, ...mermaidFiles];
        } else if (
          typeof mermaidFiles === "object" &&
          typeof existingContent.files === "object"
        ) {
          result.files = { ...existingContent.files, ...mermaidFiles };
        } else {
          result.files = mermaidFiles || existingContent.files;
        }
      }
    } catch (parseError) {
      // If parsing fails, just use the mermaid-converted content
      console.warn(
        "Failed to parse existing content, using only mermaid conversion:",
        parseError
      );
      if (mermaidFiles) {
        result.files = mermaidFiles;
      }
    }
  } else {
    // No existing content, just use mermaid files if they exist
    if (mermaidFiles) {
      result.files = mermaidFiles;
    }
  }

  // Stringify the result
  const stringifiedResult = JSON.stringify(result);

  // POST to /api/mermaid to save and delete mermaid file
  if (data.mermaidAbsolutePath) {
    try {
      const response = await fetch("/api/mermaid", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          originalPath: path,
          mermaidAbsolutePath: data.mermaidAbsolutePath,
          content: stringifiedResult,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(
          "Failed to save converted mermaid:",
          errorData.error || "Unknown error"
        );
      }
    } catch (fetchError) {
      console.error("Error calling /api/mermaid:", fetchError);
    }
  }

  return stringifiedResult;
}
