import { createAgent, initChatModel, todoListMiddleware } from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import {
  writeTool,
  searchReplaceTool,
  readFileTool,
  deleteTool,
  multiEditTool,
} from "./tools.js";
import { repositoryInitializationMiddleware } from "./middlewares/initialization.js";
import { afterModelCachingMiddleware } from "./middlewares/after-model.js";
import { contextSchema } from "./context.js";

// Create and return the agent with the model and tools
export const createDaviaAgent = async (modelName: string) => {
  // Select the appropriate model based on the provider
  let model;
  switch (modelName) {
    case "anthropic":
      model = await initChatModel("claude-sonnet-4-5");
      break;
    case "openai":
      model = await initChatModel("openai:gpt-5");
      break;
    case "google":
      model = await initChatModel("google-genai:gemini-3-pro-preview");
      break;
    case "minimax":
      model = new ChatOpenAI({
        model: "MiniMax-M2.7",
        configuration: {
          baseURL: "https://api.minimax.io/v1",
        },
        apiKey: process.env.MINIMAX_API_KEY,
        temperature: 0.7,
      });
      break;
    default:
      throw new Error(`Unsupported model provider: ${modelName}`);
  }

  return createAgent({
    model,
    tools: [
      writeTool,
      searchReplaceTool,
      readFileTool,
      deleteTool,
      multiEditTool,
    ],
    middleware: [
      repositoryInitializationMiddleware,
      todoListMiddleware,
      afterModelCachingMiddleware,
    ],
    contextSchema,
  });
};
