import { nanoid } from "nanoid";
import fs from "fs-extra";
import path from "node:path";
import chalk from "chalk";
import { confirm } from "@inquirer/prompts";
import { getProjectsPath } from "./paths.js";
import { createAgentsMd } from "./ide-agent-instruction/index.js";
import { writeAgentConfig } from "./agentic-ide-options/index.js";

export type Project = {
  id: string;
  path: string;
  running: boolean;
  workspaceId?: string;
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

/**
 * Sets the workspace ID for a project by ID
 */
export async function setWorkspaceId(
  projectId: string,
  workspaceId: string
): Promise<void> {
  const projects = await readProjects();
  const project = projects.find((p) => p.id === projectId);
  if (project) {
    project.workspaceId = workspaceId;
    await writeProjects(projects);
  }
}

/**
 * Initializes Davia in the current working directory.
 * Creates .davia folder structure, registers project, and updates .gitignore.
 * @param cwd - Current working directory
 * @param options - Optional configuration
 * @param options.overwrite - If true, overwrite existing .davia folder. If undefined and .davia exists, exit with message.
 * @param options.agent - Agent type to generate configuration for (cursor/windsurf/github-copilot)
 * @returns The project object
 */
export async function initializeDavia(
  cwd: string,
  options?: { overwrite?: boolean; agent?: string }
): Promise<Project> {
  const daviaPath = path.join(cwd, ".davia");

  // Track if .davia already existed before we start
  const daviaExistedBefore = await fs.pathExists(daviaPath);

  // Read projects.json (will create if it doesn't exist)
  const projects = await readProjects();

  // Find existing project by path
  let project = findProjectByPath(projects, cwd);

  if (project) {
    // Project exists
    if (await fs.pathExists(daviaPath)) {
      // .davia folder exists
      if (options?.overwrite === undefined) {
        // For init command: if agent is provided, continue to add agent config
        // Otherwise, exit if already initialized
        if (options?.agent) {
          // Agent specified, continue to add agent configuration
          console.log(
            chalk.blue(
              "Davia is already initialized. Adding agent configuration..."
            )
          );
        } else {
          // No agent specified, exit if already initialized
          console.log(
            chalk.yellow("Davia is already initialized in this directory.")
          );
          process.exit(0);
        }
      } else {
        // For docs command: use overwrite logic
        let shouldOverwrite = options.overwrite || false;

        if (!shouldOverwrite) {
          // Prompt user unless --overwrite flag is set
          shouldOverwrite = await confirm({
            message: "Documentation already exists. Overwrite?",
            default: false,
          });
        }

        if (shouldOverwrite) {
          // Remove .davia folder
          await fs.remove(daviaPath);
          console.log(chalk.green("Removed existing .davia folder"));
        } else {
          // User declined, exit
          console.log(chalk.yellow("Operation cancelled."));
          process.exit(0);
        }
      }
    }
  } else {
    // Project doesn't exist
    // Add project to projects array
    project = addProject(projects, cwd);
    await writeProjects(projects);
    console.log(chalk.green(`Registered project at ${cwd}`));

    // If .davia exists, remove it
    if (await fs.pathExists(daviaPath)) {
      await fs.remove(daviaPath);
    }

    // Check and update .gitignore
    const gitignorePath = path.join(cwd, ".gitignore");
    if (await fs.pathExists(gitignorePath)) {
      const gitignoreContent = await fs.readFile(gitignorePath, "utf-8");
      const daviaSection = "# Davia\n.davia/";

      if (!gitignoreContent.includes(daviaSection)) {
        // Add Davia section at the end with a space before # Davia
        const updatedContent =
          gitignoreContent.trimEnd() + "\n\n" + daviaSection + "\n";
        await fs.writeFile(gitignorePath, updatedContent);
        console.log(chalk.green("Updated .gitignore to include .davia/"));
      }
    }
  }

  // Create .davia folder structure
  await fs.ensureDir(path.join(daviaPath, "assets"));
  await fs.ensureDir(path.join(daviaPath, "assets", "data"));
  await fs.ensureDir(path.join(daviaPath, "assets", "mermaids"));
  await fs.ensureDir(path.join(daviaPath, "proposed"));
  await createAgentsMd(daviaPath);

  // Write agent config if specified
  if (options?.agent) {
    await writeAgentConfig(cwd, options.agent);
  }

  // Show appropriate message based on whether this was a new init or adding agent config
  const wasAddingAgentToExisting =
    daviaExistedBefore &&
    project &&
    options?.overwrite === undefined &&
    options?.agent;
  if (wasAddingAgentToExisting) {
    console.log(chalk.green("✓ Agent configuration added"));
  } else {
    console.log(chalk.green("✓ Initialized .davia"));
  }

  return project;
}
