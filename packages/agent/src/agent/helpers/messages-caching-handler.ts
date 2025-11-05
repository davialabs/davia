import { AIMessage, ToolMessage, BaseMessage } from "langchain";

/**
 * Type for content blocks with optional cache control
 */
interface ContentBlockWithCacheControl {
  type?: string;
  text?: string;
  cache_control?: {
    type: "ephemeral";
    ttl: string;
  };
  [key: string]: unknown;
}

/**
 * Deep clone a message to avoid mutating the original
 * @param message - Message to clone
 * @returns Cloned message
 */
function cloneMessage<T extends BaseMessage>(message: T): T {
  // Use structuredClone if available, otherwise fall back to JSON
  if (typeof structuredClone !== "undefined") {
    return structuredClone(message);
  }
  return JSON.parse(JSON.stringify(message)) as T;
}

/**
 * Ensures only the last AI message has cache control (TTL).
 * Removes cache control from all other AI messages.
 * @param messages - List of messages to modify
 */
export function handleAIMessageCaching(messages: BaseMessage[]): void {
  // Find all AI message indices
  const aiIndices: number[] = [];
  for (let i = 0; i < messages.length; i++) {
    if (messages[i] instanceof AIMessage) {
      aiIndices.push(i);
    }
  }

  if (aiIndices.length === 0) {
    return;
  }

  // Remove cache control from all AI messages first
  for (const idx of aiIndices) {
    const aiMsg = messages[idx];
    if (aiMsg && Array.isArray(aiMsg.content)) {
      // Create a deep copy to avoid modifying the original
      const aiMsgCopy = cloneMessage(aiMsg);

      for (const block of aiMsgCopy.content) {
        if (
          typeof block === "object" &&
          block !== null &&
          "cache_control" in block
        ) {
          const blockWithCache = block as ContentBlockWithCacheControl;
          delete blockWithCache.cache_control;
        }
      }

      messages[idx] = aiMsgCopy;
    }
  }

  // Add cache control only to the last AI message
  const lastAiIdx = aiIndices[aiIndices.length - 1];
  if (lastAiIdx === undefined) {
    return;
  }
  const lastAiMsg = messages[lastAiIdx];
  if (!lastAiMsg) {
    return;
  }

  if (Array.isArray(lastAiMsg.content) && lastAiMsg.content.length > 0) {
    // Ensure we have a copy to modify
    const lastAiMsgCopy = cloneMessage(lastAiMsg);
    const contentArray = [...lastAiMsgCopy.content];
    const lastBlock = contentArray[contentArray.length - 1];

    // Add cache control to the last content block
    if (typeof lastBlock === "object" && lastBlock !== null) {
      const blockWithCache = { ...lastBlock } as ContentBlockWithCacheControl;
      blockWithCache.cache_control = {
        type: "ephemeral",
        ttl: "5m",
      };
      contentArray[contentArray.length - 1] =
        blockWithCache as typeof lastBlock;
    } else {
      // If last block is not a dict, wrap it
      contentArray[contentArray.length - 1] = {
        type: "text",
        text: lastBlock as string,
        cache_control: { type: "ephemeral", ttl: "5m" },
      };
    }

    (lastAiMsgCopy as { content: unknown }).content = contentArray;
    messages[lastAiIdx] = lastAiMsgCopy;
  }
}

/**
 * Ensures only the last ToolMessage has cache control (TTL).
 * Converts string content to list format and removes cache control from all other ToolMessages.
 * @param messages - List of messages to modify
 */
export function handleToolMessageCaching(messages: BaseMessage[]): void {
  // Find all ToolMessage indices
  const toolIndices: number[] = [];
  for (let i = 0; i < messages.length; i++) {
    if (messages[i] instanceof ToolMessage) {
      toolIndices.push(i);
    }
  }

  if (toolIndices.length === 0) {
    return;
  }

  // Remove cache control from all ToolMessages first
  for (const idx of toolIndices) {
    const toolMsg = messages[idx];
    if (toolMsg && Array.isArray(toolMsg.content)) {
      // Create a copy to avoid modifying the original
      const toolMsgCopy = cloneMessage(toolMsg);

      for (const block of toolMsgCopy.content) {
        if (
          typeof block === "object" &&
          block !== null &&
          "cache_control" in block
        ) {
          const blockWithCache = block as ContentBlockWithCacheControl;
          delete blockWithCache.cache_control;
        }
      }

      messages[idx] = toolMsgCopy;
    }
  }

  // Add cache control only to the last ToolMessage
  const lastToolIdx = toolIndices[toolIndices.length - 1];
  if (lastToolIdx === undefined) {
    return;
  }
  const lastToolMsg = messages[lastToolIdx];
  if (!lastToolMsg) {
    return;
  }

  // Convert string content to list format with cache control
  if (typeof lastToolMsg.content === "string") {
    const lastToolMsgCopy = cloneMessage(lastToolMsg);
    lastToolMsgCopy.content = [
      {
        type: "text",
        text: lastToolMsg.content,
        cache_control: { type: "ephemeral", ttl: "5m" },
      },
    ];
    messages[lastToolIdx] = lastToolMsgCopy;
  } else if (
    Array.isArray(lastToolMsg.content) &&
    lastToolMsg.content.length > 0
  ) {
    // If already a list, add cache control to the first element
    const lastToolMsgCopy = cloneMessage(lastToolMsg);
    const contentArray = [...lastToolMsgCopy.content];
    const firstBlock = contentArray[0];

    if (typeof firstBlock === "object" && firstBlock !== null) {
      const blockWithCache = { ...firstBlock } as ContentBlockWithCacheControl;
      blockWithCache.cache_control = {
        type: "ephemeral",
        ttl: "5m",
      };
      contentArray[0] = blockWithCache as typeof firstBlock;
    } else {
      // Wrap non-dict content
      contentArray[0] = {
        type: "text",
        text: firstBlock as string,
        cache_control: { type: "ephemeral", ttl: "5m" },
      };
    }

    (lastToolMsgCopy as { content: unknown }).content = contentArray;
    messages[lastToolIdx] = lastToolMsgCopy;
  }
}
