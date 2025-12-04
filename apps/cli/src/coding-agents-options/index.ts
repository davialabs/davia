import fs from "fs-extra";
import path from "node:path";
import chalk from "chalk";
import {
  SUPPORTED_AGENTS,
  isValidAgent,
  getSupportedAgentsList,
} from "./agents/index.js";
import { handleJsonConfigFile } from "./json-config/handler.js";
import { getTemplateContent } from "./template.js";

// Re-export for external consumers
export {
  SUPPORTED_AGENTS,
  isValidAgent,
  getSupportedAgentsList,
} from "./agents/index.js";
export { getTemplateContent } from "./template.js";
export type { AgentConfig } from "./types.js";
export type { JsonConfigFile } from "./json-config/index.js";

/**
 * Writes agent-specific configuration file to the project root
 * @param projectRoot - The root directory of the user's project
 * @param agentType - The type of agent (cursor, windsurf, github-copilot, claude-code, open-code)
 */
export async function writeAgentConfig(
  projectRoot: string,
  agentType: string
): Promise<void> {
  // Validate agent type
  if (!isValidAgent(agentType)) {
    console.log(
      chalk.red(
        `❌ Invalid agent type: "${agentType}". Supported agents: ${getSupportedAgentsList()}`
      )
    );
    return;
  }

  const agentConfig = SUPPORTED_AGENTS[agentType]!;
  const targetDir = path.join(projectRoot, agentConfig.folderPath);
  const targetFile = path.join(targetDir, agentConfig.fileName);

  // Check if the file already exists
  const docFileExists = await fs.pathExists(targetFile);
  if (docFileExists) {
    console.log(
      chalk.yellow(
        `⚠️  ${agentConfig.name} configuration already exists at ${path.relative(projectRoot, targetFile)}`
      )
    );
    console.log(chalk.yellow("   Skipping agent configuration generation."));

    // Still handle JSON configs if specified (e.g., for open-code, claude-code)
    // This allows updating config files even if davia-documentation.md exists
    if (agentConfig.jsonConfigs) {
      for (const jsonConfig of agentConfig.jsonConfigs) {
        await handleJsonConfigFile(projectRoot, jsonConfig);
      }
    }
    return;
  }

  try {
    // Get the template content
    const templateContent = getTemplateContent();

    // Combine frontmatter with template content
    const fileContent = agentConfig.frontmatter + templateContent;

    // Ensure the target directory exists
    await fs.ensureDir(targetDir);

    // Write the configuration file
    await fs.writeFile(targetFile, fileContent, "utf-8");

    console.log(
      chalk.green(
        `✓ Created ${agentConfig.name} configuration at ${path.relative(projectRoot, targetFile)}`
      )
    );

    // Handle JSON config files if specified (e.g., for open-code, claude-code)
    if (agentConfig.jsonConfigs) {
      for (const jsonConfig of agentConfig.jsonConfigs) {
        await handleJsonConfigFile(projectRoot, jsonConfig);
      }
    }
  } catch (error) {
    console.error(
      chalk.red(
        `❌ Failed to create ${agentConfig.name} configuration: ${error instanceof Error ? error.message : String(error)}`
      )
    );
  }
}
