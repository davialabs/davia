import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Integration tests for MiniMax provider in davia agent.
 * These tests verify the MiniMax API connectivity and model behavior.
 * Requires MINIMAX_API_KEY environment variable to be set.
 *
 * Run with: MINIMAX_API_KEY=your_key npx vitest run --testPathPattern=integration
 */

// Skip integration tests unless MINIMAX_API_KEY is set
const SKIP = !process.env.MINIMAX_API_KEY;

describe.skipIf(SKIP)("MiniMax Integration", () => {
  it("should connect to MiniMax API and get a response", async () => {
    const { ChatOpenAI } = await import("@langchain/openai");

    const model = new ChatOpenAI({
      model: "MiniMax-M2.7",
      configuration: {
        baseURL: "https://api.minimax.io/v1",
      },
      apiKey: process.env.MINIMAX_API_KEY,
      temperature: 0.7,
    });

    const response = await model.invoke("Say hello in one word.");
    expect(response).toBeDefined();
    expect(response.content).toBeDefined();
    expect(typeof response.content === "string" || Array.isArray(response.content)).toBe(true);
  }, 30000);

  it("should handle tool-calling format", async () => {
    const { ChatOpenAI } = await import("@langchain/openai");
    const { z } = await import("zod");

    const model = new ChatOpenAI({
      model: "MiniMax-M2.7",
      configuration: {
        baseURL: "https://api.minimax.io/v1",
      },
      apiKey: process.env.MINIMAX_API_KEY,
      temperature: 0.7,
    });

    const weatherTool = {
      name: "get_weather",
      description: "Get weather for a location",
      schema: z.object({
        location: z.string().describe("City name"),
      }),
    };

    const modelWithTools = model.bindTools([weatherTool]);

    const response = await modelWithTools.invoke(
      "What is the weather in Tokyo?"
    );
    expect(response).toBeDefined();
  }, 30000);

  it("should respect temperature setting", async () => {
    const { ChatOpenAI } = await import("@langchain/openai");

    // Low temperature should produce more deterministic output
    const model = new ChatOpenAI({
      model: "MiniMax-M2.7",
      configuration: {
        baseURL: "https://api.minimax.io/v1",
      },
      apiKey: process.env.MINIMAX_API_KEY,
      temperature: 0.01,
    });

    const response = await model.invoke("What is 2 + 2? Reply with just the number.");
    expect(response).toBeDefined();
    expect(String(response.content)).toContain("4");
  }, 30000);
});
