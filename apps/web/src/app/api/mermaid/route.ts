import fs from "fs-extra";
import { join } from "path";
import { NextRequest, NextResponse } from "next/server";
import { readProjects, findProjectById } from "@/lib/projects";

/**
 * POST /api/mermaid
 * Saves the converted excalidraw JSON and deletes the source mermaid file
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, originalPath, mermaidAbsolutePath, content } = body;

    if (!projectId || !originalPath || !content || !mermaidAbsolutePath) {
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

    // Delete the mermaid file (mermaidAbsolutePath is already absolute)
    if (await fs.pathExists(mermaidAbsolutePath)) {
      await fs.remove(mermaidAbsolutePath);
    }

    // Write/replace the content at original path
    const targetPath = join(assetsPath, originalPath);
    await fs.outputFile(targetPath, content, "utf-8");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing mermaid conversion:", error);
    return NextResponse.json(
      { error: "Failed to save converted file" },
      { status: 500 }
    );
  }
}
