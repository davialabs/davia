export interface AgentConfig {
  name: string;
  folderPath: string;
  fileName: string;
  frontmatter: string;
}

export const SUPPORTED_AGENTS: Record<string, AgentConfig> = {
  cursor: {
    name: "Cursor",
    folderPath: ".cursor/rules",
    fileName: "davia-documentation.mdc",
    frontmatter: "---\nalwaysApply: true\n---\n\n",
  },
  windsurf: {
    name: "Windsurf",
    folderPath: ".windsurf/rules",
    fileName: "davia-documentation.md",
    frontmatter: "---\ntrigger: always_on\n---\n\n",
  },
  "github-copilot": {
    name: "GitHub Copilot",
    folderPath: ".github/prompts",
    fileName: "davia-documentation.md",
    frontmatter: "---\nagent: 'agent'\n---\n\n",
  },
};

export function isValidAgent(agentType: string): boolean {
  return agentType in SUPPORTED_AGENTS;
}

export function getSupportedAgentsList(): string {
  return Object.keys(SUPPORTED_AGENTS).join(", ");
}

