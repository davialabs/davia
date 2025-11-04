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
 */
export function checkAndSetAiEnv(
  monorepoRoot: string,
  projectPath: string
): void {
  const apiKeys = [
    "ANTHROPIC_API_KEY",
    "OPENAI_API_KEY",
    "GOOGLE_API_KEY",
  ] as const;

  // Helper to check and set env from a .env file path
  const checkEnvFile = (envPath: string): boolean => {
    if (!existsSync(envPath)) {
      return false;
    }

    try {
      const envContent = readFileSync(envPath, "utf-8");
      const parsed = parse(envContent);

      // Check keys in priority order
      for (const key of apiKeys) {
        const value = parsed[key];
        if (value && value.trim()) {
          process.env[key] = value;
          return true;
        }
      }
    } catch {
      // If file can't be read or parsed, continue
    }

    return false;
  };

  // First check monorepo root .env
  const monorepoEnvPath = join(monorepoRoot, ".env");
  if (checkEnvFile(monorepoEnvPath)) {
    return;
  }

  // Then check project path .env
  const projectEnvPath = join(projectPath, ".env");
  checkEnvFile(projectEnvPath);
}
