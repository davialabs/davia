#!/usr/bin/env node

import { Command } from "commander";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import open from "open";
import { findMonorepoRoot } from "./utils.js";

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
  .action(() => {
    console.log("Docs command called");
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
