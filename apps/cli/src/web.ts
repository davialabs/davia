import detectPort from "detect-port";
import open from "open";
import chalk from "chalk";
import { startWebServer } from "@davia/web";

/**
 * Finds an available port starting from the given port number
 */
export async function findAvailablePort(startPort: number): Promise<number> {
  const port = await detectPort(startPort);
  return port;
}

/**
 * Opens the browser at the given URL
 */
export async function openBrowser(url: string): Promise<void> {
  await open(url);
}

/**
 * Starts the web server and optionally opens the browser
 * @param projectId - The project ID to open in the browser
 * @param options - Configuration options
 * @returns A cleanup function to shut down the server
 */
export async function startWebServerWithBrowser(
  projectId: string,
  options?: { noBrowser?: boolean; port?: number }
): Promise<() => Promise<void>> {
  // Find available port starting from the specified port (default 3005)
  const startPort = options?.port ?? 3005;
  const port = await findAvailablePort(startPort);

  // Start the web server with the found port
  const serverPromise = startWebServer({ port });

  // Wait a bit for server to start, then open browser
  if (!options?.noBrowser) {
    serverPromise.then(() => {
      // Small delay to ensure server is ready
      setTimeout(async () => {
        const url = `http://localhost:${port}/${projectId}`;
        await openBrowser(url);
        console.log(chalk.blue(`\n🌐 Browser opened at ${url}\n`));
      }, 1000);
    });
  }

  // Return cleanup function
  return async () => {
    // The startWebServer doesn't return a server instance we can close,
    // so we'll rely on process signals for shutdown
    // This is a placeholder for now - actual shutdown will be handled by signals
  };
}

/**
 * Sets up graceful shutdown handlers for SIGINT and SIGTERM
 * @param cleanup - Optional async cleanup function to call on shutdown
 */
export function setupGracefulShutdown(cleanup?: () => Promise<void>): void {
  let isShuttingDown = false;

  const shutdown = async (signal: string) => {
    if (isShuttingDown) {
      return;
    }
    isShuttingDown = true;

    console.log(`\nReceived ${signal}, shutting down gracefully...`);
    try {
      if (cleanup) {
        await cleanup();
      }
    } catch (error) {
      console.error("Error during shutdown:", error);
    }
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}
