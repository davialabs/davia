import { Command } from "commander";
import { confirm, select } from "@inquirer/prompts";
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
import { createPromptMd } from "./prompt-md.js";
import { startWebServerWithBrowser, setupGracefulShutdown } from "./web.js";
import { addDevCommands } from "./dev.js";

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

    if (project && options.browser !== false) {
      // Start web server and open browser after bootstrapping
      let running = true;
      const cleanup = async () => {
        running = false;
        await setRunning(project.id, false);
      };

      setupGracefulShutdown(cleanup);

      await startWebServerWithBrowser(project.id);
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
