import { dirname, join } from "path";
import { existsSync, readFileSync } from "fs";
import { parse } from "dotenv";
import { spawn, ChildProcess } from "child_process";
import open from "open";

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

/**
 * Open browser at the given URL
 */
export async function openBrowser(url: string): Promise<void> {
  try {
    await open(url);
    console.log(`Opened browser at ${url}`);
  } catch (error) {
    console.error("Failed to open browser:", error);
  }
}

/**
 * Options for starting the Next.js dev server
 */
export interface StartNextJsDevServerOptions {
  /** Monorepo root path */
  monorepoRoot: string;
  /** Whether to open browser automatically after delay */
  openBrowserOnStart?: boolean;
  /** Delay in ms before opening browser */
  openBrowserDelay?: number;
  /** Callback for cleanup on process termination */
  onSignal?: () => void;
}

/**
 * Result of starting the Next.js dev server
 */
export interface NextJsDevServerResult {
  /** The spawned child process */
  process: ChildProcess;
  /** Function to manually open browser */
  openBrowser: () => Promise<void>;
  /** Function to cleanup signal handlers */
  cleanup: () => void;
}

/**
 * Start the Next.js dev server with optional browser opening.
 * Returns the process and utility functions.
 */
export function startNextJsDevServer(
  options: StartNextJsDevServerOptions
): NextJsDevServerResult {
  const {
    monorepoRoot,
    openBrowserOnStart = false,
    openBrowserDelay = 5000,
    onSignal,
  } = options;

  const webAppPath = join(monorepoRoot, "apps/web");
  const localhostUrl = "http://localhost:3000";
  let hasOpenedBrowser = false;

  console.log("Starting Davia web app...");

  // Start the Next.js dev server
  const devProcess = spawn("pnpm", ["dev"], {
    cwd: webAppPath,
    stdio: "inherit",
    shell: true,
    env: {
      ...process.env,
      DAVIA_MONOREPO_ROOT: monorepoRoot,
    },
  });

  // Helper to open browser (prevents multiple opens)
  const openBrowserOnce = async () => {
    if (!hasOpenedBrowser) {
      hasOpenedBrowser = true;
      await openBrowser(localhostUrl);
    }
  };

  // Open browser after delay if requested
  let browserTimeout: NodeJS.Timeout | null = null;
  if (openBrowserOnStart) {
    browserTimeout = setTimeout(openBrowserOnce, openBrowserDelay);
  }

  // Handle process termination
  const handleSignal = () => {
    onSignal?.();
    devProcess.kill();
    process.exit(0);
  };
  process.on("SIGINT", handleSignal);
  process.on("SIGTERM", handleSignal);

  // Cleanup function
  const cleanup = () => {
    if (browserTimeout) {
      clearTimeout(browserTimeout);
    }
    process.removeListener("SIGINT", handleSignal);
    process.removeListener("SIGTERM", handleSignal);
  };

  return {
    process: devProcess,
    openBrowser: openBrowserOnce,
    cleanup,
  };
}
