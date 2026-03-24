import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { existsSync, readFileSync } from "fs";
import { checkAndSetAiEnv } from "../ai.js";

vi.mock("fs", () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
}));

vi.mock("fs-extra", () => ({
  default: { writeFile: vi.fn() },
}));

vi.mock("chalk", () => ({
  default: {
    dim: (s: string) => s,
    bold: (s: string) => s,
  },
}));

vi.mock("dotenv", async () => {
  return {
    parse: (content: string) => {
      const result: Record<string, string> = {};
      for (const line of content.split("\n")) {
        const [key, ...rest] = line.split("=");
        if (key && rest.length > 0) {
          result[key.trim()] = rest.join("=").trim();
        }
      }
      return result;
    },
  };
});

describe("checkAndSetAiEnv", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    // Clear relevant env vars
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.GOOGLE_API_KEY;
    delete process.env.MINIMAX_API_KEY;
    // Suppress console.log in tests
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it("should return null when no .env files exist", () => {
    vi.mocked(existsSync).mockReturnValue(false);
    const result = checkAndSetAiEnv("/test/project");
    expect(result).toBeNull();
  });

  it("should detect ANTHROPIC_API_KEY first (highest priority)", () => {
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readFileSync).mockReturnValue(
      "ANTHROPIC_API_KEY=sk-ant-test\nOPENAI_API_KEY=sk-openai-test"
    );

    const result = checkAndSetAiEnv("/test/project");
    expect(result).toBe("anthropic");
    expect(process.env.ANTHROPIC_API_KEY).toBe("sk-ant-test");
  });

  it("should detect OPENAI_API_KEY when no Anthropic key", () => {
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readFileSync).mockReturnValue("OPENAI_API_KEY=sk-openai-test");

    const result = checkAndSetAiEnv("/test/project");
    expect(result).toBe("openai");
    expect(process.env.OPENAI_API_KEY).toBe("sk-openai-test");
  });

  it("should detect GOOGLE_API_KEY when no OpenAI or Anthropic key", () => {
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readFileSync).mockReturnValue("GOOGLE_API_KEY=google-test-key");

    const result = checkAndSetAiEnv("/test/project");
    expect(result).toBe("google");
    expect(process.env.GOOGLE_API_KEY).toBe("google-test-key");
  });

  it("should detect MINIMAX_API_KEY", () => {
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readFileSync).mockReturnValue("MINIMAX_API_KEY=minimax-test-key");

    const result = checkAndSetAiEnv("/test/project");
    expect(result).toBe("minimax");
    expect(process.env.MINIMAX_API_KEY).toBe("minimax-test-key");
  });

  it("should prioritize Anthropic over MiniMax", () => {
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readFileSync).mockReturnValue(
      "MINIMAX_API_KEY=minimax-key\nANTHROPIC_API_KEY=ant-key"
    );

    const result = checkAndSetAiEnv("/test/project");
    expect(result).toBe("anthropic");
  });

  it("should prioritize OpenAI over MiniMax", () => {
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readFileSync).mockReturnValue(
      "MINIMAX_API_KEY=minimax-key\nOPENAI_API_KEY=openai-key"
    );

    const result = checkAndSetAiEnv("/test/project");
    expect(result).toBe("openai");
  });

  it("should prioritize Google over MiniMax", () => {
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readFileSync).mockReturnValue(
      "MINIMAX_API_KEY=minimax-key\nGOOGLE_API_KEY=google-key"
    );

    const result = checkAndSetAiEnv("/test/project");
    expect(result).toBe("google");
  });

  it("should check .davia/.env before project .env", () => {
    let callCount = 0;
    vi.mocked(existsSync).mockImplementation(() => {
      callCount++;
      // Only .davia/.env exists (first call)
      return callCount === 1;
    });
    vi.mocked(readFileSync).mockReturnValue("MINIMAX_API_KEY=from-davia-env");

    const result = checkAndSetAiEnv("/test/project");
    expect(result).toBe("minimax");
    expect(process.env.MINIMAX_API_KEY).toBe("from-davia-env");
  });

  it("should fall back to project .env when .davia/.env has no keys", () => {
    vi.mocked(existsSync).mockImplementation((p) => {
      return String(p).includes(".env");
    });
    let callCount = 0;
    vi.mocked(readFileSync).mockImplementation(() => {
      callCount++;
      if (callCount === 1) return "# empty davia env";
      return "MINIMAX_API_KEY=from-project-env";
    });

    const result = checkAndSetAiEnv("/test/project");
    expect(result).toBe("minimax");
    expect(process.env.MINIMAX_API_KEY).toBe("from-project-env");
  });

  it("should ignore empty API key values", () => {
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readFileSync).mockReturnValue("MINIMAX_API_KEY=   ");

    const result = checkAndSetAiEnv("/test/project");
    expect(result).toBeNull();
  });

  it("should set MINIMAX_API_KEY in process.env", () => {
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readFileSync).mockReturnValue("MINIMAX_API_KEY=my-minimax-key-123");

    checkAndSetAiEnv("/test/project");
    expect(process.env.MINIMAX_API_KEY).toBe("my-minimax-key-123");
  });
});
