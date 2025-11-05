import { dirname, join } from "path";
import { existsSync, readFileSync } from "fs";
import { parse } from "dotenv";

/**
 * Find monorepo root (where pnpm-workspace.yaml or turbo.json exists)
 * by traversing up the directory tree from the start path.
 */
export function findMonorepoRoot(startPath: string): string {
  let current = startPath;
  while (current !== dirname(current)) {
    if (
      existsSync(join(current, "pnpm-workspace.yaml")) ||
      existsSync(join(current, "turbo.json"))
    ) {
      return current;
    }
    current = dirname(current);
  }
  return startPath;
}

/**
 * Check for AI API keys in .env files and set the first one found.
 * Priority: ANTHROPIC_API_KEY > OPENAI_API_KEY > GOOGLE_API_KEY
 * Checks monorepo root first, then the given path.
 * Returns the model type found or null if none found.
 */
export function checkAndSetAiEnv(
  monorepoRoot: string,
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

  // First check monorepo root .env
  const monorepoEnvPath = join(monorepoRoot, ".env");
  const monorepoResult = checkEnvFile(monorepoEnvPath);
  if (monorepoResult.found && monorepoResult.model) {
    console.log(`Using ${monorepoResult.model} API key in Davia settings`);
    return monorepoResult.model;
  }

  // Log that nothing was found in monorepo root
  console.log(
    `No environment variable found in Davia monorepo, looking in ${projectPath} for environment variables`
  );

  // Then check project path .env
  const projectEnvPath = join(projectPath, ".env");
  const projectResult = checkEnvFile(projectEnvPath);
  if (projectResult.found && projectResult.model) {
    console.log(`Using ${projectResult.model} API key in ${projectEnvPath}`);
    return projectResult.model;
  }

  return null;
}
