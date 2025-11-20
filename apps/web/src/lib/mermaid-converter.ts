/**
 * Client-side mermaid to excalidraw converter
 * Uses browser-based libraries to convert mermaid diagrams to excalidraw JSON
 */

// Cache for loaded modules
let converterModules: {
  parseMermaidToExcalidraw: (
    content: string
  ) => Promise<{ elements: unknown[]; files?: unknown }>;
  convertToExcalidrawElements: (elements: unknown[]) => unknown[];
} | null = null;

/**
 * Load the converter modules dynamically
 */
async function loadConverterModules() {
  if (converterModules) {
    return converterModules;
  }

  console.log(
    "[Mermaid Converter] Loading CDN libraries via dynamic import..."
  );

  // Use Function constructor to bypass Turbopack's static analysis
  const importModule = new Function("url", "return import(url)");

  const [mermaidModule, excalidrawModule] = await Promise.all([
    importModule(
      "https://cdn.jsdelivr.net/npm/@excalidraw/mermaid-to-excalidraw@1.1.3/+esm"
    ),
    importModule(
      "https://cdn.jsdelivr.net/npm/@excalidraw/excalidraw@0.18.0/+esm"
    ),
  ]);

  converterModules = {
    parseMermaidToExcalidraw: mermaidModule.parseMermaidToExcalidraw,
    convertToExcalidrawElements: excalidrawModule.convertToExcalidrawElements,
  };

  console.log("[Mermaid Converter] ✓ Libraries loaded successfully");
  return converterModules;
}

/**
 * Convert mermaid content to excalidraw JSON format
 * @param mermaidContent - Mermaid diagram definition
 * @returns Excalidraw JSON string
 */
export async function convertMermaidToExcalidraw(
  mermaidContent: string
): Promise<string> {
  console.log("[Mermaid Converter] Starting conversion...", {
    contentLength: mermaidContent.length,
    contentPreview: mermaidContent.substring(0, 100),
  });

  try {
    const { parseMermaidToExcalidraw, convertToExcalidrawElements } =
      await loadConverterModules();

    console.log("[Mermaid Converter] Parsing mermaid diagram...");
    const { elements, files } = await parseMermaidToExcalidraw(mermaidContent);
    console.log(
      "[Mermaid Converter] ✓ Parsed, got elements:",
      elements?.length
    );

    console.log("[Mermaid Converter] Converting to excalidraw elements...");
    const excalidrawElements = convertToExcalidrawElements(elements);
    console.log(
      "[Mermaid Converter] ✓ Converted, got elements:",
      excalidrawElements?.length
    );

    // Build the result object
    const result: { elements: unknown[]; files?: unknown } = {
      elements: excalidrawElements,
    };
    if (files) {
      console.log("[Mermaid Converter] Including files in result");
      result.files = files;
    }

    const jsonString = JSON.stringify(result, null, 2);
    console.log("[Mermaid Converter] ✓ Conversion complete!", {
      jsonLength: jsonString.length,
    });

    return jsonString;
  } catch (error) {
    console.error("[Mermaid Converter] ✗ Conversion failed:", error);
    console.error(
      "[Mermaid Converter] Error stack:",
      error instanceof Error ? error.stack : "N/A"
    );
    throw error;
  }
}

/**
 * Check if a mermaid file exists and convert it
 * @param projectId - Project ID
 * @param excalidrawPath - Relative path to the target excalidraw file (e.g., "data/diagram.json")
 * @returns The converted JSON content if conversion happened, null if no mermaid file exists
 */
export async function checkAndConvertMermaid(
  projectId: string,
  excalidrawPath: string
): Promise<string | null> {
  try {
    console.log("[Mermaid Converter] Checking API for mermaid file:", {
      projectId,
      excalidrawPath,
    });

    // Check if mermaid file exists
    const checkResponse = await fetch(
      `/api/mermaid?projectId=${encodeURIComponent(projectId)}&excalidrawPath=${encodeURIComponent(excalidrawPath)}`
    );

    if (!checkResponse.ok) {
      console.log(
        "[Mermaid Converter] API check failed:",
        checkResponse.status
      );
      return null;
    }

    const checkData = await checkResponse.json();
    console.log("[Mermaid Converter] API response:", checkData);

    if (!checkData.exists) {
      console.log("[Mermaid Converter] No mermaid file exists");
      return null;
    }

    console.log("[Mermaid Converter] Mermaid file found, converting...");
    // Convert mermaid to excalidraw JSON
    const jsonContent = await convertMermaidToExcalidraw(checkData.content);
    console.log("[Mermaid Converter] Conversion complete, saving...");

    // Save the converted JSON and delete the mermaid file
    const saveResponse = await fetch("/api/mermaid", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        projectId,
        excalidrawPath,
        jsonContent,
        mermaidPath: checkData.mermaidPath,
      }),
    });

    if (!saveResponse.ok) {
      throw new Error("Failed to save converted file");
    }

    return jsonContent;
  } catch (error) {
    console.error("Error converting mermaid to excalidraw:", error);
    return null;
  }
}
