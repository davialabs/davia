import type { AgentConfig } from "../../types.js";

export const augmentConfig: AgentConfig = {
  name: "Augment",
  folderPath: ".augment/rules",
  fileName: "davia-documentation.md",
  frontmatter: `---
type: agent_requested
description: Use whenever the user asks you to create, update, or read documentation/Wiki (docs, specs, design notes, API docs, etc.).
---

`,
};

