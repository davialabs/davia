import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { FileCodeIcon } from "lucide-react";
import { existsSync, readFileSync } from "fs";
import { join, relative } from "path";
import { redirect } from "next/navigation";
import { findHtmlFiles, extractTitle } from "@/lib/tree/server";
import { getBaseName } from "@/lib/utils";
import { ProjectState } from "@/lib/types";
import type { Metadata } from "next";
import { Editor } from "./editor";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ projectId: string; pagePath?: string[] }>;
}): Promise<Metadata> {
  const { projectId, pagePath } = await params;

  // Get monorepo root from environment variable
  const monorepoRoot = process.env.DAVIA_MONOREPO_ROOT!;

  // Read projects.json
  const projectsJsonPath = join(monorepoRoot, ".davia", "projects.json");
  let projects: Record<string, ProjectState> = {};
  try {
    const projectsContent = readFileSync(projectsJsonPath, "utf-8");
    if (projectsContent.trim()) {
      projects = JSON.parse(projectsContent);
    }
  } catch (error) {
    console.error("Error reading projects.json:", error);
  }

  // Check if projectId exists in projects
  const project = projects[projectId];
  if (!project) {
    return {
      title: "Project not found",
    };
  }

  // Get base name from project path
  const baseName = getBaseName(project.path);

  // If no pagePath, return base name
  if (!pagePath) {
    return {
      title: baseName,
    };
  }

  // Construct the file path from pagePath array
  const assetPath = join(monorepoRoot, ".davia", "assets", projectId);
  const filePath = join(assetPath, ...pagePath) + ".html";

  // Check if the file exists
  if (!existsSync(filePath)) {
    return {
      title: baseName,
    };
  }

  // Read the HTML file content and extract title
  try {
    const htmlContent = readFileSync(filePath, "utf-8");
    const title = extractTitle(htmlContent);
    return {
      title: `${title} | ${baseName}`,
    };
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return {
      title: baseName,
    };
  }
}

export default async function PagePathPage({
  params,
}: {
  params: Promise<{ projectId: string; pagePath?: string[] }>;
}) {
  const { projectId, pagePath } = await params;

  // Get monorepo root from environment variable
  const monorepoRoot = process.env.DAVIA_MONOREPO_ROOT!;

  // Check if the asset folder exists
  const assetPath = join(monorepoRoot, ".davia", "assets", projectId);
  if (!existsSync(assetPath)) {
    return <EmptyDocumentation />;
  }

  if (!pagePath) {
    // Find all HTML files in the asset folder
    const htmlFiles = findHtmlFiles(assetPath, assetPath);

    // If no HTML files found, return empty
    if (htmlFiles.length === 0) {
      return <EmptyDocumentation />;
    }

    // Get relative paths and filter to root files only (no slashes)
    const rootHtmlFiles = htmlFiles
      .map((htmlFile) => {
        const relativePath = relative(assetPath, htmlFile)
          .replace(/\.html$/, "")
          .replace(/\\/g, "/");
        return { htmlFile, relativePath };
      })
      .filter(({ relativePath }) => !relativePath.includes("/"))
      .sort((a, b) => a.relativePath.localeCompare(b.relativePath));

    // If no root HTML files found, return empty
    if (rootHtmlFiles.length === 0) {
      return <EmptyDocumentation />;
    }

    // Get the first root HTML file alphabetically
    const pathWithoutExtension = rootHtmlFiles[0]!.relativePath;

    // Redirect to /projectId/[path]
    redirect(`/${projectId}/${pathWithoutExtension}`);
  }

  // Construct the file path from pagePath array
  const filePath = join(assetPath, ...pagePath) + ".html";

  // Check if the file exists
  if (!existsSync(filePath)) {
    return <PageNotFound />;
  }

  // Read the HTML file content
  let htmlContent: string;
  try {
    htmlContent = readFileSync(filePath, "utf-8");
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return <PageNotFound />;
  }

  // Render the HTML content
  return <Editor projectId={projectId} initialContent={htmlContent} />;
}

function EmptyDocumentation() {
  return (
    <div className="flex flex-1 items-center justify-center h-full p-4">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileCodeIcon />
          </EmptyMedia>
          <EmptyTitle>Empty Documentation</EmptyTitle>
          <EmptyDescription>
            No pages found for this repository. Please generate documentation
            first by running{" "}
            <code className="bg-muted p-1 text-xs rounded-md">
              pnpm run docs
            </code>{" "}
            in the terminal.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}

function PageNotFound() {
  return (
    <div className="flex flex-1 items-center justify-center h-full p-4">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileCodeIcon />
          </EmptyMedia>
          <EmptyTitle>Page Not Found</EmptyTitle>
          <EmptyDescription>
            The page you are looking for does not exist.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}
