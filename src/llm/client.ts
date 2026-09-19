import { config } from "@/config";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };
export type ChatResult = { text: string; thinking: string | null; latencyMs: number };

export class LlmError extends Error {}

export function stripThinking(raw: string): { text: string; thinking: string | null } {
  const match = raw.match(/<think>([\s\S]*?)<\/think>/i);
  if (!match) return { text: raw.trim(), thinking: null };
  return { text: raw.replace(match[0], "").trim(), thinking: match[1].trim() };
}

export async function chat(
  messages: ChatMessage[],
  opts: { timeoutMs?: number } = {},
): Promise<ChatResult> {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? config.timeoutMs);
  try {
    const res = await fetch(`${config.llmBaseUrl}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.llmApiKey}`,
      },
      body: JSON.stringify({
        model: config.llmModel,
        messages,
        temperature: config.temperature,
        seed: config.seed,
        stream: false,
        think: false,
        chat_template_kwargs: { enable_thinking: false },
      }),
    });
    if (!res.ok) throw new LlmError(`LLM responded ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content ?? "";
    const { text, thinking } = stripThinking(String(raw));
    return { text, thinking, latencyMs: Date.now() - started };
  } catch (err) {
    if (err instanceof LlmError) throw err;
    throw new LlmError(`LLM request failed: ${(err as Error).message}`);
  } finally {
    clearTimeout(timer);
  }
}
