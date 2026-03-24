import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock langchain before importing agent
vi.mock("langchain", () => ({
  createAgent: vi.fn().mockReturnValue({ invoke: vi.fn() }),
  initChatModel: vi.fn().mockResolvedValue({
    invoke: vi.fn(),
    bind: vi.fn(),
  }),
  todoListMiddleware: vi.fn(),
}));

vi.mock("@langchain/openai", () => {
  const ChatOpenAI = vi.fn().mockImplementation(function (
    this: Record<string, unknown>,
    config: Record<string, unknown>
  ) {
    this.invoke = vi.fn();
    this.bind = vi.fn();
    this._config = config;
  });
  return { ChatOpenAI };
});

vi.mock("../tools.js", () => ({
  writeTool: { name: "write" },
  searchReplaceTool: { name: "searchReplace" },
  readFileTool: { name: "readFile" },
  deleteTool: { name: "delete" },
  multiEditTool: { name: "multiEdit" },
}));

vi.mock("../middlewares/initialization.js", () => ({
  repositoryInitializationMiddleware: vi.fn(),
}));

vi.mock("../middlewares/after-model.js", () => ({
  afterModelCachingMiddleware: vi.fn(),
}));

vi.mock("../context.js", () => ({
  contextSchema: {},
}));

import { createDaviaAgent } from "../agent.js";
import { initChatModel } from "langchain";
import { ChatOpenAI } from "@langchain/openai";

describe("createDaviaAgent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.MINIMAX_API_KEY;
  });

  it("should create an agent with anthropic provider", async () => {
    await createDaviaAgent("anthropic");
    expect(initChatModel).toHaveBeenCalledWith("claude-sonnet-4-5");
  });

  it("should create an agent with openai provider", async () => {
    await createDaviaAgent("openai");
    expect(initChatModel).toHaveBeenCalledWith("openai:gpt-5");
  });

  it("should create an agent with google provider", async () => {
    await createDaviaAgent("google");
    expect(initChatModel).toHaveBeenCalledWith("google-genai:gemini-3-pro-preview");
  });

  it("should create an agent with minimax provider", async () => {
    process.env.MINIMAX_API_KEY = "test-minimax-key";
    await createDaviaAgent("minimax");

    expect(ChatOpenAI).toHaveBeenCalledWith({
      model: "MiniMax-M2.7",
      configuration: {
        baseURL: "https://api.minimax.io/v1",
      },
      apiKey: "test-minimax-key",
      temperature: 0.7,
    });
    // initChatModel should NOT be called for minimax
    expect(initChatModel).not.toHaveBeenCalled();
  });

  it("should use MINIMAX_API_KEY from environment", async () => {
    process.env.MINIMAX_API_KEY = "my-secret-key";
    await createDaviaAgent("minimax");

    expect(ChatOpenAI).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: "my-secret-key",
      })
    );
  });

  it("should configure MiniMax with correct base URL", async () => {
    process.env.MINIMAX_API_KEY = "test-key";
    await createDaviaAgent("minimax");

    expect(ChatOpenAI).toHaveBeenCalledWith(
      expect.objectContaining({
        configuration: {
          baseURL: "https://api.minimax.io/v1",
        },
      })
    );
  });

  it("should use MiniMax-M2.7 model", async () => {
    process.env.MINIMAX_API_KEY = "test-key";
    await createDaviaAgent("minimax");

    expect(ChatOpenAI).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "MiniMax-M2.7",
      })
    );
  });

  it("should set temperature to 0.7 for minimax", async () => {
    process.env.MINIMAX_API_KEY = "test-key";
    await createDaviaAgent("minimax");

    expect(ChatOpenAI).toHaveBeenCalledWith(
      expect.objectContaining({
        temperature: 0.7,
      })
    );
  });

  it("should throw error for unsupported provider", async () => {
    await expect(createDaviaAgent("unsupported")).rejects.toThrow(
      "Unsupported model provider: unsupported"
    );
  });

  it("should not call initChatModel for minimax provider", async () => {
    process.env.MINIMAX_API_KEY = "test-key";
    await createDaviaAgent("minimax");
    expect(initChatModel).not.toHaveBeenCalled();
  });

  it("should call initChatModel for non-minimax providers", async () => {
    await createDaviaAgent("anthropic");
    expect(initChatModel).toHaveBeenCalledTimes(1);
    expect(ChatOpenAI).not.toHaveBeenCalled();
  });
});
