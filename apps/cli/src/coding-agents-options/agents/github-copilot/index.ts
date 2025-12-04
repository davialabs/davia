import type { AgentConfig } from "../../types.js";

export const githubCopilotConfig: AgentConfig = {
  name: "GitHub Copilot",
  folderPath: ".github/prompts",
  fileName: "davia-documentation.md",
  frontmatter: "---\nagent: 'agent'\n---\n\n",
};

