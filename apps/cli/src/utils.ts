import { dirname, join } from "path";
import { existsSync, readFileSync, writeFileSync, statSync } from "fs";
import { parse } from "dotenv";
import { spawn, ChildProcess } from "child_process";
import open from "open";
import { nanoid } from "nanoid";
import chalk from "chalk";
import { runAgent } from "@davia/agent";

/**
 * Project state stored in projects.json
 */
export type ProjectState = {
  path: string;
  running: boolean;
};

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
    console.log(
      chalk.blue(
        `Using ${chalk.bold(monorepoResult.model)} API key in Davia settings`
      )
    );
    return monorepoResult.model;
  }

  // Log that nothing was found in monorepo root
  console.log(
    chalk.dim(
      `No environment variable found in Davia monorepo, looking in ${projectPath} for environment variables`
    )
  );

  // Then check project path .env
  const projectEnvPath = join(projectPath, ".env");
  const projectResult = checkEnvFile(projectEnvPath);
  if (projectResult.found && projectResult.model) {
    console.log(
      chalk.blue(
        `Using ${chalk.bold(projectResult.model)} API key in ${projectEnvPath}`
      )
    );
    return projectResult.model;
  }

  return null;
}

/**
 * Create a clickable terminal hyperlink using OSC 8 escape sequence
 */
export function createTerminalLink(url: string, text: string): string {
  // OSC 8 escape sequence for hyperlinks: \x1b]8;;URL\x1b\\TEXT\x1b]8;;\x1b\\
  return `\x1b]8;;${url}\x1b\\${text}\x1b]8;;\x1b\\`;
}

/**
 * Open browser at the given URL
 */
export async function openBrowser(
  url: string,
  projectId?: string
): Promise<void> {
  try {
    // If projectId is provided, open at the project URL instead
    const urlToOpen = projectId ? `http://localhost:3000/${projectId}` : url;
    await open(urlToOpen);
    if (projectId) {
      // Create clickable link to the project page
      const projectUrl = `http://localhost:3000/${projectId}`;
      const link = createTerminalLink(projectUrl, projectUrl);
      console.log(chalk.blue(`\n🌐 Browser opened at ${link}\n`));
    } else {
      console.log(chalk.blue(`\n🌐 Browser opened at ${url}\n`));
    }
  } catch (error) {
    console.error(chalk.red("Failed to open browser:"), error);
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
  /** Whether to filter out HTTP request logs (GET, POST, etc.) */
  filterRequestLogs?: boolean;
}

/**
 * Result of starting the Next.js dev server
 */
export interface NextJsDevServerResult {
  /** The spawned child process */
  process: ChildProcess;
  /** Function to manually open browser */
  openBrowser: (projectId?: string) => Promise<void>;
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
    filterRequestLogs = false,
  } = options;

  const webAppPath = join(monorepoRoot, "apps/web");
  const localhostUrl = "http://localhost:3000";
  let hasOpenedBrowser = false;

  console.log(chalk.blue("Starting Davia web app..."));

  // Start the Next.js dev server
  // Use pipe for stdout/stderr if we need to filter logs, otherwise inherit
  const devProcess = spawn("pnpm", ["dev"], {
    cwd: webAppPath,
    stdio: filterRequestLogs ? ["inherit", "pipe", "pipe"] : "inherit",
    shell: true,
    env: {
      ...process.env,
      DAVIA_MONOREPO_ROOT: monorepoRoot,
    },
  });

  // Filter stdout to hide HTTP request logs if requested
  if (filterRequestLogs && devProcess.stdout) {
    devProcess.stdout.on("data", (data: Buffer) => {
      const output = data.toString();
      // Only show lines that are not HTTP request logs (e.g., "GET / 307 in 1974ms")
      const lines = output.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        // Skip HTTP method logs (GET, POST, PUT, DELETE, PATCH followed by path and status)
        if (
          trimmed &&
          !trimmed.match(/^(GET|POST|PUT|DELETE|PATCH)\s+\S+\s+\d+\s+in/)
        ) {
          process.stdout.write(line + "\n");
        }
      }
    });
  }

  // Pass through stderr (always show errors)
  if (filterRequestLogs && devProcess.stderr) {
    devProcess.stderr.pipe(process.stderr);
  }

  // Helper to open browser (prevents multiple opens)
  const openBrowserOnce = async (projectId?: string) => {
    if (!hasOpenedBrowser) {
      hasOpenedBrowser = true;
      await openBrowser(localhostUrl, projectId);
    }
  };

  // Open browser after delay if requested
  let browserTimeout: NodeJS.Timeout | null = null;
  if (openBrowserOnStart) {
    browserTimeout = setTimeout(() => openBrowserOnce(), openBrowserDelay);
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

/**
 * Load projects from projects.json file
 */
export function loadProjects(
  projectsJsonPath: string
): Record<string, ProjectState> {
  let projects: Record<string, ProjectState> = {};
  try {
    if (existsSync(projectsJsonPath)) {
      const projectsContent = readFileSync(projectsJsonPath, "utf-8");
      if (projectsContent.trim()) {
        try {
          projects = JSON.parse(projectsContent);
        } catch {
          // If parsing fails, use empty projects
          projects = {};
        }
      }
    }
  } catch {
    // If reading fails, use empty projects
    projects = {};
  }
  return projects;
}

/**
 * Save projects to projects.json file
 */
export function saveProjects(
  projectsJsonPath: string,
  projects: Record<string, ProjectState>
): void {
  writeFileSync(projectsJsonPath, JSON.stringify(projects, null, 2), "utf-8");
}

/**
 * Find existing project ID by path or create a new one
 */
export function findOrCreateProjectId(
  projects: Record<string, ProjectState>,
  path: string,
  projectsJsonPath: string
): string {
  // Check if path already exists in projects.json
  let existingId: string | undefined;
  for (const [id, project] of Object.entries(projects)) {
    if (project.path === path) {
      existingId = id;
      break;
    }
  }

  // Determine the project ID
  if (!existingId) {
    // Generate nanoid and add to projects
    const id = nanoid();
    projects[id] = {
      path,
      running: false,
    };

    // Write updated projects.json
    saveProjects(projectsJsonPath, projects);
    return id;
  }

  return existingId;
}

/**
 * Ensure project is marked as running and return cleanup function
 */
export function ensureProjectRunning(
  projects: Record<string, ProjectState>,
  id: string,
  path: string,
  projectsJsonPath: string
): {
  project: ProjectState;
  setRunningFalse: () => void;
} {
  // Ensure project exists and get reference
  const project = projects[id] ?? { path, running: false };
  projects[id] = project;

  // Set running to true before agent run
  project.running = true;
  saveProjects(projectsJsonPath, projects);

  // Helper function to set running to false
  const setRunningFalse = () => {
    project.running = false;
    saveProjects(projectsJsonPath, projects);
  };

  return { project, setRunningFalse };
}

/**
 * Validate that a project path exists and is a directory
 */
export function validateProjectPath(path: string): void {
  if (!path || path.trim() === "") {
    throw new Error("No path provided. The path cannot be empty.");
  }

  let stats;
  try {
    stats = statSync(path);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      throw new Error(`The path "${path}" does not exist.`);
    } else if (err.code === "EACCES") {
      throw new Error(`Permission denied: Cannot access "${path}".`);
    } else if (err.code === "ENOTDIR") {
      throw new Error(
        `"${path}" is not a directory (it appears to be a file).`
      );
    } else {
      throw new Error(`Cannot access path "${path}": ${err.message}`);
    }
  }

  if (!stats.isDirectory()) {
    throw new Error(`"${path}" is not a directory.`);
  }
}

