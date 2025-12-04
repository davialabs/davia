import type { AgentConfig } from "../../types.js";

export const githubCopilotConfig: AgentConfig = {
  name: "GitHub Copilot",
  folderPath: ".github/instructions",
  fileName: "davia.instructions.md",
  frontmatter: '---\napplyTo: "**"\nexcludeAgent: "code-review"\n---\n\n',
};
