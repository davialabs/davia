#!/usr/bin/env node

import { Command } from "commander";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { input, select } from "@inquirer/prompts";
import { mkdirSync, statSync, existsSync } from "fs";
import chalk from "chalk";
import {
  findMonorepoRoot,
  checkAndSetAiEnv,
  loadProjects,
  findOrCreateProjectId,
  validateProjectPath,
  validateMonorepoRoot,
  runAgentWithWeb,
  startNextJsDevServer,
} from "./utils.js";

/**
 * Display error and exit with code 1
 */
function exitWithError(message: string, suggestions?: string[]): never {
  console.error(`\n${chalk.red.bold("✗ Error:")} ${chalk.red(message)}\n`);
  if (suggestions && suggestions.length > 0) {
    console.error(chalk.dim("Possible solutions:"));
    suggestions.forEach((suggestion) => {
      console.error(chalk.dim(`  • ${suggestion}`));
    });
    console.error();
  }
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const program = new Command();

program
  .name("davia")
  .description("Documentation that writes itself")
  .version("0.1.0")
  .action(async () => {
    // Show help by default when no command is provided
    program.help();
  });

program
  .command("docs")
  .description("Generate initial documentation for a project")
  .option("-p, --path <path>", "Absolute path of the project to document")
  .option("--no-browser", "Do not open browser automatically")
  .action(async (options) => {
    let path = options.path;
    const noBrowser = options.browser === false;

    // Prompt for path if not provided
    if (!path) {
      path = await input({
        message: "Enter absolute path of the project to document:",
        validate: (value: string) => {
          if (!value || value.trim() === "") {
            return "Path cannot be empty";
          }
          return true;
        },
      });
      path = path.trim();
    }

    // Validate path
    try {
      validateProjectPath(path);
    } catch (error) {
      const err = error as Error;
      let suggestions: string[] = [];

      if (err.message.includes("does not exist")) {
        suggestions = [
          "Check if the path is correct and the directory exists",
          "Make sure you're using an absolute path (starts with / on macOS/Linux or C:\\ on Windows)",
          "Verify the path doesn't contain typos",
          "Example of correct format: /Users/username/my-project",
        ];
      } else if (err.message.includes("Permission denied")) {
        suggestions = [
          "Check if you have read permissions for this directory",
          "Try running with appropriate permissions",
          "Verify the directory is accessible",
        ];
      } else if (err.message.includes("not a directory")) {
        suggestions = [
          "Provide the path to a directory, not a file",
          "Make sure the path points to a folder containing your project",
        ];
      } else {
        suggestions = [
          "Verify the path is correct",
          "Check if you have the necessary permissions",
          "Ensure the filesystem is accessible",
        ];
      }

      exitWithError(err.message, suggestions);
    }

    // Ask for optional documentation goal
    const documentationGoal = await input({
      message:
        "What do you want to document? (Optional - press Enter to skip):",
      default: "",
    });

    // Get monorepo root and .davia path
    const monorepoRoot = findMonorepoRoot(__dirname);

    // Validate monorepo root
    try {
      validateMonorepoRoot(monorepoRoot);
    } catch (error) {
      const err = error as Error;
      exitWithError(err.message, [
        "Make sure you're running the command from within the Davia monorepo",
        "Verify that pnpm-workspace.yaml or turbo.json exists in the project root",
        "Check if the CLI is properly installed",
      ]);
    }

    // Check and set AI API key from .env files
    const model = checkAndSetAiEnv(monorepoRoot, path);

    // Exit if no API key found
    if (!model) {
      exitWithError("No AI API key found. Cannot proceed without an API key.", [
        "Create a .env file in the monorepo root or in the project directory",
        "Add one of the following environment variables:",
        "  • ANTHROPIC_API_KEY (for Claude)",
        "  • OPENAI_API_KEY (for GPT models)",
        "  • GOOGLE_API_KEY (for Gemini models)",
        "",
        "Example .env file content:",
        "  ANTHROPIC_API_KEY=your_api_key_here",
      ]);
    }

    const daviaPath = join(monorepoRoot, ".davia");
    const projectsJsonPath = join(daviaPath, "projects.json");
    const assetsPath = join(daviaPath, "assets");

    // Ensure .davia directory exists
    mkdirSync(daviaPath, { recursive: true });

    // Load projects
    const projects = loadProjects(projectsJsonPath);

    // Find or create project ID
    const id = findOrCreateProjectId(projects, path, projectsJsonPath);

    // Create folder under assets with nanoid name
    const assetFolderPath = join(assetsPath, id);
    mkdirSync(assetFolderPath, { recursive: true });

    // Run agent with web interface
    try {
      await runAgentWithWeb({
        sourcePath: path,
        daviaPath,
        projectId: id,
        model,
        isUpdate: false,
        additionalInstructions: documentationGoal?.trim() || undefined,
        monorepoRoot,
        projectsJsonPath,
        projects,
        noBrowser,
      });

      // Show reload message after agent completes (only if browser was opened)
      if (!noBrowser) {
        console.log(
          `\n${chalk.green.bold("✅ Documentation generation complete!")}`
        );
        console.log(
          `   ${chalk.green("🔄 Please reload the page in your browser to see the updates.")}\n`
        );
      } else {
        console.log(
          `\n${chalk.green.bold("✅ Documentation generation complete!")}\n`
        );
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      exitWithError(`Documentation generation failed: ${errorMsg}`, [
        "Check if the source path contains valid files to document",
        "Verify you have write permissions in the destination directory",
        "Check the agent logs above for more details",
        "Ensure your API key is valid and has sufficient credits/quota",
        "Try running the command again",
      ]);
    }
  });

program
  .command("update-docs")
  .description("Update documentation for a specific project")
  .option("-p, --path <path>", "Absolute path of the project to update")
  .option("--no-browser", "Do not open browser automatically")
  .action(async (options) => {
    let path = options.path;
    const noBrowser = options.browser === false;

    // Get monorepo root and .davia path
    const monorepoRoot = findMonorepoRoot(__dirname);

    // Validate monorepo root
    try {
      validateMonorepoRoot(monorepoRoot);
    } catch (error) {
      const err = error as Error;
      exitWithError(err.message, [
        "Make sure you're running the command from within the Davia monorepo",
        "Verify that pnpm-workspace.yaml or turbo.json exists in the project root",
        "Check if the CLI is properly installed",
      ]);
    }

    const daviaPath = join(monorepoRoot, ".davia");
    const projectsJsonPath = join(daviaPath, "projects.json");
    const assetsPath = join(daviaPath, "assets");

    // Load projects
    const projects = loadProjects(projectsJsonPath);

    // Check if there are any projects
    const projectEntries = Object.entries(projects);
    if (projectEntries.length === 0) {
      console.log(chalk.yellow("No repo has already been analyzed."));
      process.exit(0);
    }

    let selectedProject: { id: string; path: string };

    // If path is provided, find the project by path
    if (path) {
      path = path.trim();

      // Validate the provided path
      try {
        validateProjectPath(path);
      } catch (error) {
        const err = error as Error;
        exitWithError(err.message, [
          "Check if the path is correct and the directory exists",
          "Make sure you're using an absolute path (starts with / on macOS/Linux or C:\\ on Windows)",
          "Verify the path doesn't contain typos",
        ]);
      }

      // Find project by path
      const foundProject = projectEntries.find(
        ([, project]) => project.path === path
      );

      if (!foundProject) {
        exitWithError(`No project found with path "${path}"`, [
          "Make sure the project has been analyzed first using 'davia docs'",
          "Check if the path matches exactly the path used when creating the project",
          "Run 'davia update-docs' without --path to see all available projects",
        ]);
      }

      selectedProject = {
        id: foundProject[0],
        path: foundProject[1].path,
      };
    } else {
      // Create choices for select prompt
      const choices = projectEntries.map(([id, project]) => ({
        name: project.path,
        value: { id, path: project.path },
      }));

      // Prompt user to select a project
      selectedProject = await select({
        message: "Select a project to update:",
        choices,
      });
    }

    const { id, path: projectPath } = selectedProject;

    // Ask what the user would like to update
    const updatePrompt = await input({
      message: "What would you like to update?",
      validate: (value: string) => {
        if (!value || value.trim() === "") {
          return "Update instructions cannot be empty";
        }
        return true;
      },
    });

    // Check if assets folder exists for this project
    const assetFolderPath = join(assetsPath, id);
    if (
      !existsSync(assetFolderPath) ||
      !statSync(assetFolderPath).isDirectory()
    ) {
      exitWithError(`No documentation found for project ${id}`, [
        "Make sure the project has been analyzed first using 'davia docs'",
      ]);
    }

    // Check and set AI API key
    const model = checkAndSetAiEnv(monorepoRoot, projectPath);

    // Exit if no API key found
    if (!model) {
      exitWithError("No AI API key found. Cannot proceed without an API key.", [
        "Create a .env file in the monorepo root or in the project directory",
        "Add one of the following environment variables:",
        "  • ANTHROPIC_API_KEY (for Claude)",
        "  • OPENAI_API_KEY (for GPT models)",
        "  • GOOGLE_API_KEY (for Gemini models)",
        "",
        "Example .env file content:",
        "  ANTHROPIC_API_KEY=your_api_key_here",
      ]);
    }

    // Run agent with web interface in update mode
    try {
      await runAgentWithWeb({
        sourcePath: projectPath,
        daviaPath,
        projectId: id,
        model,
        isUpdate: true,
        additionalInstructions: updatePrompt.trim(),
        monorepoRoot,
        projectsJsonPath,
        projects,
        noBrowser,
      });

      // Show reload message after agent completes (only if browser was opened)
      if (!noBrowser) {
        console.log(
          `\n${chalk.green.bold("✅ Documentation update complete!")}`
        );
        console.log(
          `   ${chalk.green("🔄 Please reload the page in your browser to see the updates.")}\n`
        );
      } else {
        console.log(
          `\n${chalk.green.bold("✅ Documentation update complete!")}\n`
        );
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      exitWithError(`Documentation update failed: ${errorMsg}`, [
        "Check if the source path contains valid files to document",
        "Verify you have write permissions in the destination directory",
        "Check the agent logs above for more details",
        "Ensure your API key is valid and has sufficient credits/quota",
        "Try running the command again",
      ]);
    }
  });

program
  .command("open")
  .description("Open the Davia web app")
  .action(async () => {
    // Get monorepo root and .davia path
    const monorepoRoot = findMonorepoRoot(__dirname);

    // Validate monorepo root
    try {
      validateMonorepoRoot(monorepoRoot);
    } catch (error) {
      const err = error as Error;
      exitWithError(err.message, [
        "Make sure you're running the command from within the Davia monorepo",
        "Verify that pnpm-workspace.yaml or turbo.json exists in the project root",
        "Check if the CLI is properly installed",
      ]);
    }

    const daviaPath = join(monorepoRoot, ".davia");
    const projectsJsonPath = join(daviaPath, "projects.json");

    // Load projects
    const projects = loadProjects(projectsJsonPath);

    // Check if there are any projects
    const projectEntries = Object.entries(projects);
    if (projectEntries.length === 0) {
      console.log(chalk.yellow.bold("⚠ No projects found."));
      console.log(chalk.dim("Run 'pnpm docs' to create your first project.\n"));
      // Still start the server, but open root URL
      startNextJsDevServer({
        monorepoRoot,
        openBrowserOnStart: true,
        openBrowserDelay: 5000,
      });
      return;
    }

    // Create choices for select prompt
    const choices = projectEntries.map(([id, project]) => ({
      name: project.path,
      value: id,
    }));

    // Prompt user to select a project
    const projectId = await select({
      message: "Select a project to open:",
      choices,
    });

    // Start the Next.js dev server
    const devServer = startNextJsDevServer({
      monorepoRoot,
      openBrowserOnStart: false, // We'll open manually with project ID
      openBrowserDelay: 5000,
    });

    // Open browser with selected project after delay
    setTimeout(async () => {
      await devServer.openBrowser(projectId);
    }, 5000);
  });

program.parse();
