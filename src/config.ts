export interface Config {
  llmBaseUrl: string;
  llmModel: string;
  llmApiKey: string;
  temperature: number;
  seed: number;
  timeoutMs: number;
  sessionSecret: string;
  dataFile: string;
}

export function loadConfig(): Config {
  return {
    llmBaseUrl: process.env.LLM_BASE_URL ?? "http://localhost:11434/v1",
    llmModel: process.env.LLM_MODEL ?? "qwen3:8b",
    llmApiKey: process.env.LLM_API_KEY ?? "ollama",
    temperature: Number(process.env.LLM_TEMPERATURE ?? 0.7),
    seed: Number(process.env.LLM_SEED ?? 42),
    timeoutMs: Number(process.env.LLM_TIMEOUT_MS ?? 30000),
    sessionSecret: process.env.SESSION_SECRET ?? "dev-secret-do-not-use",
    dataFile: process.env.DATA_FILE ?? "data/attempts.jsonl",
  };
}

export const config = loadConfig();
