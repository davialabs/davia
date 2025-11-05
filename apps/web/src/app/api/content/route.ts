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

  // Construct the file path
  const assetPath = join(monorepoRoot, ".davia", "assets", projectId);
  const filePath = join(assetPath, path);

  // Check if the file exists
  if (!existsSync(filePath)) {
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

    // Get monorepo root from environment variable
    const monorepoRoot = process.env.DAVIA_MONOREPO_ROOT;

    if (!monorepoRoot) {
      return NextResponse.json(
        { error: "DAVIA_MONOREPO_ROOT environment variable is not set" },
        { status: 500 }
      );
    }

    // Construct the file path
    const assetPath = join(monorepoRoot, ".davia", "assets", projectId);
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
