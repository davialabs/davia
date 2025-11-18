import { Command } from "commander";
import { confirm, select, input } from "@inquirer/prompts";
import chalk from "chalk";
import fs from "fs-extra";
import path from "node:path";
import {
  readProjects,
  writeProjects,
  findProjectByPath,
  addProject,
  setRunning,
} from "./projects.js";
import { createPromptMd, checkAndSetAiEnv } from "./ai.js";
import { exitWithError } from "./utils.js";
import { startWebServerWithBrowser, setupGracefulShutdown } from "./web.js";
import { addDevCommands } from "./dev.js";
import { runAgent } from "@davia/agent";

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
  .command("docs")
  .description("Generate initial documentation")
  .option("-o, --overwrite", "Overwrite existing documentation")
  .option(
    "--no-browser",
    "Do not open the browser after generating documentation"
  )
  .action(async (options) => {
    const cwd = process.cwd();
    const daviaPath = path.join(cwd, ".davia");

    // Read projects.json (will create if it doesn't exist)
    const projects = await readProjects();

    // Find existing project by path
    let project = findProjectByPath(projects, cwd);

    if (project) {
      // Project exists
      if (await fs.pathExists(daviaPath)) {
        // .davia folder exists
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
    await fs.ensureDir(path.join(daviaPath, "proposed"));
    await createPromptMd(daviaPath);

    console.log(chalk.green("✓ Initialized .davia"));

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
    // Read existing projects
    const projects = await readProjects();

    if (projects.length === 0) {
      console.log(chalk.yellow("No projects found. Run 'davia docs' first."));
      process.exit(1);
    }

    // Let user choose a project
    const selectedProject = await select({
      message: "Select a project:",
      choices: projects.map((p) => ({
        name: p.path,
        value: p,
      })),
    });

    setupGracefulShutdown();

    // Start web server and open browser
    await startWebServerWithBrowser(selectedProject.id);
  });

// Add dev commands
addDevCommands(program);

program.parse();
