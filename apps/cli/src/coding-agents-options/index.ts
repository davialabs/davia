import fs from "fs-extra";
import path from "node:path";
import chalk from "chalk";
import {
  SUPPORTED_AGENTS,
  isValidAgent,
  getSupportedAgentsList,
  getTemplateContent,
} from "./agent-rule.js";

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

  const agentConfig = SUPPORTED_AGENTS[agentType]!;
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

    // Write additional files if any
    if (agentConfig.additionalFiles) {
      for (const additionalFile of agentConfig.additionalFiles) {
        const additionalDir = path.join(projectRoot, additionalFile.folderPath);
        const additionalFilePath = path.join(
          additionalDir,
          additionalFile.fileName
        );

        // Check if additional file already exists
        if (await fs.pathExists(additionalFilePath)) {
          console.log(
            chalk.yellow(
              `⚠️  ${additionalFile.fileName} already exists at ${path.relative(projectRoot, additionalFilePath)}`
            )
          );
          continue;
        }

        await fs.ensureDir(additionalDir);
        await fs.writeFile(additionalFilePath, additionalFile.content, "utf-8");

        console.log(
          chalk.green(
            `✓ Created ${additionalFile.fileName} at ${path.relative(projectRoot, additionalFilePath)}`
          )
        );
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
