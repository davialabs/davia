import type { AgentConfig } from "../../types.js";

export const openCodeConfig: AgentConfig = {
  name: "Open Code",
  folderPath: ".davia",
  fileName: "davia-documentation.md",
  frontmatter: `<!--
name: davia-documentation
description: Use whenever the user asks you to create, update, or read documentation/Wiki (docs, specs, design notes, API docs, etc.).
-->

`,
  jsonConfigs: [
    {
      folderPath: "",
      fileName: "opencode.json",
      defaultContent: {
        $schema: "https://opencode.ai/config.json",
        instructions: [],
      },
      appendTo: {
        path: "instructions",
        value: ".davia/davia-documentation.md",
      },
    },
  ],
};

