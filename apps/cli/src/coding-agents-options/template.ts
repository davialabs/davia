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