/**
 * Validate that monorepo root exists and has workspace files
 */
export function validateMonorepoRoot(monorepoRoot: string): void {
  const workspaceFileExists =
    existsSync(join(monorepoRoot, "pnpm-workspace.yaml")) ||
    existsSync(join(monorepoRoot, "turbo.json"));

  if (!workspaceFileExists) {
    throw new Error("Could not find monorepo root directory.");
  }
}

/**
 * Options for running agent with web interface
 */
export interface RunAgentWithWebOptions {
  sourcePath: string;
  daviaPath: string;
  projectId: string;
  model: "anthropic" | "openai" | "google";
  isUpdate: boolean;
  additionalInstructions?: string;
  monorepoRoot: string;
  projectsJsonPath: string;
  projects: Record<string, ProjectState>;
  noBrowser?: boolean;
}

/**
 * Run agent with optional web server and browser opening
 */
export async function runAgentWithWeb(
  options: RunAgentWithWebOptions
): Promise<void> {
  const {
    sourcePath,
    daviaPath,
    projectId,
    model,
    isUpdate,
    additionalInstructions,
    monorepoRoot,
    projectsJsonPath,
    projects,
    noBrowser = false,
  } = options;

  const { setRunningFalse } = ensureProjectRunning(
    projects,
    projectId,
    sourcePath,
    projectsJsonPath
  );

  let devServer: ReturnType<typeof startNextJsDevServer> | null = null;

  // Start the Next.js dev server if browser should be opened
  if (!noBrowser) {
    devServer = startNextJsDevServer({
      monorepoRoot,
      openBrowserOnStart: false, // We'll open manually after agent starts
      onSignal: setRunningFalse,
      filterRequestLogs: true, // Filter out GET/POST logs when running docs
    });

    // Wait a moment for Next.js server to show startup messages before starting agent
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  try {
    const agentPromise = runAgent(
      sourcePath,
      daviaPath,
      projectId,
      model,
      isUpdate,
      additionalInstructions
    );

    // Open browser after agent starts (give it a moment to initialize)
    if (!noBrowser && devServer) {
      setTimeout(async () => {
        await devServer!.openBrowser(projectId);
      }, 2000);
    }

    // Await agent completion
    await agentPromise;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    throw new Error(`Documentation generation failed: ${errorMsg}`);
  } finally {
    // Cleanup signal handlers
    if (devServer) {
      devServer.cleanup();
    }
    // Set running to false after agent completes or fails
    setRunningFalse();
  }
}
