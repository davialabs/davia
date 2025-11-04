#!/usr/bin/env node

import { Command } from "commander";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createInterface } from "readline";
import { statSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { nanoid } from "nanoid";
import open from "open";
import { findMonorepoRoot, checkAndSetAiEnv } from "./utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const program = new Command();

program
  .name("davia")
  .description("Documentation that writes itself")
  .version("0.1.0");

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

    // Check if path is a folder
    try {
      const stats = statSync(path);
      if (!stats.isDirectory()) {
        console.error(`Error: "${path}" is not a folder`);
        process.exit(1);
      }
    } catch {
      console.error(`Error: Path "${path}" does not exist`);
      process.exit(1);
    }

    // Get monorepo root and .davia path
    const monorepoRoot = findMonorepoRoot(__dirname);

    // Check and set AI API key from .env files
    checkAndSetAiEnv(monorepoRoot, path);

    // Verify that at least one API key is defined
    if (
      !process.env.ANTHROPIC_API_KEY &&
      !process.env.OPENAI_API_KEY &&
      !process.env.GOOGLE_API_KEY
    ) {
      console.error(
        "Error: No AI API key found. Please define one of the following in a .env file:\n" +
          "  - ANTHROPIC_API_KEY\n" +
          "  - OPENAI_API_KEY\n" +
          "  - GOOGLE_API_KEY\n" +
          "\n" +
          "You can create a .env file in the monorepo root or in the path of the project to document."
      );
      process.exit(1);
    }

    const daviaPath = join(monorepoRoot, ".davia");
    const stateJsonPath = join(daviaPath, "state.json");
    const assetsPath = join(daviaPath, "assets");

    // Read state.json
    type ProjectState = {
      path: string;
      running: boolean;
    };
    let state: Record<string, ProjectState> = {};
    try {
      const stateContent = readFileSync(stateJsonPath, "utf-8");
      if (stateContent.trim()) {
        state = JSON.parse(stateContent);
      }
    } catch {
      // If file doesn't exist or is invalid, start with empty object
      state = {};
    }

    // Check if path already exists in state.json
    let existingId: string | undefined;
    for (const [id, project] of Object.entries(state)) {
      if (project.path === path) {
        existingId = id;
        break;
      }
    }

    // If path doesn't exist, create new entry
    if (!existingId) {
      // Generate nanoid and add to state
      const id = nanoid();
      state[id] = {
        path,
        running: false,
      };

      // Write updated state.json
      writeFileSync(stateJsonPath, JSON.stringify(state, null, 2), "utf-8");

      // Create folder under assets with nanoid name
      const assetFolderPath = join(assetsPath, id);
      mkdirSync(assetFolderPath, { recursive: true });
    }

    console.log(path);
  });

program
  .command("open")
  .description("Open the Davia web app")
  .action(async () => {
    const monorepoRoot = findMonorepoRoot(__dirname);
    const webAppPath = join(monorepoRoot, "apps/web");

    console.log("Starting Davia web app...");

    // Start the Next.js dev server
    const devProcess = spawn("pnpm", ["dev"], {
      cwd: webAppPath,
      stdio: "inherit",
      shell: true,
    });

    // Wait a bit for the server to start, then open browser
    setTimeout(async () => {
      try {
        await open("http://localhost:3000");
        console.log("Opened browser at http://localhost:3000");
      } catch (error) {
        console.error("Failed to open browser:", error);
      }
    }, 3000);

    // Handle process termination
    process.on("SIGINT", () => {
      devProcess.kill();
      process.exit(0);
    });

    process.on("SIGTERM", () => {
      devProcess.kill();
      process.exit(0);
    });
  });

program.parse();
