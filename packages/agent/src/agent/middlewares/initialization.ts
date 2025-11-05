import { createMiddleware, SystemMessage, HumanMessage } from "langchain";
import { readRepositoryContent } from "../helpers/initialization.js";
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

    // Get existing messages from state
    const messages = state.messages || [];

    // Read repository content
    const repositoryContent = await readRepositoryContent(sourcePath);

    // Format as markdown
    const formattedContent = formatRepositoryContent(repositoryContent);

    // Create git exploration instructions with repository content
    const gitExploInstructions = GIT_EXPLO_INSTRUCTIONS(formattedContent);

    // Only insert if there's no existing system message
    if (!messages.some((msg) => msg instanceof SystemMessage)) {
      // Create a single SystemMessage with content blocks
      const systemMessage = new SystemMessage({
        content: [
          {
            text: STATIC_AGENT_INSTRUCT,
            type: "text",
          },
          {
            text: gitExploInstructions,
            type: "text",
          },
        ],
      });

      // Insert at position 0
      messages.unshift(systemMessage);

      // Add human message after system message with cache control
      const humanMessage = new HumanMessage({
        content: [
          {
            text: HUMAN_MESSAGE,
            type: "text",
            cache_control: { type: "ephemeral", ttl: "5m" },
          },
        ],
      });

      // Insert at position 1 (after system message)
      messages.splice(1, 0, humanMessage);
    }

    // Return updated messages
    return { messages };
  },
});
