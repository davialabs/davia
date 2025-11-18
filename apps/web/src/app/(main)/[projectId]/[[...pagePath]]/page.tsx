import { existsSync, readFileSync } from "fs";
import { join, relative } from "path";
import { redirect } from "next/navigation";
import { findHtmlFiles } from "@/lib/tree/server";
import { extractTitle, getBaseName } from "@/lib/utils";
import { Project } from "@/lib/types";
import type { Metadata } from "next";
import { Editor } from "./editor";
import { EmptyDocumentation, PageNotFound } from "./fallback-views";
import { readProjects, findProjectById } from "@/lib/projects";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ projectId: string; pagePath?: string[] }>;
}): Promise<Metadata> {
  const { projectId, pagePath } = await params;

  // Read projects and find project by id
  const projects = await readProjects();
  const project = findProjectById(projects, projectId);

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
  const assetPath = join(project.path, ".davia", "assets");
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

  // Read projects and find project by id
  const projects = await readProjects();
  const project = findProjectById(projects, projectId);

  if (!project) {
    return <EmptyDocumentation />;
  }

  // Check if the asset folder exists
  const assetPath = join(project.path, ".davia", "assets");
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
  return (
    <Editor
      projectId={projectId}
      pagePath={pagePath.join("/")}
      initialContent={htmlContent}
    />
  );
}
