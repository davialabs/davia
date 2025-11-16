import { createDaviaAgent } from "./agent/agent.js";
import { GRAPH_RECURSION_LIMIT } from "./config.js";

export async function runAgent(
  sourcePath: string,
  destinationPath: string,
  model: "anthropic" | "openai" | "google",
  projectId?: string,
  documentationGoal?: string
): Promise<void> {
  console.log(`\n🚀 Starting Davia Agent`);
  console.log(`   Source Path: ${sourcePath}`);
  console.log(`   Destination Path: ${destinationPath}`);
  console.log(`   Model: ${model}\n`);

  try {
    // Create the agent with the specified model
    const agent = await createDaviaAgent(model);

    // Build the user message
    let userMessage = `Please analyze the source files, perform any necessary transformations, and write the results following the guidelines.`;

    // Append user's documentation goal if provided
    if (documentationGoal) {
      userMessage += `\n\n**User's documentation goal:** ${documentationGoal}\n\nPlease prioritize and incorporate this context when generating the documentation.`;
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
