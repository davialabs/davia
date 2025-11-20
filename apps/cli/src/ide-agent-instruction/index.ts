import fs from "fs-extra";
import path from "node:path";
import { generateAgentInstructions } from "./agent-instruct.js";

/**
 * Creates an AGENTS.md file with agent instructions at the specified path
 */
export async function createAgentsMd(daviaPath: string): Promise<void> {
  const agentsMdPath = path.join(daviaPath, "AGENTS.md");
  const content = generateAgentInstructions();
  await fs.writeFile(agentsMdPath, content);
}
