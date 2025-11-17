import { createDaviaAgent } from "./agent/agent.js";
import { GRAPH_RECURSION_LIMIT } from "./config.js";
import chalk from "chalk";

export async function runAgent(
  sourcePath: string,
  daviaPath: string,
  projectId: string,
  model: "anthropic" | "openai" | "google",
  isUpdate: boolean,
  additionalInstructions?: string
): Promise<void> {
  console.log(chalk.blue.bold("\n🚀 Starting Davia Agent"));
  console.log(chalk.dim(`   Source Path: ${sourcePath}`));
  console.log(chalk.dim(`   Davia Path: ${daviaPath}`));
  console.log(chalk.dim(`   Project ID: ${projectId}`));
  console.log(chalk.dim(`   Model: ${chalk.bold(model)}`));
  console.log(
    chalk.dim(`   Mode: ${chalk.bold(isUpdate ? "update-docs" : "docs")}\n`)
  );

  try {
    // Create the agent with the specified model
    const agent = await createDaviaAgent(model);

    // Build the user message
    let userMessage = `Please analyze the source files, perform any necessary transformations, and write the results following the guidelines.`;

    // Append user's documentation goal if provided
    if (additionalInstructions) {
      const goalPrefix = isUpdate
        ? "User's documentation update goal:"
        : "User's documentation goal:";
      userMessage += `\n\n**${goalPrefix}** ${additionalInstructions}\n\nPlease prioritize and incorporate this context when generating the documentation.`;
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
          daviaPath,
          projectId,
          isUpdate,
        },
      }
    );

    console.log(chalk.green.bold("\n✅ Agent completed successfully!"));
  } catch (error) {
    console.error(chalk.red.bold("\n❌ Agent failed with error:"));
    console.error(
      chalk.red(error instanceof Error ? error.message : String(error))
    );
    throw error;
  }
}
