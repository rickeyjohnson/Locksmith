import { describe, it, expect, beforeEach, afterEach } from "vitest";

describe("config", () => {
  const saved = { ...process.env };
  beforeEach(() => { process.env = { ...saved }; });
  afterEach(() => { process.env = { ...saved }; });

  it("reads values from the environment", async () => {
    process.env.LLM_MODEL = "test-model";
    process.env.LLM_SEED = "7";
    const { loadConfig } = await import("@/config");
    const cfg = loadConfig();
    expect(cfg.llmModel).toBe("test-model");
    expect(cfg.seed).toBe(7);
  });

  it("falls back to defaults", async () => {
    delete process.env.LLM_MODEL;
    const { loadConfig } = await import("@/config");
    expect(loadConfig().llmModel).toBe("qwen3:8b");
  });
});
