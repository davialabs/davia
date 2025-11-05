import { AIMessage, ToolMessage, BaseMessage } from "langchain";

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
    if (Array.isArray(aiMsg.content)) {
      // Create a deep copy to avoid modifying the original
      const aiMsgCopy = cloneMessage(aiMsg);
      
      for (const block of aiMsgCopy.content) {
        if (typeof block === "object" && block !== null && "cache_control" in block) {
          delete (block as any).cache_control;
        }
      }
      
      messages[idx] = aiMsgCopy;
    }
  }

  // Add cache control only to the last AI message
  const lastAiIdx = aiIndices[aiIndices.length - 1];
  const lastAiMsg = messages[lastAiIdx];

  if (Array.isArray(lastAiMsg.content) && lastAiMsg.content.length > 0) {
    // Ensure we have a copy to modify
    const lastAiMsgCopy = cloneMessage(lastAiMsg);
    const lastBlock = lastAiMsgCopy.content[lastAiMsgCopy.content.length - 1];

    // Add cache control to the last content block
    if (typeof lastBlock === "object" && lastBlock !== null) {
      (lastBlock as any).cache_control = {
        type: "ephemeral",
        ttl: "5m",
      };
    } else {
      // If last block is not a dict, wrap it
      lastAiMsgCopy.content[lastAiMsgCopy.content.length - 1] = {
        type: "text",
        text: lastBlock as string,
        cache_control: { type: "ephemeral", ttl: "5m" },
      };
    }

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
    if (Array.isArray(toolMsg.content)) {
      // Create a copy to avoid modifying the original
      const toolMsgCopy = cloneMessage(toolMsg);
      
      for (const block of toolMsgCopy.content) {
        if (typeof block === "object" && block !== null && "cache_control" in block) {
          delete (block as any).cache_control;
        }
      }
      
      messages[idx] = toolMsgCopy;
    }
  }

  // Add cache control only to the last ToolMessage
  const lastToolIdx = toolIndices[toolIndices.length - 1];
  const lastToolMsg = messages[lastToolIdx];

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
  } else if (Array.isArray(lastToolMsg.content) && lastToolMsg.content.length > 0) {
    // If already a list, add cache control to the first element
    const lastToolMsgCopy = cloneMessage(lastToolMsg);
    const firstBlock = lastToolMsgCopy.content[0];

    if (typeof firstBlock === "object" && firstBlock !== null) {
      (firstBlock as any).cache_control = {
        type: "ephemeral",
        ttl: "5m",
      };
    } else {
      // Wrap non-dict content
      lastToolMsgCopy.content[0] = {
        type: "text",
        text: firstBlock as string,
        cache_control: { type: "ephemeral", ttl: "5m" },
      };
    }

    messages[lastToolIdx] = lastToolMsgCopy;
  }
}

