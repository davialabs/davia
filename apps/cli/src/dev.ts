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
import { startWebDevServer, setupGracefulShutdown } from "./web.js";

/**
 * Adds dev commands to the program
 */
export function addDevCommands(program: Command): void {
  program
    .command("doc:dev", { hidden: true })
    .description("Generate initial documentation (dev mode)")
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

      console.log(chalk.green("✓ Created .davia folder structure"));
      console.log(chalk.green("  - .davia/assets/"));
      console.log(chalk.green("  - .davia/proposed/"));
      console.log(chalk.green("  - .davia/prompt.md"));

      if (project && options.browser !== false) {
        // Start web dev server and open browser after bootstrapping
        let running = true;
        const cleanup = async () => {
          running = false;
          await setRunning(project.id, false);
        };

        setupGracefulShutdown(cleanup);

        await startWebDevServer(project.id);
      }
    });

  program
    .command("open:dev", { hidden: true })
    .description("Start the Davia web server (dev mode)")
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

      // Start web dev server and open browser
      await startWebDevServer(selectedProject.id);
    });
}
