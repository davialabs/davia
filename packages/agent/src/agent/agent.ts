import * as z from "zod";
import { createAgent } from "langchain";
import {
  writeTool,
  searchReplaceTool,
  readFileTool,
  deleteTool,
  multiEditTool,
} from "./tools.js";
import { repositoryInitializationMiddleware } from "./middleware.js";

const contextSchema = z.object({
  modelName: z.string(),
  sourcePath: z.string(),
  destinationPath: z.string(),
});

// Create and return the agent with the model and tools
export const createDaviaAgent = (modelName: string) => {
  return createAgent({
    model: modelName,
    tools: [
      writeTool,
      searchReplaceTool,
      readFileTool,
      deleteTool,
      multiEditTool,
    ],
    middleware: [repositoryInitializationMiddleware],
    contextSchema,
  });
};
