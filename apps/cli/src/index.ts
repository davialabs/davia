#!/usr/bin/env node
import { Command } from "commander";
import { select, input } from "@inquirer/prompts";
import chalk from "chalk";
import {
  readProjects,
  setRunning,
  initializeDavia,
  findProjectByPath,
  setWorkspaceId,
} from "./projects.js";
import { checkAndSetAiEnv } from "./ai.js";
import { exitWithError } from "./utils.js";
import { startWebServerWithBrowser, setupGracefulShutdown } from "./web.js";
import { runAgent } from "@davia/agent";
import {
  ensureLoggedIn,
  getAccessToken,
  readConfig,
  writeConfig,
  link,
} from "./sync.js";

const program = new Command();

program
  .name("davia")
  .description("Interactive internal documentation that writes itself")
  .version("0.1.0-alpha.5")
  .action(async () => {
    // Show help by default when no command is provided
    program.help();
  });

program
  .command("init")
  .description("Initialize Davia in the current directory")
  .option(
    "--agent <agent>",
    "Generate agent-specific configuration (cursor/windsurf/github-copilot)"
  )
  .action(async (options) => {
    const cwd = process.cwd();
    await initializeDavia(cwd, { agent: options.agent });
  });

program
  .command("docs")
  .description("Generate initial documentation")
  .option("-o, --overwrite", "Overwrite existing documentation")
  .option(
    "--no-browser",
    "Do not open the browser after generating documentation"
  )
  .option(
    "--agent <agent>",
    "Generate agent-specific configuration (cursor/windsurf/github-copilot)"
  )
  .action(async (options) => {
    const cwd = process.cwd();

    // Initialize Davia (with overwrite and agent options)
    const project = await initializeDavia(cwd, {
      overwrite: options.overwrite || false,
      agent: options.agent,
    });

    // Check and set AI API key from .env files
    const model = checkAndSetAiEnv(cwd);

    // Exit if no API key found
    if (!model) {
      exitWithError("No AI API key found. Cannot proceed without an API key.", [
        "Create a .env file in the .davia folder or in the project directory",
        "Add one of the following environment variables:",
        "  • ANTHROPIC_API_KEY (for Claude)",
        "  • OPENAI_API_KEY (for GPT models)",
        "  • GOOGLE_API_KEY (for Gemini models)",
        "",
        "Example .env file content:",
        "  ANTHROPIC_API_KEY=your_api_key_here",
      ]);
    }

    // Get documentation goal from user
    const documentationGoal = await input({
      message:
        "What do you want to document? (Optional - press Enter to skip):",
      default: "",
    });

    // Set running to true
    await setRunning(project.id, true);

    // Setup cleanup for graceful shutdown
    const cleanup = async () => {
      await setRunning(project.id, false);
    };
    setupGracefulShutdown(cleanup);

    // Start web server and open browser if requested
    if (options.browser !== false) {
      await startWebServerWithBrowser(project.id);
    }

    try {
      // Run the agent
      await runAgent(
        project.id,
        cwd,
        false, // isUpdate = false for initial docs
        model,
        documentationGoal.trim() || undefined // additionalInstructions
      );

      // Success message
      console.log(
        `\n${chalk.green.bold("✅ Documentation generation complete!")}`
      );

      if (options.browser !== false) {
        console.log(
          `   ${chalk.green("🔄 Please reload the page in your browser to see the updates.")}\n`
        );
      }
    } catch (error) {
      console.error(chalk.red.bold("\n❌ Documentation generation failed!"));
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      exitWithError(errorMessage, [
        "",
        "💡 Troubleshooting tips:",
        "  • Check if the source path contains valid files to document",
        "  • Verify you have write permissions in the destination directory",
        "  • Check the agent logs above for more details",
        "  • Ensure your API key is valid and has sufficient credits/quota",
        "  • Try running the command again",
      ]);
    } finally {
      // Set running to false
      await setRunning(project.id, false);
    }
  });

program
  .command("open")
  .description("Start the Davia web server")
  .action(async () => {
    const cwd = process.cwd();

    // Read existing projects
    const projects = await readProjects();

    if (projects.length === 0) {
      console.log(chalk.yellow("No projects found. Run 'davia init' first."));
      process.exit(1);
    }

    // Check if current directory is among the projects
    let selectedProject = findProjectByPath(projects, cwd);

    // If not found, let user choose a project
    if (!selectedProject) {
      selectedProject = await select({
        message: "Select a project:",
        choices: projects.map((p) => ({
          name: p.path,
          value: p,
        })),
      });
    }

    setupGracefulShutdown();

    // Start web server and open browser
    await startWebServerWithBrowser(selectedProject.id);
  });

program
  .command("login")
  .description("Log in to Davia")
  .option("--no-browser", "Do not open the browser automatically")
  .option("--reset", "Remove existing access token and log in again")
  .action(async (options) => {
    // If --reset is provided, remove the existing access token
    if (options.reset) {
      const config = await readConfig();
      if (config.accessToken) {
        delete config.accessToken;
        await writeConfig(config);
        console.log(
          chalk.yellow("🔄 Access token removed. Please log in again.\n")
        );
      } else {
        console.log(chalk.yellow("ℹ️  No existing access token found.\n"));
      }
    }

    const existingToken = await getAccessToken();
    if (existingToken) {
      console.log(chalk.green.bold("✅ You are already logged in!\n"));
      return;
    }

    await ensureLoggedIn(options.browser === false);
  });

program
  .command("push")
  .description("Push local documentation to your remote workspace")
  .action(async () => {
    const cwd = process.cwd();

    // Read existing projects
    const projects = await readProjects();

    if (projects.length === 0) {
      console.log(chalk.yellow("No projects found. Run 'davia init' first."));
      process.exit(1);
    }

    // Check if current directory is among the projects
    const selectedProject = findProjectByPath(projects, cwd);

    if (!selectedProject) {
      console.log(
        chalk.yellow(
          "No project found for this directory. Run 'davia init' first."
        )
      );
      process.exit(1);
    }

    // Link project to workspace if not already linked
    if (!selectedProject.workspaceId) {
      try {
        const workspaceId = await link(selectedProject.path);
        await setWorkspaceId(selectedProject.id, workspaceId);
        selectedProject.workspaceId = workspaceId;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        exitWithError("Failed to link project to workspace", [
          errorMessage,
          "",
          "💡 Troubleshooting tips:",
          "  • Make sure you are logged in (run 'davia login')",
          "  • Check your internet connection",
          "  • Try running the command again",
        ]);
      }
    }

    console.log(chalk.green.bold("✅ Workspace ID:"));
    console.log(chalk.cyan(`   ${selectedProject.workspaceId}\n`));
  });

program.parse();
