import type { AgentConfig } from "../../types.js";

export const cursorConfig: AgentConfig = {
  name: "Cursor",
  folderPath: ".cursor/rules",
  fileName: "davia-documentation.mdc",
  frontmatter: "---\nalwaysApply: true\n---\n\n",
};
