import { config } from "@/config";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };
export type ChatResult = { text: string; thinking: string | null; latencyMs: number };

export class LlmError extends Error {}

/**
 * Qwen3-style models emit reasoning before their answer. Ollama's native API
 * suppresses it with `think: false`; the OpenAI-compatible endpoint does not,
 * and returns it either inline in <think> tags or in a `reasoning` field.
 * Either way it never reaches the player, but it is leak-checked and logged.
 */
export function stripThinking(raw: string): { text: string; thinking: string | null } {
  const match = raw.match(/<think>([\s\S]*?)<\/think>/i);
  if (!match) return { text: raw.trim(), thinking: null };
  return { text: raw.replace(match[0], "").trim(), thinking: match[1].trim() };
}

function ollamaRequest(messages: ChatMessage[]) {
  return {
    url: `${config.llmBaseUrl}/api/chat`,
    body: {
      model: config.llmModel,
      messages,
      stream: false,
      think: false,
      options: {
        temperature: config.temperature,
        seed: config.seed,
        num_predict: config.maxTokens,
      },
    },
  };
}

function openaiRequest(messages: ChatMessage[]) {
  return {
    url: `${config.llmBaseUrl}/chat/completions`,
    body: {
      model: config.llmModel,
      messages,
      temperature: config.temperature,
      seed: config.seed,
      max_tokens: config.maxTokens,
      stream: false,
    },
  };
}

export async function chat(
  messages: ChatMessage[],
  opts: { timeoutMs?: number } = {},
): Promise<ChatResult> {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? config.timeoutMs);
  const isOllama = config.apiStyle === "ollama";
  const { url, body } = isOllama ? ollamaRequest(messages) : openaiRequest(messages);

  try {
    const res = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.llmApiKey}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new LlmError(`LLM responded ${res.status}: ${await res.text()}`);

    const data = await res.json();
    const message = isOllama ? data?.message : data?.choices?.[0]?.message;
    const { text, thinking } = stripThinking(String(message?.content ?? ""));
    const reasoning = message?.thinking ?? message?.reasoning ?? null;

    return {
      text,
      thinking: thinking ?? (reasoning ? String(reasoning) : null),
      latencyMs: Date.now() - started,
    };
  } catch (err) {
    if (err instanceof LlmError) throw err;
    throw new LlmError(`LLM request failed: ${(err as Error).message}`);
  } finally {
    clearTimeout(timer);
  }
}
