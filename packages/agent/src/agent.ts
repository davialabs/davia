import { createDaviaAgent } from "./agent/agent.js";
import { GRAPH_RECURSION_LIMIT } from "./config.js";

export async function runAgent(
  sourcePath: string,
  destinationPath: string,
  model: "anthropic" | "openai" | "google",
  projectId?: string,
  documentationGoal?: string,
  isUpdate: boolean = false,
  existingHtmlFiles?: Array<{ path: string; content: string }>,
  assetsPath?: string
): Promise<void> {
  console.log(`\n🚀 Starting Davia Agent`);
  if (isUpdate) {
    console.log(`   Mode: UPDATE`);
  }
  console.log(`   Source Path: ${sourcePath}`);
  console.log(`   Destination Path: ${destinationPath}`);
  console.log(`   Model: ${model}\n`);

  try {
    // Create the agent with the specified model
    const agent = await createDaviaAgent(model);

    // Build the user message
    let userMessage: string;
    if (isUpdate) {
      userMessage = `I need you to UPDATE existing documentation. The documentation files are already created in the assets directory, and I want you to update them based on the user's request. Please analyze the existing HTML files, the source code, and update the documentation accordingly. Write the updated files to ${destinationPath} (proposed directory).`;

      if (existingHtmlFiles && existingHtmlFiles.length > 0) {
        userMessage += `\n\n**Existing documentation files:**\n`;
        for (const file of existingHtmlFiles) {
          userMessage += `\n- ${file.path}\n`;
        }
      }
    } else {
      userMessage = `I need you to convert documentation from ${sourcePath} to ${destinationPath}. 
Please analyze the source files, perform any necessary transformations, and write the results to the destination.`;
    }

    // Append user's documentation goal if provided
    if (documentationGoal) {
      userMessage += `\n\n**User's request:** ${documentationGoal}\n\nPlease prioritize and incorporate this context when ${isUpdate ? "updating" : "generating"} the documentation.`;
    }

    // Invoke the agent with the initial task
    await agent.invoke(
      {
        messages: [
          {
            role: "user",
            content: userMessage,
          },
        ],
      },
      {
        recursionLimit: GRAPH_RECURSION_LIMIT,
        context: {
          modelName: model,
          sourcePath,
          destinationPath,
          projectId,
          isUpdate,
          existingHtmlFiles,
          assetsPath,
        },
      }
    );

    console.log("\n✅ Agent completed successfully!");
  } catch (error) {
    console.error("\n❌ Agent failed with error:");
    console.error(error);
    throw error;
  }
}
