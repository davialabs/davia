import fs from "fs-extra";
import path from "node:path";
import { existsSync, readFileSync } from "fs";
import { parse } from "dotenv";
import chalk from "chalk";

/**
 * Creates an empty prompt.md file at the specified path
 * This is a placeholder function for future content
 */
export async function createPromptMd(daviaPath: string): Promise<void> {
  const promptMdPath = path.join(daviaPath, "prompt.md");
  await fs.writeFile(promptMdPath, "");
}

/**
 * Check for AI API keys in .env files and set the first one found.
 * Priority: ANTHROPIC_API_KEY > OPENAI_API_KEY > GOOGLE_API_KEY
 * Checks projectPath/.davia/.env first, then projectPath/.env
 * Returns the model type found or null if none found.
 */
export function checkAndSetAiEnv(
  projectPath: string
): "anthropic" | "openai" | "google" | null {
  const apiKeys = [
    { key: "ANTHROPIC_API_KEY", model: "anthropic" as const },
    { key: "OPENAI_API_KEY", model: "openai" as const },
    { key: "GOOGLE_API_KEY", model: "google" as const },
  ] as const;

  // Helper to check and set env from a .env file path
  const checkEnvFile = (
    envPath: string
  ): { found: boolean; model: "anthropic" | "openai" | "google" | null } => {
    if (!existsSync(envPath)) {
      return { found: false, model: null };
    }

    try {
      const envContent = readFileSync(envPath, "utf-8");
      const parsed = parse(envContent);

      // Check keys in priority order
      for (const { key, model } of apiKeys) {
        const value = parsed[key];
        if (value && value.trim()) {
          process.env[key] = value;
          return { found: true, model };
        }
      }
    } catch {
      // If file can't be read or parsed, continue
    }

    return { found: false, model: null };
  };

  // First check projectPath/.davia/.env
  const daviaEnvPath = path.join(projectPath, ".davia", ".env");
  const daviaResult = checkEnvFile(daviaEnvPath);
  if (daviaResult.found && daviaResult.model) {
    console.log(
      chalk.dim(
        `✓ Using ${chalk.bold(daviaResult.model)} API key from ${daviaEnvPath}`
      )
    );
    return daviaResult.model;
  }

  // Then check projectPath/.env
  const projectEnvPath = path.join(projectPath, ".env");
  const projectResult = checkEnvFile(projectEnvPath);
  if (projectResult.found && projectResult.model) {
    console.log(
      chalk.dim(
        `✓ Using ${chalk.bold(projectResult.model)} API key from ${projectEnvPath}`
      )
    );
    return projectResult.model;
  }

  return null;
}
