import { nanoid } from "nanoid";
import fs from "fs-extra";
import { getProjectsPath } from "./paths.js";

export type Project = {
  id: string;
  path: string;
  running: boolean;
  workspace_id?: string;
};

/**
 * Reads projects.json, creates it with empty array if it doesn't exist
 */
export async function readProjects(): Promise<Project[]> {
  const projectsPath = await getProjectsPath();

  try {
    const projects = await fs.readJson(projectsPath);
    // Ensure it's an array
    return Array.isArray(projects) ? projects : [];
  } catch (error) {
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
 * Finds project by matching path
 */
export function findProjectByPath(
  projects: Project[],
  projectPath: string
): Project | undefined {
  return projects.find((p) => p.path === projectPath);
}

/**
 * Adds a new project with nanoid as id field, returns the new project object
 */
export function addProject(projects: Project[], projectPath: string): Project {
  const newProject: Project = {
    id: nanoid(),
    path: projectPath,
    running: false,
  };
  projects.push(newProject);
  return newProject;
}

/**
 * Sets the running status for a project by ID
 */
export async function setRunning(
  projectId: string,
  running: boolean
): Promise<void> {
  const projects = await readProjects();
  const project = projects.find((p) => p.id === projectId);
  if (project) {
    project.running = running;
    await writeProjects(projects);
  }
}
