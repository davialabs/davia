import { createMiddleware } from "langchain";
import {
  handleAIMessageCaching,
  handleToolMessageCaching,
} from "../helpers/messages-caching-handler.js";

/**
 * Middleware that applies caching to AI and Tool messages after the model runs
 * Ensures only the last AI message and last Tool message have cache control
 */
export const afterModelCachingMiddleware = createMiddleware({
  name: "AfterModelCaching",
  afterModel: async (state, runtime) => {
    // Get messages from state
    const messages = state.messages || [];

    // Handle AI message caching
    handleAIMessageCaching(messages);

    // Handle tool message caching
    handleToolMessageCaching(messages);

    // Return updated state with modified messages
    return { messages };
  },
});

