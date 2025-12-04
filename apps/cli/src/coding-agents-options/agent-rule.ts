export interface AdditionalFile {
  folderPath: string;
  fileName: string;
  content: string;
}

export interface JsonConfigFile {
  folderPath: string;
  fileName: string;
  defaultContent: Record<string, unknown>;
  instructionKey: string; // key in the JSON to append to (e.g., "instructions")
  instructionPath: string; // path to add to the array
}

export interface AgentConfig {
  name: string;
  folderPath: string;
  fileName: string;
  frontmatter: string;
  additionalFiles?: AdditionalFile[];
  jsonConfig?: JsonConfigFile; // for agents that need a JSON config file (like open-code)
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
  "claude-code": {
    name: "Claude Code",
    folderPath: ".claude/skills/davia-documentation",
    fileName: "SKILL.md",
    frontmatter:
      "---\nname: davia-documentation\ndescription: Use whenever the user asks you to create, update, or read *documentation*/*Wiki* (docs, specs, design notes, API docs, etc.).\n---\n\n",
    additionalFiles: [
      {
        folderPath: ".claude",
        fileName: "settings.local.json",
        content: JSON.stringify(
          {
            permissions: {
              allow: ["Skill(davia-documentation)"],
              deny: [],
              ask: [],
            },
          },
          null,
          2
        ),
      },
    ],
  },
  "open-code": {
    name: "Open Code",
    folderPath: ".davia",
    fileName: "davia-documentation.md",
    frontmatter: `<!--
name: davia-documentation
description: Use whenever the user asks you to create, update, or read documentation/Wiki (docs, specs, design notes, API docs, etc.).
-->

`,
    jsonConfig: {
      folderPath: "",
      fileName: "opencode.json",
      defaultContent: {
        $schema: "https://opencode.ai/config.json",
        instructions: [],
      },
      instructionKey: "instructions",
      instructionPath: ".davia/davia-documentation.md",
    },
  },
};

export function isValidAgent(agentType: string): boolean {
  return agentType in SUPPORTED_AGENTS;
}

export function getSupportedAgentsList(): string {
  return Object.keys(SUPPORTED_AGENTS).join(", ");
}

export function getTemplateContent(): string {
  return `# Davia Documentation Rules

You are working in a project that uses **Davia** for all internal documentation.

## Core rule

Whenever the user asks you to create, update, or read *documentation* (docs, specs, design notes, API docs, READMEs, etc.), you **must** handle it using the Davia paradigm:

- Treat the .davia folder at the repository root as the single source of truth for project documentation.
- Prefer creating or updating Davia wiki entries inside .davia instead of creating or editing README files or other ad-hoc docs.

## Davia wiki vs README

- If the user asks for a general documentation, interpret that as a request for a **Davia wiki page** inside .davia, and implement it there instead of creating a traditional README.
- Only touch existing README files when the user explicitly instructs you to.

## Safety and instructions

Before you create, edit, or delete any files inside .davia, you **must first read** the instruction file in that folder and strictly follow its conventions when manipulating documentation files.
The instructions are in the .davia/AGENTS.md file, you **must** read it completely.

## Helpful CLI commands (for the user)

The user has access to these Davia terminal commands:

- davia open — start the Davia web server to browse and edit documentation.
- davia login — log the user into their Davia profile.

After you have generated documentation, you should **run the \`davia open\` command** to display the documentation in the user's browser.

Always keep all documentation work aligned with the Davia wiki structure and conventions in .davia.`;
}
