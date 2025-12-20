import type { AgentConfig } from "../../types.js";

export const antigravityConfig: AgentConfig = {
    name: "Antigravity",
    folderPath: ".agent/workflows",
    fileName: "davia-documentation.md",
    frontmatter: `---
description: Use whenever the user asks you to create, update, or read documentation/Wiki (docs, specs, design notes, API docs, etc.)
---

`,
};
