import { createMiddleware, AIMessage, HumanMessage } from "langchain";
import { readRepositoryContent } from "./initialization.js";
import { STATIC_AGENT_INSTRUCT } from "../prompts/agent.js";
import {
  GIT_EXPLO_INSTRUCTIONS,
  HUMAN_MESSAGE,
} from "../prompts/repo_instructions.js";
import * as z from "zod";

/**
 * Format repository content as markdown
 * @param content - Dictionary of file paths to content
 * @returns Formatted markdown string
 */
export function formatRepositoryContent(
  content: Record<string, string>
): string {
  const files = Object.entries(content);

  if (files.length === 0) {
    return "No files found in repository.";
  }

  return files
    .map(([path, fileContent]) => {
      return `## File: ${path}\n\n${fileContent}\n`;
    })
    .join("\n");
}

/**
 * Middleware that initializes the agent with repository content
 * Runs before the agent starts and injects repository files as formatted messages
 */
export const repositoryInitializationMiddleware = createMiddleware({
  name: "RepositoryInitialization",
  contextSchema: z.object({
    sourcePath: z.string(),
  }),
  beforeAgent: async (state, runtime) => {
    // Get source path from context
    const { sourcePath } = runtime.context;

    // Read repository content
    const repositoryContent = await readRepositoryContent(sourcePath);

    // Format as markdown
    const formattedContent = formatRepositoryContent(repositoryContent);

    // Create git exploration instructions with repository content
    const gitExploInstructions = GIT_EXPLO_INSTRUCTIONS(formattedContent);

    // Create the message array to inject
    const messages = [
      new AIMessage(STATIC_AGENT_INSTRUCT),
      new AIMessage(gitExploInstructions),
      new HumanMessage(HUMAN_MESSAGE),
    ];

    // Return messages to inject into conversation
    return { messages };
  },
});
