#!/usr/bin/env node

import { Command } from "commander";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createInterface } from "readline";
import {
  statSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
} from "fs";
import { nanoid } from "nanoid";
import {
  findMonorepoRoot,
  checkAndSetAiEnv,
  startNextJsDevServer,
} from "./utils.js";
import { runAgent } from "@davia/agent";

// ANSI color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
} as const;

/**
 * Format error message with colors
 */
function errorMessage(message: string): string {
  return `${colors.red}${colors.bold}✗ Error:${colors.reset} ${colors.red}${message}${colors.reset}`;
}

/**
 * Format warning message with colors
 */
function warningMessage(message: string): string {
  return `${colors.yellow}${colors.bold}⚠ Warning:${colors.reset} ${colors.yellow}${message}${colors.reset}`;
}

/**
 * Display error and exit with code 1
 */
function exitWithError(message: string, suggestions?: string[]): never {
  console.error(`\n${errorMessage(message)}\n`);
  if (suggestions && suggestions.length > 0) {
    console.error(`${colors.dim}Possible solutions:${colors.reset}`);
    suggestions.forEach((suggestion) => {
      console.error(`${colors.dim}  • ${suggestion}${colors.reset}`);
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
  .description("Generate or manage documentation")
  .option("-p, --path <path>", "Absolute path of the project to document")
  .action(async (options) => {
    let path = options.path;

    // Prompt for path if not provided
    if (!path) {
      const rl = createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      path = await new Promise<string>((resolve) => {
        rl.question(
          "Enter absolute path of the project to document: ",
          (answer) => {
            rl.close();
            resolve(answer.trim());
          }
        );
      });
    }

    // Validate and check if path exists and is a folder
    if (!path || path.trim() === "") {
      exitWithError("No path provided. The path cannot be empty.", [
        "Provide a valid absolute path to the project directory",
        "Example: /Users/username/my-project",
        "Or use the --path option: davia docs --path /path/to/project",
      ]);
    }

    // Check if path exists and is accessible
    let stats;
    try {
      stats = statSync(path);
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      let errorMsg = "";
      let suggestions: string[] = [];

      if (err.code === "ENOENT") {
        errorMsg = `The path "${path}" does not exist.`;
        suggestions = [
          "Check if the path is correct and the directory exists",
          "Make sure you're using an absolute path (starts with / on macOS/Linux or C:\\ on Windows)",
          "Verify the path doesn't contain typos",
          "Example of correct format: /Users/username/my-project",
        ];
      } else if (err.code === "EACCES") {
        errorMsg = `Permission denied: Cannot access "${path}".`;
        suggestions = [
          "Check if you have read permissions for this directory",
          "Try running with appropriate permissions",
          "Verify the directory is accessible",
        ];
      } else if (err.code === "ENOTDIR") {
        errorMsg = `"${path}" is not a directory (it appears to be a file).`;
        suggestions = [
          "Provide the path to a directory, not a file",
          "Make sure the path points to a folder containing your project",
        ];
      } else {
        errorMsg = `Cannot access path "${path}": ${err.message}`;
        suggestions = [
          "Verify the path is correct",
          "Check if you have the necessary permissions",
          "Ensure the filesystem is accessible",
        ];
      }

      exitWithError(errorMsg, suggestions);
    }

    // Check if path is a directory
    if (!stats.isDirectory()) {
      exitWithError(`"${path}" is not a directory.`, [
        "The path must point to a directory (folder), not a file",
        "Make sure you're providing the project root directory",
        "Example: /Users/username/my-project (not /Users/username/my-project/file.txt)",
      ]);
    }

    // Ask for optional documentation goal
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const documentationGoal = await new Promise<string>((resolve) => {
      rl.question(
        "What do you want to document? [Optional - press Enter to skip]: ",
        (answer) => {
          rl.close();
          resolve(answer.trim());
        }
      );
    });

    // Get monorepo root and .davia path
    const monorepoRoot = findMonorepoRoot(__dirname);

    // Verify monorepo root was found (has workspace files)
    const workspaceFileExists =
      existsSync(join(monorepoRoot, "pnpm-workspace.yaml")) ||
      existsSync(join(monorepoRoot, "turbo.json"));

    if (!workspaceFileExists) {
      exitWithError("Could not find monorepo root directory.", [
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

    // Read projects.json
    type ProjectState = {
      path: string;
      running: boolean;
    };
    let projects: Record<string, ProjectState> = {};
    try {
      const projectsContent = readFileSync(projectsJsonPath, "utf-8");
      if (projectsContent.trim()) {
        try {
          projects = JSON.parse(projectsContent);
        } catch (parseError) {
          console.error(
            warningMessage(
              `Failed to parse projects.json. Starting with empty projects list.`
            )
          );
          console.error(
            `${colors.dim}Parse error: ${parseError instanceof Error ? parseError.message : String(parseError)}${colors.reset}\n`
          );
          // Reset to empty object if JSON is invalid
          projects = {};
        }
      }
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      // If file doesn't exist, that's fine - we'll create it
      if (err.code !== "ENOENT") {
        console.error(
          warningMessage(
            `Could not read projects.json: ${err.message}. Starting with empty projects list.`
          )
        );
        console.error();
      }
      projects = {};
    }

    // Check if path already exists in projects.json
    let existingId: string | undefined;
    for (const [id, project] of Object.entries(projects)) {
      if (project.path === path) {
        existingId = id;
        break;
      }
    }

    // Determine the project ID
    let id: string;
    if (!existingId) {
      // Generate nanoid and add to projects
      id = nanoid();
      projects[id] = {
        path,
        running: false,
      };

      // Write updated projects.json
      writeFileSync(
        projectsJsonPath,
        JSON.stringify(projects, null, 2),
        "utf-8"
      );
    } else {
      id = existingId;
    }

    // Create folder under assets with nanoid name
    const assetFolderPath = join(assetsPath, id);
    mkdirSync(assetFolderPath, { recursive: true });

    // Ensure project exists and get reference
    const project = projects[id] ?? { path, running: false };
    projects[id] = project;

    // Set running to true before agent run
    project.running = true;
    writeFileSync(projectsJsonPath, JSON.stringify(projects, null, 2), "utf-8");

    // Helper function to set running to false
    const setRunningFalse = () => {
      project.running = false;
      writeFileSync(
        projectsJsonPath,
        JSON.stringify(projects, null, 2),
        "utf-8"
      );
    };

    // Start the Next.js dev server
    const devServer = startNextJsDevServer({
      monorepoRoot,
      openBrowserOnStart: false, // We'll open manually after agent starts
      onSignal: setRunningFalse,
      filterRequestLogs: true, // Filter out GET/POST logs when running docs
    });

    // Wait a moment for Next.js server to show startup messages before starting agent
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Run the agent (start it, then open browser, then await)
    try {
      const agentPromise = runAgent(
        path,
        assetFolderPath,
        model,
        id,
        documentationGoal || undefined
      );

      // Open browser after agent starts (give it a moment to initialize)
      setTimeout(async () => {
        await devServer.openBrowser(id);
      }, 2000);

      // Await agent completion
      await agentPromise;

      // Show reload message after agent completes
      console.log(
        `\n${colors.green}${colors.bold}✅ Documentation generation complete!${colors.reset}`
      );
      console.log(
        `   ${colors.green}🔄 Please reload the page in your browser to see the updates.${colors.reset}\n`
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      exitWithError(`Documentation generation failed: ${errorMsg}`, [
        "Check if the source path contains valid files to document",
        "Verify you have write permissions in the destination directory",
        "Check the agent logs above for more details",
        "Ensure your API key is valid and has sufficient credits/quota",
        "Try running the command again",
      ]);
    } finally {
      // Cleanup signal handlers
      devServer.cleanup();
      // Set running to false after agent completes or fails
      setRunningFalse();
      // Note: dev server continues running in background
    }
  });

/**
 * Interactive project selector with arrow key navigation
 */
async function selectProject(
  projects: Record<string, { path: string; running: boolean }>
): Promise<string | null> {
  const projectEntries = Object.entries(projects);

  if (projectEntries.length === 0) {
    return null;
  }

  if (projectEntries.length === 1) {
    const firstEntry = projectEntries[0];
    if (!firstEntry) {
      return null;
    }
    return firstEntry[0];
  }

  let selectedIndex = 0;
  const projectIds = projectEntries.map(([id]) => id);
  const projectPaths = projectEntries.map(([, project]) => project.path);

  // Set terminal to raw mode for arrow key handling
  const wasRawMode = process.stdin.isRaw;
  if (!wasRawMode) {
    process.stdin.setRawMode(true);
  }
  process.stdin.resume();
  process.stdin.setEncoding("utf8");

  // Hide cursor
  process.stdout.write("\x1b[?25l");

  const renderMenu = () => {
    // Clear screen and move cursor to top
    process.stdout.write("\x1b[2J\x1b[H");
    console.log(`${colors.bold}Select a project to open:${colors.reset}\n`);

    projectPaths.forEach((path, index) => {
      const isSelected = index === selectedIndex;
      const prefix = isSelected
        ? `${colors.green}${colors.bold}>${colors.reset} `
        : "  ";
      const pathColor = isSelected ? colors.green : colors.dim;
      console.log(`${prefix}${pathColor}${path}${colors.reset}`);
    });

    console.log(
      `\n${colors.dim}Use ↑↓ arrow keys to navigate, Enter to select${colors.reset}`
    );
  };

  renderMenu();

  return new Promise<string>((resolve) => {
    let buffer = "";
    const onData = (data: string) => {
      buffer += data;

      // Limit buffer size to prevent memory issues
      if (buffer.length > 10) {
        buffer = buffer.slice(-5);
      }

      // Handle arrow keys (escape sequences can be split across multiple chunks)
      if (buffer.includes("\u001b[A") || buffer.endsWith("[A")) {
        // Up arrow
        buffer = "";
        selectedIndex = Math.max(0, selectedIndex - 1);
        renderMenu();
      } else if (buffer.includes("\u001b[B") || buffer.endsWith("[B")) {
        // Down arrow
        buffer = "";
        selectedIndex = Math.min(projectIds.length - 1, selectedIndex + 1);
        renderMenu();
      } else if (data === "\r" || data === "\n") {
        buffer = "";
        // Enter key
        // Restore terminal state
        process.stdin.removeListener("data", onData);
        process.stdin.pause();
        if (!wasRawMode) {
          process.stdin.setRawMode(false);
        }
        // Show cursor
        process.stdout.write("\x1b[?25h");
        // Clear screen
        process.stdout.write("\x1b[2J\x1b[H");
        const selectedId = projectIds[selectedIndex];
        if (selectedId) {
          resolve(selectedId);
        } else {
          // Fallback to first project if somehow selectedIndex is invalid
          resolve(projectIds[0] ?? "");
        }
      } else if (data === "\u0003") {
        // Ctrl+C
        process.stdin.removeListener("data", onData);
        process.stdin.pause();
        if (!wasRawMode) {
          process.stdin.setRawMode(false);
        }
        // Show cursor
        process.stdout.write("\x1b[?25h");
        process.exit(0);
      }
    };

    process.stdin.on("data", onData);
  });
}

program
  .command("open")
  .description("Open the Davia web app")
  .action(async () => {
    const monorepoRoot = findMonorepoRoot(__dirname);

    // Read projects.json to check available projects
    const daviaPath = join(monorepoRoot, ".davia");
    const projectsJsonPath = join(daviaPath, "projects.json");

    type ProjectState = {
      path: string;
      running: boolean;
    };
    let projects: Record<string, ProjectState> = {};

    try {
      if (existsSync(projectsJsonPath)) {
        const projectsContent = readFileSync(projectsJsonPath, "utf-8");
        if (projectsContent.trim()) {
          try {
            projects = JSON.parse(projectsContent);
          } catch {
            // If parsing fails, use empty projects
            projects = {};
          }
        }
      }
    } catch {
      // If reading fails, use empty projects
      projects = {};
    }

    // Select project
    const projectId = await selectProject(projects);

    if (!projectId) {
      console.log(
        `${colors.yellow}${colors.bold}⚠ No projects found.${colors.reset}`
      );
      console.log(
        `${colors.dim}Run 'pnpm docs' to create your first project.${colors.reset}\n`
      );
      // Still start the server, but open root URL
      startNextJsDevServer({
        monorepoRoot,
        openBrowserOnStart: true,
        openBrowserDelay: 5000,
      });
      return;
    }

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
