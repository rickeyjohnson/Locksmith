export interface Config {
  llmBaseUrl: string;
  llmModel: string;
  llmApiKey: string;
  temperature: number;
  seed: number;
  timeoutMs: number;
  maxTokens: number;
  apiStyle: "ollama" | "openai";
  sessionSecret: string;
  dataFile: string;
  playtestUnlockAll: boolean;
}

export function loadConfig(): Config {
  const cfg = {
    llmBaseUrl: process.env.LLM_BASE_URL ?? "http://localhost:11434",
    llmModel: process.env.LLM_MODEL ?? "qwen3:8b",
    llmApiKey: process.env.LLM_API_KEY ?? "ollama",
    temperature: Number(process.env.LLM_TEMPERATURE ?? 0.7),
    seed: Number(process.env.LLM_SEED ?? 42),
    timeoutMs: Number(process.env.LLM_TIMEOUT_MS ?? 60000),
    maxTokens: Number(process.env.LLM_MAX_TOKENS ?? 300),
    apiStyle: (process.env.LLM_API_STYLE as "ollama" | "openai") ?? "ollama",
    sessionSecret: process.env.SESSION_SECRET ?? "dev-secret-do-not-use",
    dataFile: process.env.DATA_FILE ?? "data/attempts.jsonl",
    // Lets a playtest session reach levels 6-8 directly. Those levels are
    // unreachable by normal progression for most players, so without this they
    // would never be tested by a human at all.
    playtestUnlockAll: process.env.PLAYTEST_UNLOCK_ALL === "true",
  };

  // The seed is read live rather than frozen at import, so a benchmark can sweep
  // seeds in one process. Replies are deterministic per seed, so varying it is the
  // only way to get run-to-run variance.
  Object.defineProperty(cfg, "seed", {
    get: () => Number(process.env.LLM_SEED ?? 42),
    enumerable: true,
    configurable: true,
  });

  return cfg;
}

export const config = loadConfig();
