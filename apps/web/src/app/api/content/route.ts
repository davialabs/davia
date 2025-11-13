import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { NextRequest, NextResponse } from "next/server";

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

  // Get monorepo root from environment variable
  const monorepoRoot = process.env.DAVIA_MONOREPO_ROOT;

  if (!monorepoRoot) {
    return NextResponse.json(
      { error: "DAVIA_MONOREPO_ROOT environment variable is not set" },
      { status: 500 }
    );
  }

  // Construct the file paths
  const assetPath = join(monorepoRoot, ".davia", "assets", projectId);
  const proposedPath = join(monorepoRoot, ".davia", "proposed", projectId);
  const assetFilePath = join(assetPath, path);
  const proposedFilePath = join(proposedPath, path);

  // Check if the asset file exists
  if (!existsSync(assetFilePath)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  // Read the asset file content
  try {
    const content = readFileSync(assetFilePath, "utf-8");

    // Check if proposed content exists
    let proposedContent: string | null = null;
    if (existsSync(proposedFilePath)) {
      try {
        proposedContent = readFileSync(proposedFilePath, "utf-8");
      } catch (error) {
        console.error(
          `Error reading proposed file ${proposedFilePath}:`,
          error
        );
        // Continue without proposed content if there's an error reading it
      }
    }

    return NextResponse.json({
      content,
      proposedContent: proposedContent ?? null,
    });
  } catch (error) {
    console.error(`Error reading ${assetFilePath}:`, error);
    return NextResponse.json({ error: "Failed to read file" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, path, content, proposedContent } = body;

    if (!projectId || !path || content === undefined) {
      return NextResponse.json(
        { error: "Missing projectId, path, or content parameter" },
        { status: 400 }
      );
    }

    // Get monorepo root from environment variable
    const monorepoRoot = process.env.DAVIA_MONOREPO_ROOT;

    if (!monorepoRoot) {
      return NextResponse.json(
        { error: "DAVIA_MONOREPO_ROOT environment variable is not set" },
        { status: 500 }
      );
    }

    // Construct the file paths
    const assetPath = join(monorepoRoot, ".davia", "assets", projectId);
    const proposedPath = join(monorepoRoot, ".davia", "proposed", projectId);
    const assetFilePath = join(assetPath, path);
    const proposedFilePath = join(proposedPath, path);

    // Ensure directories exist
    const { mkdir } = await import("fs/promises");
    try {
      await mkdir(assetPath, { recursive: true });
      if (proposedContent !== undefined) {
        await mkdir(proposedPath, { recursive: true });
      }
    } catch (error) {
      // Directory might already exist, ignore error
    }

    // Write the asset file content
    try {
      writeFileSync(assetFilePath, content, "utf-8");
    } catch (error) {
      console.error(`Error writing ${assetFilePath}:`, error);
      return NextResponse.json(
        { error: "Failed to write file" },
        { status: 500 }
      );
    }

    // Handle proposed content
    if (proposedContent !== undefined) {
      if (proposedContent === null) {
        // Delete proposed file if it exists
        if (existsSync(proposedFilePath)) {
          try {
            const { unlink } = await import("fs/promises");
            await unlink(proposedFilePath);
          } catch (error) {
            console.error(
              `Error deleting proposed file ${proposedFilePath}:`,
              error
            );
            // Continue even if deletion fails
          }
        }
      } else {
        // Write proposed content
        try {
          writeFileSync(proposedFilePath, proposedContent, "utf-8");
        } catch (error) {
          console.error(
            `Error writing proposed file ${proposedFilePath}:`,
            error
          );
          return NextResponse.json(
            { error: "Failed to write proposed file" },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
