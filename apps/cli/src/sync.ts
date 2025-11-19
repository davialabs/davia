import fs from "fs-extra";
import chalk from "chalk";
import ora from "ora";
import open from "open";
import path from "node:path";
import { capitalCase } from "change-case";
import slug from "slug";
import { getConfigPath } from "./paths.js";
import { exitWithError } from "./utils.js";

// ============================================================================
// Types
// ============================================================================

interface DeviceCodeRequest {
  client_id?: string;
}

interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  verification_uri_complete: string;
  expires_in: number;
  interval: number;
}

interface TokenRequest {
  grant_type: string;
  device_code: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
}

interface Config {
  accessToken?: string;
}

interface CreateWorkspaceRequest {
  name: string;
  slug: string;
}

interface CreateWorkspaceResponse {
  id: string;
  slug: string;
}

// ============================================================================
// Config Management
// ============================================================================

/**
 * Reads config.json, creates it with empty object if it doesn't exist
 */
export async function readConfig(): Promise<Config> {
  const configPath = await getConfigPath();

  try {
    const config = await fs.readJson(configPath);
    return config || {};
  } catch {
    // File doesn't exist or is invalid, create empty object
    await fs.writeJson(configPath, {});
    return {};
  }
}

/**
 * Writes config object to config.json
 */
export async function writeConfig(config: Config): Promise<void> {
  const configPath = await getConfigPath();
  await fs.writeJson(configPath, config, { spaces: 2 });
}

/**
 * Gets the access token from config.json, or null if not found
 */
export async function getAccessToken(): Promise<string | null> {
  const config = await readConfig();
  return config.accessToken || null;
}

// ============================================================================
// Environment Detection
// ============================================================================

/**
 * Gets the server URL based on NODE_ENV
 */
export function getServerUrl(): string {
  const isDevelopment = process.env.NODE_ENV === "development";
  return isDevelopment
    ? "http://localhost:8000"
    : "https://server-208104258932.us-central1.run.app";
}

/**
 * Gets the frontend URL based on NODE_ENV
 */
export function getFrontendUrl(): string {
  const isDevelopment = process.env.NODE_ENV === "development";
  return isDevelopment ? "http://localhost:3000" : "https://davia.ai";
}

// ============================================================================
// OAuth API Functions
// ============================================================================

/**
 * Requests a device code from the OAuth server
 */
async function requestDeviceCode(): Promise<DeviceCodeResponse> {
  const serverUrl = getServerUrl();
  const response = await fetch(`${serverUrl}/oauth/device/code`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({} as DeviceCodeRequest),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to request device code: ${response.status} ${errorText}`
    );
  }

  return (await response.json()) as DeviceCodeResponse;
}

/**
 * Polls for an access token using the device code
 */
async function pollForToken(
  deviceCode: string,
  expiresIn: number,
  interval: number
): Promise<string> {
  const serverUrl = getServerUrl();
  const maxAttempts = expiresIn / interval; // 15 minutes / 5 seconds = 180 attempts
  let attempts = 0;

  const spinner = ora("Waiting for authorization...").start();

  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`${serverUrl}/oauth/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          grant_type: "urn:ietf:params:oauth:grant-type:device_code",
          device_code: deviceCode,
        } as TokenRequest),
      });

      if (response.ok) {
        const data = (await response.json()) as TokenResponse;
        spinner.succeed("Authorization successful!");
        return data.access_token;
      }

      // FastAPI HTTPException returns JSON with 'detail' field containing the OAuth error
      const errorData = (await response.json()) as { detail: string };
      const oauthError = errorData.detail;

      if (oauthError === "authorization_pending") {
        spinner.text = "Waiting for authorization...";
        // Wait for the polling interval
        await new Promise((resolve) => setTimeout(resolve, interval * 1000));
        attempts++;
        continue;
      }

      if (oauthError === "expired_token") {
        spinner.fail("Authorization code expired");
        throw new Error(
          "The authorization code has expired. Please try again."
        );
      }

      if (oauthError === "invalid_grant") {
        spinner.fail("Invalid authorization code");
        throw new Error(
          "Invalid authorization code. Please request a new code."
        );
      }

      // Other errors
      spinner.fail("Authorization failed");
      throw new Error(oauthError || "Unknown error");
    } catch (error) {
      if (error instanceof Error && error.message.includes("expired")) {
        throw error;
      }
      if (error instanceof Error && error.message.includes("Invalid")) {
        throw error;
      }
      // Network or other errors - retry after interval
      spinner.text = `Retrying in ${interval} seconds...`;
      await new Promise((resolve) => setTimeout(resolve, interval * 1000));
      attempts++;
    }
  }

  spinner.fail("Authorization timed out");
  throw new Error(
    "Authorization timed out. The code may have expired. Please try again."
  );
}

