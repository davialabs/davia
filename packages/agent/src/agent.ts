import { createDaviaAgent } from "./agent/agent.js";
import { GRAPH_RECURSION_LIMIT } from "./config.js";

export async function runAgent(
  sourcePath: string,
  destinationPath: string,
  model: "anthropic" | "openai"
): Promise<void> {
  console.log(`\n🚀 Starting Davia Agent`);
  console.log(`   Source Path: ${sourcePath}`);
  console.log(`   Destination Path: ${destinationPath}`);
  console.log(`   Model: ${model}\n`);

  try {
    // Create the agent with the specified model
    const agent = createDaviaAgent(model);

    // Invoke the agent with the initial task
    const response = await agent.invoke(
      {
        messages: [
          {
            role: "user",
            content: `I need you to convert documentation from ${sourcePath} to ${destinationPath}. 
Please analyze the source files, perform any necessary transformations, and write the results to the destination.`,
          },
        ],
      },
      {
        recursionLimit: GRAPH_RECURSION_LIMIT,
        context: {
          modelName: model,
          sourcePath,
          destinationPath,
        },
      }
    );

    console.log("\n✅ Agent completed successfully!");
    console.log("\n📋 Response:");
    console.log(JSON.stringify(response, null, 2));
  } catch (error) {
    console.error("\n❌ Agent failed with error:");
    console.error(error);
    throw error;
  }
}
