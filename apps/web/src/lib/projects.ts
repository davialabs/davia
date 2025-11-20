import fs from "fs-extra";
import { getProjectsPath } from "./paths";
import { Project } from "./types";

/**
 * Reads projects.json, creates it with empty array if it doesn't exist
 */
export async function readProjects(): Promise<Project[]> {
  const projectsPath = await getProjectsPath();

  try {
    const projects = await fs.readJson(projectsPath);
    // Ensure it's an array
    return Array.isArray(projects) ? projects : [];
  } catch {
    // File doesn't exist or is invalid, create empty array
    await fs.writeJson(projectsPath, []);
    return [];
  }
}

/**
 * Finds project by matching id
 */
export function findProjectById(
  projects: Project[],
  projectId: string
): Project | undefined {
  return projects.find((p) => p.id === projectId);
}
