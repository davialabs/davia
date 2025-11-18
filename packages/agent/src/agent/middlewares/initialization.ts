import {
  createMiddleware,
  SystemMessage,
  HumanMessage,
  ContentBlock,
} from "langchain";
import { readRepositoryContent } from "../helpers/initialization.js";
import {
  STATIC_AGENT_INSTRUCT,
  DYNAMIC_AGENT_INSTRUCT,
} from "../prompts/agent.js";
import {
  GIT_EXPLO_INSTRUCTIONS,
  HUMAN_MESSAGE,
} from "../prompts/repo_instructions.js";
import { collectPaths, formatTree } from "../helpers/tree.js";
import { getAssetsPath } from "../helpers/tools.js";
import { contextSchema } from "../context.js";

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
  contextSchema,
  beforeAgent: async (state, runtime) => {
    // Get context values
    const { projectPath, isUpdate } = runtime.context;

    // Get existing messages from state
    const messages = state.messages || [];

    // Read repository content
    const repositoryContent = await readRepositoryContent(projectPath);

    // Format as markdown
    const formattedContent = formatRepositoryContent(repositoryContent);

    // Create git exploration instructions with repository content
    const gitExploInstructions = GIT_EXPLO_INSTRUCTIONS(
      formattedContent,
      isUpdate
    );

    // Only insert if there's no existing system message
    if (!messages.some((msg) => msg instanceof SystemMessage)) {
      // Build system message content blocks
      const contentBlocks: Array<ContentBlock> = [
        {
          text: STATIC_AGENT_INSTRUCT,
          type: "text",
        },
      ];

      // If isUpdate, add dynamic instruction with workspace tree
      if (isUpdate) {
        // Collect paths from assets folder
        const assetsPath = getAssetsPath(projectPath);
        const paths = await collectPaths(assetsPath);
        const tree = formatTree(paths);

        // Get current date and time
        const currentDateTime = new Date().toISOString();

        // Generate dynamic instruction
        const dynamicInstruction = DYNAMIC_AGENT_INSTRUCT(
          currentDateTime,
          tree
        );

        contentBlocks.push({
          text: dynamicInstruction,
          type: "text",
        });
      }

      // Add git exploration instructions
      contentBlocks.push({
        text: gitExploInstructions,
        type: "text",
      });

      // Create a single SystemMessage with content blocks
      const systemMessage = new SystemMessage({
        content: contentBlocks,
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
