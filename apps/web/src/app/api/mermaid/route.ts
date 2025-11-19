import { existsSync, readFileSync, writeFileSync, unlinkSync } from "fs";
import { join, basename } from "path";
import { NextRequest, NextResponse } from "next/server";
import { readProjects, findProjectById } from "@/lib/projects";

/**
 * GET /api/mermaid?projectId=xxx&excalidrawPath=data/diagram.json
 * Checks if a mermaid file exists and returns its content
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const projectId = searchParams.get("projectId");
  const excalidrawPath = searchParams.get("excalidrawPath");

  if (!projectId || !excalidrawPath) {
    return NextResponse.json(
      { error: "Missing projectId or excalidrawPath parameter" },
      { status: 400 }
    );
  }

  // Read projects and find project by id
  const projects = await readProjects();
  const project = findProjectById(projects, projectId);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Extract the filename without extension from the excalidraw path
  const excalidrawBasename = basename(excalidrawPath, ".json");

  // Construct the mermaid file path in assets/mermaids/
  const assetsPath = join(project.path, ".davia", "assets");
  const mermaidPath = join(assetsPath, "mermaids", `${excalidrawBasename}.mmd`);

  // Check if mermaid file exists
  if (!existsSync(mermaidPath)) {
    return NextResponse.json({ exists: false });
  }

  try {
    // Read the mermaid content
    const mermaidContent = readFileSync(mermaidPath, "utf-8");
    return NextResponse.json({
      exists: true,
      content: mermaidContent,
      mermaidPath: `mermaids/${excalidrawBasename}.mmd`,
    });
  } catch (error) {
    console.error(`Error reading mermaid file ${mermaidPath}:`, error);
    return NextResponse.json(
      { error: "Failed to read mermaid file" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/mermaid
 * Saves the converted excalidraw JSON and deletes the source mermaid file
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, excalidrawPath, jsonContent, mermaidPath } = body;

    if (!projectId || !excalidrawPath || !jsonContent || !mermaidPath) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Read projects and find project by id
    const projects = await readProjects();
    const project = findProjectById(projects, projectId);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const assetsPath = join(project.path, ".davia", "assets");

    // Save the JSON file
    const targetJsonPath = join(assetsPath, excalidrawPath);
    writeFileSync(targetJsonPath, jsonContent, "utf-8");

    // Delete the mermaid file
    const fullMermaidPath = join(assetsPath, mermaidPath);
    if (existsSync(fullMermaidPath)) {
      unlinkSync(fullMermaidPath);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing mermaid conversion:", error);
    return NextResponse.json(
      { error: "Failed to save converted file" },
      { status: 500 }
    );
  }
}
