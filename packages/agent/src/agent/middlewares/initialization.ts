import { createMiddleware, SystemMessage, HumanMessage } from "langchain";
import { readRepositoryContent } from "../helpers/initialization.js";
import { STATIC_AGENT_INSTRUCT } from "../prompts/agent.js";
import {
  GIT_EXPLO_INSTRUCTIONS,
  HUMAN_MESSAGE,
} from "../prompts/repo_instructions.js";
import {
  UPDATE_INSTRUCTIONS,
  UPDATE_HUMAN_MESSAGE,
} from "../prompts/update_instructions.js";
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
    isUpdate: z.boolean().optional(),
    existingHtmlFiles: z
      .array(
        z.object({
          path: z.string(),
          content: z.string(),
        })
      )
      .optional(),
    assetsPath: z.string().optional(),
  }),
  beforeAgent: async (state, runtime) => {
    // Get context values
    const { sourcePath, isUpdate, existingHtmlFiles } = runtime.context;

    // Get existing messages from state
    const messages = state.messages || [];

    // Read repository content
    const repositoryContent = await readRepositoryContent(sourcePath);

    // Format as markdown
    const formattedContent = formatRepositoryContent(repositoryContent);

    // Only insert if there's no existing system message
    if (!messages.some((msg) => msg instanceof SystemMessage)) {
      let instructionsText: string;
      let humanMessageText: string;

      if (isUpdate && existingHtmlFiles && existingHtmlFiles.length > 0) {
        // Use update instructions
        instructionsText = UPDATE_INSTRUCTIONS(
          formattedContent,
          existingHtmlFiles
        );
        humanMessageText = UPDATE_HUMAN_MESSAGE;
      } else {
        // Use regular initialization instructions
        instructionsText = GIT_EXPLO_INSTRUCTIONS(formattedContent);
        humanMessageText = HUMAN_MESSAGE;
      }

      // Create a single SystemMessage with content blocks
      const systemMessage = new SystemMessage({
        content: [
          {
            text: STATIC_AGENT_INSTRUCT,
            type: "text",
          },
          {
            text: instructionsText,
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
            text: humanMessageText,
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
