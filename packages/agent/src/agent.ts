export async function runAgent(
  sourcePath: string,
  destinationPath: string,
  model: "anthropic" | "openai" | "google"
): Promise<void> {
  console.log(sourcePath, destinationPath, model);
  console.log("Running agent...");
  await new Promise((resolve) => setTimeout(resolve, 10000));
  console.log("Agent completed");
  // TODO: Implement agent logic
}
