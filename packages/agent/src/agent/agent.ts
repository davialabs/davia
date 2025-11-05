import * as z from "zod";
import { createAgent } from "langchain";
import {
  writeTool,
  searchReplaceTool,
  readFileTool,
  deleteTool,
  multiEditTool,
} from "./tools.js";
import { repositoryInitializationMiddleware } from "./middlewares/initialization.js";
import { afterModelCachingMiddleware } from "./middlewares/after-model.js";

const contextSchema = z.object({
  modelName: z.string(),
  sourcePath: z.string(),
  destinationPath: z.string(),
});

// Create and return the agent with the model and tools
export const createDaviaAgent = (modelName: string) => {
  // Select the appropriate model based on the provider
  let model: string;
  switch (modelName) {
    case "anthropic":
      model = "claude-sonnet-4-5";
      break;
    case "openai":
      model = "gpt-5";
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
      afterModelCachingMiddleware,
    ],
    contextSchema,
  });
};
