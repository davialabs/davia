import fs from "fs-extra";
import path from "node:path";

/**
 * Creates an empty prompt.md file at the specified path
 * This is a placeholder function for future content
 */
export async function createPromptMd(daviaPath: string): Promise<void> {
  const promptMdPath = path.join(daviaPath, "prompt.md");
  await fs.writeFile(promptMdPath, "");
}
