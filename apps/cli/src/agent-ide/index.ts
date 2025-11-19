import fs from "fs-extra";
import path from "node:path";
import chalk from "chalk";
import { fileURLToPath } from "node:url";
import {
  SUPPORTED_AGENTS,
  isValidAgent,
  getSupportedAgentsList,
} from "./agents.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Writes agent-specific configuration file to the project root
 * @param projectRoot - The root directory of the user's project
 * @param agentType - The type of agent (cursor, windsurf, github-copilot)
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

  const agentConfig = SUPPORTED_AGENTS[agentType];
  const targetDir = path.join(projectRoot, agentConfig.folderPath);
  const targetFile = path.join(targetDir, agentConfig.fileName);

  // Check if the file already exists
  if (await fs.pathExists(targetFile)) {
    console.log(
      chalk.yellow(
        `⚠️  ${agentConfig.name} configuration already exists at ${path.relative(projectRoot, targetFile)}`
      )
    );
    console.log(chalk.yellow("   Skipping agent configuration generation."));
    return;
  }

  try {
    // Read the template content
    const templatePath = path.join(__dirname, "template.md");
    const templateContent = await fs.readFile(templatePath, "utf-8");

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
  } catch (error) {
    console.error(
      chalk.red(
        `❌ Failed to create ${agentConfig.name} configuration: ${error instanceof Error ? error.message : String(error)}`
      )
    );
  }
}

