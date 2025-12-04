import fs from "fs-extra";
import path from "node:path";
import chalk from "chalk";
import { getNestedValue, setNestedValue } from "./utils.js";
import type { JsonConfigFile } from "./types.js";

/**
 * Handles JSON config file creation/update with append logic
 * @param projectRoot - The root directory of the user's project
 * @param jsonConfig - The JSON config file configuration
 */
export async function handleJsonConfigFile(
  projectRoot: string,
  jsonConfig: JsonConfigFile
): Promise<void> {
  const configDir = path.join(projectRoot, jsonConfig.folderPath);
  const configFile = path.join(configDir, jsonConfig.fileName);
  const { path: appendPath, value: appendValue } = jsonConfig.appendTo;

  try {
    let configContent: Record<string, unknown>;

    if (await fs.pathExists(configFile)) {
      // File exists - read and append to the target array
      const existingContent = await fs.readFile(configFile, "utf-8");
      configContent = JSON.parse(existingContent);

      // Get or initialize the target array using dot-notation path
      let targetArray = getNestedValue(configContent, appendPath) as
        | string[]
        | undefined;
      if (!targetArray) {
        targetArray = [];
        setNestedValue(configContent, appendPath, targetArray);
      }

      // Check if the value is already in the array
      if (!targetArray.includes(appendValue)) {
        targetArray.push(appendValue);
        setNestedValue(configContent, appendPath, targetArray);

        await fs.writeFile(
          configFile,
          JSON.stringify(configContent, null, 2),
          "utf-8"
        );
        console.log(
          chalk.green(
            `✓ Updated ${jsonConfig.fileName} - added "${appendValue}" to ${appendPath}`
          )
        );
      } else {
        console.log(
          chalk.yellow(
            `⚠️  ${jsonConfig.fileName} already contains "${appendValue}" in ${appendPath}`
          )
        );
      }
    } else {
      // File doesn't exist - create with default content and the value
      configContent = JSON.parse(JSON.stringify(jsonConfig.defaultContent)); // deep clone

      // Get or initialize the target array and add the value
      let targetArray = getNestedValue(configContent, appendPath) as
        | string[]
        | undefined;
      if (!targetArray) {
        targetArray = [];
      }
      targetArray.push(appendValue);
      setNestedValue(configContent, appendPath, targetArray);

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