// ============================================================================
// Login Function
// ============================================================================

/**
 * Ensures the user is logged in. If not, initiates the OAuth device flow.
 * Returns the access token.
 * @param noBrowser - If true, don't automatically open the browser
 */
export async function ensureLoggedIn(noBrowser = false): Promise<string> {
  // Check if token exists
  const existingToken = await getAccessToken();
  if (existingToken) {
    return existingToken;
  }

  // Initiate login flow
  console.log(chalk.blue("\n🔐 Starting authentication...\n"));

  try {
    // Request device code
    const deviceCodeResponse = await requestDeviceCode();

    // Build verification URL
    const frontendUrl = getFrontendUrl();
    const verificationUrl = `${frontendUrl}${deviceCodeResponse.verification_uri_complete}`;

    // Display user code and URL
    console.log(
      chalk.bold("Your verification code:"),
      chalk.cyan(deviceCodeResponse.user_code)
    );
    console.log(chalk.dim(`Verification URL: ${verificationUrl}\n`));

    // Open browser automatically unless --no-browser is specified
    if (!noBrowser) {
      await open(verificationUrl);
      console.log(chalk.green("✓ Browser opened\n"));
    }

    // Poll for token
    const accessToken = await pollForToken(
      deviceCodeResponse.device_code,
      deviceCodeResponse.expires_in,
      deviceCodeResponse.interval
    );

    // Save token to config
    await writeConfig({ accessToken });

    console.log(chalk.green.bold("\n✅ Successfully logged in!\n"));

    return accessToken;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    exitWithError("Login failed", [
      errorMessage,
      "",
      "💡 Troubleshooting tips:",
      "  • Make sure you completed the authorization in your browser",
      "  • Check that the verification code hasn't expired",
      "  • Try running the login command again",
    ]);
  }
}

// ============================================================================
// Link Function
// ============================================================================

/**
 * Links a project folder to an online workspace by creating a new workspace.
 * Generates a workspace name from the folder's base name and creates it via API.
 * @param projectPath - The path to the project folder
 * @returns The workspace ID
 */
export async function link(projectPath: string): Promise<string> {
  // Ensure user is logged in
  const accessToken = await ensureLoggedIn();

  // Extract folder base name
  const folderName = path.basename(projectPath);

  // Convert to capitalCase
  const capitalCaseName = capitalCase(folderName);

  // Slugify the capitalCase name
  const slugifiedName = slug(capitalCaseName);

  // Make POST request to create workspace
  const serverUrl = getServerUrl();
  const spinner = ora("Creating workspace...").start();

  try {
    const response = await fetch(`${serverUrl}/cli/workspaces`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        name: capitalCaseName,
        slug: slugifiedName,
      } as CreateWorkspaceRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      spinner.fail("Failed to create workspace");
      throw new Error(
        `Failed to create workspace: ${response.status} ${errorText}`
      );
    }

    const data = (await response.json()) as CreateWorkspaceResponse;
    spinner.succeed("Workspace created successfully");
    return data.id;
  } catch (error) {
    spinner.fail("Failed to create workspace");
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to create workspace: ${errorMessage}`);
  }
}
