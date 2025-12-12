import type { AgentConfig } from "../../types.js";

export const augmentConfig: AgentConfig = {
  name: "Augment",
  folderPath: ".augment/rules",
  fileName: "davia-documentation.md",
  frontmatter: `---
type: always_apply
---
`,
};
