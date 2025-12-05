"use client";

/**
 * Excalidraw font definitions for loading before mermaid conversion.
 * These must be loaded so parseMermaidToExcalidraw can correctly measure text with getBBox().
 */
const EXCALIDRAW_FONTS = [
  // Excalifont - hand-drawn style font (load all subsets for full character coverage)
  {
    family: "Excalifont",
    source:
      "url(/excalidraw-fonts/Excalifont/Excalifont-Regular-349fac6ca4700ffec595a7150a0d1e1d.woff2)",
  },
  {
    family: "Excalifont",
    source:
      "url(/excalidraw-fonts/Excalifont/Excalifont-Regular-3f2c5db56cc93c5a6873b1361d730c16.woff2)",
  },
  {
    family: "Excalifont",
    source:
      "url(/excalidraw-fonts/Excalifont/Excalifont-Regular-41b173a47b57366892116a575a43e2b6.woff2)",
  },
  {
    family: "Excalifont",
    source:
      "url(/excalidraw-fonts/Excalifont/Excalifont-Regular-623ccf21b21ef6b3a0d87738f77eb071.woff2)",
  },
  {
    family: "Excalifont",
    source:
      "url(/excalidraw-fonts/Excalifont/Excalifont-Regular-a88b72a24fb54c9f94e3b5fdaa7481c9.woff2)",
  },
  {
    family: "Excalifont",
    source:
      "url(/excalidraw-fonts/Excalifont/Excalifont-Regular-b9dcf9d2e50a1eaf42fc664b50a3fd0d.woff2)",
  },
  {
    family: "Excalifont",
    source:
      "url(/excalidraw-fonts/Excalifont/Excalifont-Regular-be310b9bcd4f1a43f571c46df7809174.woff2)",
  },
  // Assistant - normal text font
  {
    family: "Assistant",
    source: "url(/excalidraw-fonts/Assistant/Assistant-Regular.woff2)",
    descriptors: { weight: "400" },
  },
  {
    family: "Assistant",
    source: "url(/excalidraw-fonts/Assistant/Assistant-Medium.woff2)",
    descriptors: { weight: "500" },
  },
  {
    family: "Assistant",
    source: "url(/excalidraw-fonts/Assistant/Assistant-SemiBold.woff2)",
    descriptors: { weight: "600" },
  },
  {
    family: "Assistant",
    source: "url(/excalidraw-fonts/Assistant/Assistant-Bold.woff2)",
    descriptors: { weight: "700" },
  },
] as const;

let fontsLoaded = false;

/**
 * Ensures the Excalidraw fonts (Excalifont and Assistant) are loaded before mermaid conversion.
 * This is necessary because parseMermaidToExcalidraw uses getBBox() to measure
 * text dimensions, which must match the fonts Excalidraw will use for rendering.
 */
async function ensureExcalidrawFontsLoaded(): Promise<void> {
  if (fontsLoaded) {
    return;
  }

  const loadPromises = EXCALIDRAW_FONTS.map(async (fontDef) => {
    try {
      const font = new FontFace(
        fontDef.family,
        fontDef.source,
        "descriptors" in fontDef ? fontDef.descriptors : undefined
      );
      await font.load();
      document.fonts.add(font);
    } catch {
      // Some font subsets may fail to load, that's okay
    }
  });

  await Promise.all(loadPromises);
  await document.fonts.ready;

  fontsLoaded = true;
}

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
    // Ensure Excalidraw fonts are loaded before parsing for correct text measurements
    await ensureExcalidrawFontsLoaded();

    // Parse mermaid to excalidraw
    const parseResult = await parseMermaidToExcalidraw(data.mermaid);
    mermaidFiles = parseResult.files;

    // Convert to excalidraw elements
    excalidrawElements = convertToExcalidrawElements(parseResult.elements);

    // Process text elements to replace literal \\n and <br> with spaces
    // while preserving actual newline characters (\n)
    excalidrawElements = excalidrawElements.map((element) => {
      if (typeof element !== "object" || element === null) {
        return element;
      }

      const el = element as Record<string, unknown>;

      // Process text and originalText properties if they exist
      if (typeof el.text === "string") {
        el.text = el.text
          .replace(/\\n/g, " ") // Replace literal \n (backslash + n)
          .replace(/<br\s*\/?>/gi, " "); // Replace <br>, <br/>, <br />
      }

      if (typeof el.originalText === "string") {
        el.originalText = el.originalText
          .replace(/\\n/g, " ") // Replace literal \n (backslash + n)
          .replace(/<br\s*\/?>/gi, " "); // Replace <br>, <br/>, <br />
      }

      return el;
    });
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
