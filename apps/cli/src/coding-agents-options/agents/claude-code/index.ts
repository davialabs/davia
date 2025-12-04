import type { AgentConfig } from "../../types.js";

export const claudeCodeConfig: AgentConfig = {
  name: "Claude Code",
  folderPath: ".claude/skills/davia-documentation",
  fileName: "SKILL.md",
  frontmatter:
    "---\nname: davia-documentation\ndescription: Use whenever the user asks you to create, update, or read *documentation*/*Wiki* (docs, specs, design notes, API docs, etc.).\n---\n\n",
  jsonConfigs: [
    {
      folderPath: ".claude",
      fileName: "settings.local.json",
      defaultContent: {
        permissions: {
          allow: [],
          deny: [],
          ask: [],
        },
      },
      appendTo: {
        path: "permissions.allow",
        value: "Skill(davia-documentation)",
      },
    },
  ],
};
