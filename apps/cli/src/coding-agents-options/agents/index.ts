import type { AgentConfig } from "../types.js";
import { cursorConfig } from "./cursor/index.js";
import { windsurfConfig } from "./windsurf/index.js";
import { githubCopilotConfig } from "./github-copilot/index.js";
import { claudeCodeConfig } from "./claude-code/index.js";
import { openCodeConfig } from "./open-code/index.js";

export const SUPPORTED_AGENTS: Record<string, AgentConfig> = {
  cursor: cursorConfig,
  windsurf: windsurfConfig,
  "github-copilot": githubCopilotConfig,
  "claude-code": claudeCodeConfig,
  "open-code": openCodeConfig,
};

export function isValidAgent(agentType: string): boolean {
  return agentType in SUPPORTED_AGENTS;
}

export function getSupportedAgentsList(): string {
  return Object.keys(SUPPORTED_AGENTS).join(", ");
}

// Re-export individual configs for direct access if needed
export { cursorConfig } from "./cursor/index.js";
export { windsurfConfig } from "./windsurf/index.js";
export { githubCopilotConfig } from "./github-copilot/index.js";
export { claudeCodeConfig } from "./claude-code/index.js";
export { openCodeConfig } from "./open-code/index.js";
