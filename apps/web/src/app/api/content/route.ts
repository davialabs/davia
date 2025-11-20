import { existsSync, readFileSync, writeFileSync } from "fs";
import { join, basename } from "path";
import { NextRequest, NextResponse } from "next/server";
import { readProjects, findProjectById } from "@/lib/projects";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const projectId = searchParams.get("projectId");
  const path = searchParams.get("path");

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
  const assetPath = join(project.path, ".davia", "assets");
  const filePath = join(assetPath, path);

  // Check if the file exists
  if (!existsSync(filePath)) {
    // Check if this is a data/*.json file request and if a corresponding mermaid exists
    if (path.startsWith("data/") && path.endsWith(".json")) {
      const fileBasename = basename(path, ".json");
      const mermaidPath = join(assetPath, "mermaids", `${fileBasename}.mmd`);

      if (existsSync(mermaidPath)) {
        try {
          // Read the mermaid content
          const mermaidContent = readFileSync(mermaidPath, "utf-8");
          // Return mermaid content with a special flag so client knows to convert it
          return NextResponse.json({
            content: mermaidContent,
            isMermaid: true,
            mermaidPath: `mermaids/${fileBasename}.mmd`,
            targetPath: path,
          });
        } catch (error) {
          console.error(`Error reading mermaid file ${mermaidPath}:`, error);
        }
      }
    }

    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  // Read the file content
  try {
    const content = readFileSync(filePath, "utf-8");
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
      writeFileSync(filePath, content, "utf-8");
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
