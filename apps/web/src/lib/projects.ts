import fs from "fs-extra";
import path from "path";
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
 * Writes projects array to projects.json
 */
export async function writeProjects(projects: Project[]): Promise<void> {
  const projectsPath = await getProjectsPath();
  await fs.writeJson(projectsPath, projects, { spaces: 2 });
}

/**
 * Validates projects by checking if their assets folder exists.
 * Removes projects with missing assets folders from the JSON and returns valid projects.
 */
export async function validateAndCleanProjects(
  projects: Project[]
): Promise<Project[]> {
  const validProjects: Project[] = [];
  const removedProjects: Project[] = [];

  for (const project of projects) {
    const assetsPath = path.join(project.path, ".davia", "assets");
    const assetsExist = await fs.pathExists(assetsPath);

    if (assetsExist) {
      validProjects.push(project);
    } else {
      removedProjects.push(project);
    }
  }

  // If any projects were removed, update the JSON file
  if (removedProjects.length > 0) {
    console.log(
      `Removed ${removedProjects.length} project(s) with missing assets folders:`,
      removedProjects.map((p) => p.path)
    );
    await writeProjects(validProjects);
  }

  return validProjects;
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
