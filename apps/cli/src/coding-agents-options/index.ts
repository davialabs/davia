import fs from "fs-extra";
import path from "node:path";
import chalk from "chalk";
import {
  SUPPORTED_AGENTS,
  isValidAgent,
  getSupportedAgentsList,
  getTemplateContent,
  type JsonConfigFile,
} from "./agent-rule.js";

/**
 * Handles JSON config file creation/update with append logic
 * @param projectRoot - The root directory of the user's project
 * @param jsonConfig - The JSON config file configuration
 */
async function handleJsonConfigFile(
  projectRoot: string,
  jsonConfig: JsonConfigFile
): Promise<void> {
  const configDir = path.join(projectRoot, jsonConfig.folderPath);
  const configFile = path.join(configDir, jsonConfig.fileName);

  try {
    let configContent: Record<string, unknown>;

    if (await fs.pathExists(configFile)) {
      // File exists - read and append to instructions
      const existingContent = await fs.readFile(configFile, "utf-8");
      configContent = JSON.parse(existingContent);

      // Get or initialize the instructions array
      const instructions =
        (configContent[jsonConfig.instructionKey] as string[]) || [];

      // Check if the instruction path is already in the array
      if (!instructions.includes(jsonConfig.instructionPath)) {
        instructions.push(jsonConfig.instructionPath);
        configContent[jsonConfig.instructionKey] = instructions;

        await fs.writeFile(
          configFile,
          JSON.stringify(configContent, null, 2),
          "utf-8"
        );
        console.log(
          chalk.green(
            `✓ Updated ${jsonConfig.fileName} - added "${jsonConfig.instructionPath}" to ${jsonConfig.instructionKey}`
          )
        );
      } else {
        console.log(
          chalk.yellow(
            `⚠️  ${jsonConfig.fileName} already contains "${jsonConfig.instructionPath}" in ${jsonConfig.instructionKey}`
          )
        );
      }
    } else {
      // File doesn't exist - create with default content
      configContent = {
        ...jsonConfig.defaultContent,
        [jsonConfig.instructionKey]: [jsonConfig.instructionPath],
      };

      await fs.ensureDir(configDir);
      await fs.writeFile(
        configFile,
        JSON.stringify(configContent, null, 2),
        "utf-8"
      );
      console.log(
        chalk.green(
          `✓ Created ${jsonConfig.fileName} at ${path.relative(projectRoot, configFile)}`
        )
      );
    }
  } catch (error) {
    console.error(
      chalk.red(
        `❌ Failed to handle ${jsonConfig.fileName}: ${error instanceof Error ? error.message : String(error)}`
      )
    );
  }
}

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
  const docFileExists = await fs.pathExists(targetFile);
  if (docFileExists) {
    console.log(
      chalk.yellow(
        `⚠️  ${agentConfig.name} configuration already exists at ${path.relative(projectRoot, targetFile)}`
      )
    );
    console.log(chalk.yellow("   Skipping agent configuration generation."));

    // Still handle JSON config if specified (e.g., for open-code)
    // This allows updating opencode.json even if davia-documentation.md exists
    if (agentConfig.jsonConfig) {
      await handleJsonConfigFile(projectRoot, agentConfig.jsonConfig);
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

    // Handle JSON config file if specified (e.g., for open-code)
    if (agentConfig.jsonConfig) {
      await handleJsonConfigFile(projectRoot, agentConfig.jsonConfig);
    }
  } catch (error) {
    console.error(
      chalk.red(
        `❌ Failed to create ${agentConfig.name} configuration: ${error instanceof Error ? error.message : String(error)}`
      )
    );
  }
}
