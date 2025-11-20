import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { NextRequest, NextResponse } from "next/server";
import { bundleMDX } from "mdx-bundler";
import type { Plugin } from "esbuild";
import { createShadcnPlugin, createDaviaDataPlugin } from "./plugins";
import type { DataCollector, BundlingResult } from "./types";
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
  const assetsPath = join(project.path, ".davia", "assets");
  const filePath = join(assetsPath, path);

  // Check if the file exists
  if (!existsSync(filePath)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  try {
    // Read the MDX file content
    const mdxSource = readFileSync(filePath, "utf-8");

    // If content is empty after trimming, return non-200 status
    if (!mdxSource.trim()) {
      return NextResponse.json(
        { error: "File content is empty" },
        { status: 400 }
      );
    }

    // Collect data needed
    const dataCollector: DataCollector = new Set();

    // Get shadcn path from public directory
    // Try multiple possible locations to handle both dev and production builds
    const possiblePaths = [
      join(process.cwd(), "public", "shadcn"), // Dev: apps/web/public/shadcn
      join(process.cwd(), "..", "..", "public", "shadcn"), // Standalone: from apps/web up to public
      join(process.cwd(), "..", "public", "shadcn"), // Alternative standalone location
    ];

    let shadcnPath: string | undefined;
    for (const path of possiblePaths) {
      if (existsSync(path)) {
        shadcnPath = path;
        break;
      }
    }

    if (!shadcnPath) {
      return NextResponse.json(
        {
          error:
            "shadcn directory not found. Please ensure public/shadcn exists.",
        },
        { status: 500 }
      );
    }

    // Set up globals
    const globals = {
      "@mdx-js/react": {
        varName: "MdxJsReact",
        namedExports: ["useMDXComponents"],
        defaultExport: false,
      },
      sonner: { varName: "Sonner", namedExports: ["toast", "Toaster"] },
      "next-themes": {
        varName: "NextThemes",
        namedExports: ["useTheme"],
      },
    };

    // Set up plugins
    const plugins: Plugin[] = [
      createShadcnPlugin(shadcnPath),
      createDaviaDataPlugin(dataCollector),
    ];

    // Bundle MDX
    const result = await bundleMDX({
      source: mdxSource,
      globals,
      mdxOptions(options) {
        return {
          ...options,
          providerImportSource: "@mdx-js/react",
        };
      },
      esbuildOptions: (options) => {
        return {
          ...options,
          external: ["sonner", "next-themes", ...(options.external || [])],
          plugins: [...plugins, ...(options.plugins || [])],
        };
      },
    });

    const bundlingResult: BundlingResult = {
      result,
      dataImports: Array.from(dataCollector),
    };

    return NextResponse.json(bundlingResult);
  } catch (error) {
    console.error("MDX bundling error:", error);
    return NextResponse.json(
      {
        error: `Failed to bundle MDX: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 }
    );
  }
}
