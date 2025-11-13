import { existsSync, readFileSync, writeFileSync, unlinkSync } from "fs";
import { join } from "path";
import { NextRequest, NextResponse } from "next/server";
import { bundleMDX } from "mdx-bundler";
import type { Plugin } from "esbuild";
import {
  createShadcnPlugin,
  createDaviaDataPlugin,
} from "../bundle-mdx/plugins";
import type { DataCollector } from "../bundle-mdx/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, path, resolveType } = body;

    if (!projectId || !path || !resolveType) {
      return NextResponse.json(
        { error: "Missing projectId, path, or resolveType parameter" },
        { status: 400 }
      );
    }

    if (resolveType !== "accept" && resolveType !== "reject") {
      return NextResponse.json(
        { error: "resolveType must be 'accept' or 'reject'" },
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
    const assetsPath = join(monorepoRoot, ".davia", "assets", projectId);
    const proposedPath = join(monorepoRoot, ".davia", "proposed", projectId);
    const assetFilePath = join(assetsPath, path);
    const proposedFilePath = join(proposedPath, path);

    // Log the paths being checked (for debugging)
    console.log("Resolve component request:", {
      projectId,
      path,
      resolveType,
      assetFilePath,
      proposedFilePath,
      assetExists: existsSync(assetFilePath),
      proposedExists: existsSync(proposedFilePath),
    });

    // Check if proposed file exists
    // Also check if the proposed directory exists
    if (!existsSync(proposedPath)) {
      console.error("Proposed directory does not exist:", proposedPath);
      return NextResponse.json(
        {
          error: "No proposed content found for this component",
          details: `Proposed directory does not exist: ${proposedPath}`,
        },
        { status: 404 }
      );
    }

    if (!existsSync(proposedFilePath)) {
      console.error("Proposed file not found:", proposedFilePath);
      // Check if asset file exists as a fallback
      if (existsSync(assetFilePath)) {
        // If asset exists but proposed doesn't, this might be a stale state
        // Return success but don't do anything (proposed content was already cleared)
        console.log(
          "Proposed file doesn't exist but asset does - treating as already resolved"
        );
        return NextResponse.json({
          success: true,
          message: "No proposed content to resolve",
        });
      }
      return NextResponse.json(
        {
          error: "No proposed content found for this component",
          details: `Path: ${path}, Proposed file: ${proposedFilePath}, Asset file: ${assetFilePath}`,
        },
        { status: 404 }
      );
    }

    if (resolveType === "accept") {
      // Accept: copy proposed content to assets, delete proposed file
      const proposedContent = readFileSync(proposedFilePath, "utf-8");

      // Ensure assets directory exists
      const { mkdir } = await import("fs/promises");
      await mkdir(assetsPath, { recursive: true });

      // Write to assets
      writeFileSync(assetFilePath, proposedContent, "utf-8");

      // Get data dependencies from proposed MDX
      // This allows us to also accept proposed data files
      try {
        const dataCollector: DataCollector = new Set();
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
        const plugins: Plugin[] = [
          createShadcnPlugin(),
          createDaviaDataPlugin(dataCollector),
        ];

        await bundleMDX({
          source: proposedContent,
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

        // For each data dependency, check if it has proposed content and accept it
        const dataImports = Array.from(dataCollector);
        for (const dataPath of dataImports) {
          const dataAssetPath = join(assetsPath, dataPath);
          const dataProposedPath = join(proposedPath, dataPath);

          if (existsSync(dataProposedPath)) {
            // Accept proposed data file
            const proposedDataContent = readFileSync(dataProposedPath, "utf-8");
            // Ensure parent directory exists
            const dataParentDir = join(
              assetsPath,
              dataPath.split("/").slice(0, -1).join("/")
            );
            if (dataParentDir !== assetsPath) {
              await mkdir(dataParentDir, { recursive: true });
            }
            writeFileSync(dataAssetPath, proposedDataContent, "utf-8");
            unlinkSync(dataProposedPath);
          }
        }
      } catch (error) {
        // If bundling fails, we still accept the MDX component
        // Data dependencies will be handled separately if needed
        console.error("Error bundling MDX to get data dependencies:", error);
      }
    }

    // Delete proposed file (for both accept and reject)
    unlinkSync(proposedFilePath);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error resolving component:", error);
    return NextResponse.json(
      { error: "Failed to resolve component" },
      { status: 500 }
    );
  }
}
