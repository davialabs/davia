import * as z from "zod";

export const contextSchema = z.object({
  projectId: z.string(),
  projectPath: z.string(),
  isUpdate: z.boolean(),
  modelName: z.string(),
});

export type ContextType = z.infer<typeof contextSchema>;
