import fs from "fs-extra";
import { join } from "path";
import { NextRequest, NextResponse } from "next/server";
import { readProjects, findProjectById } from "@/lib/projects";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const projectId = searchParams.get("projectId");
  const path = searchParams.get("path");
  const isExcalidraw = searchParams.get("isExcalidraw") === "true";

  if (!projectId || !path) {
    return NextResponse.json(
      { error: "Missing projectId or path parameter" },
      { status: 400 }
    );
  }

  // Read projects and find project by id
  const projects = await readProjects();
  const project = findProjectById(projects, projectId);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Construct the file path
  const assetsPath = join(project.path, ".davia", "assets");

  // Handle Excalidraw case
  if (isExcalidraw) {
    // Path will be like "data/[some/path].json"
    // Extract the base path: "[some/path]" from "data/[some/path].json"
    const jsonFilePath = join(assetsPath, path);
    const jsonFileExists = await fs.pathExists(jsonFilePath);

    // Extract base path for mermaid file
    // Remove "data/" prefix and ".json" suffix
    let basePath = path;
    if (basePath.startsWith("data/")) {
      basePath = basePath.slice(5); // Remove "data/" prefix
    }
    if (basePath.endsWith(".json")) {
      basePath = basePath.slice(0, -5); // Remove ".json" suffix
    }

    // Check for mermaid files
    const mermaidPath1 = join(assetsPath, "mermaids", `${basePath}.mermaid`);
    const mermaidPath2 = join(assetsPath, "mermaids", `${basePath}.mmd`);
    const mermaidExists1 = await fs.pathExists(mermaidPath1);
    const mermaidExists2 = await fs.pathExists(mermaidPath2);
    const mermaidPath = mermaidExists1
      ? mermaidPath1
      : mermaidExists2
        ? mermaidPath2
        : null;

    // If neither exists, return error
    if (!jsonFileExists && !mermaidPath) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Read content if it exists
    let content: string | null = null;
    if (jsonFileExists) {
      try {
        content = await fs.readFile(jsonFilePath, "utf-8");
      } catch (error) {
        console.error(`Error reading ${jsonFilePath}:`, error);
        return NextResponse.json(
          { error: "Failed to read file" },
          { status: 500 }
        );
      }
    }

    // Read mermaid if it exists
    let mermaid: string | null = null;
    let mermaidAbsolutePath: string | null = null;
    if (mermaidPath) {
      try {
        mermaid = await fs.readFile(mermaidPath, "utf-8");
        mermaidAbsolutePath = mermaidPath;
      } catch (error) {
        console.error(`Error reading ${mermaidPath}:`, error);
        // Don't fail if mermaid read fails, just log it
      }
    }

    return NextResponse.json({
      content,
      mermaid,
      mermaidAbsolutePath,
    });
  }

  // Regular file handling
  const filePath = join(assetsPath, path);

  // Check if the file exists
  if (!(await fs.pathExists(filePath))) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  // Read the file content
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return NextResponse.json({ content });
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return NextResponse.json({ error: "Failed to read file" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, path, content } = body;

    if (!projectId || !path || content === undefined) {
      return NextResponse.json(
        { error: "Missing projectId, path, or content parameter" },
        { status: 400 }
      );
    }

    // Read projects and find project by id
    const projects = await readProjects();
    const project = findProjectById(projects, projectId);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Construct the file path
    const assetPath = join(project.path, ".davia", "assets");
    const filePath = join(assetPath, path);

    // Write the file content
    try {
      await fs.outputFile(filePath, content, "utf-8");
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error(`Error writing ${filePath}:`, error);
      return NextResponse.json(
        { error: "Failed to write file" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
