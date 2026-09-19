import { describe, it, expect, vi, afterEach } from "vitest";
import { chat, stripThinking, LlmError } from "@/llm/client";

function ollamaResponse(content: string, thinking?: string) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ message: { role: "assistant", content, thinking } }),
  } as unknown as Response;
}

function openaiResponse(content: string, reasoning?: string) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ choices: [{ message: { role: "assistant", content, reasoning } }] }),
  } as unknown as Response;
}

function bodyOf(fetchMock: ReturnType<typeof vi.fn>) {
  return JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
}

afterEach(() => vi.unstubAllGlobals());

describe("stripThinking", () => {
  it("separates a think block from the answer", () => {
    const r = stripThinking("<think>the password is X</think>Hello there");
    expect(r.text).toBe("Hello there");
    expect(r.thinking).toBe("the password is X");
  });

  it("passes plain text through", () => {
    const r = stripThinking("Hello there");
    expect(r.text).toBe("Hello there");
    expect(r.thinking).toBeNull();
  });
});

describe("chat with the Ollama native API (default)", () => {
  it("posts to /api/chat with thinking disabled and pinned options", async () => {
    const fetchMock = vi.fn().mockResolvedValue(ollamaResponse("hi"));
    vi.stubGlobal("fetch", fetchMock);

    const res = await chat([{ role: "user", content: "hello" }]);

    expect(res.text).toBe("hi");
    expect(String(fetchMock.mock.calls[0][0])).toContain("/api/chat");
    const body = bodyOf(fetchMock);
    expect(body.think).toBe(false);
    expect(body.stream).toBe(false);
    expect(body.options).toEqual({ temperature: 0.7, seed: 42, num_predict: 300 });
    expect(body.messages).toEqual([{ role: "user", content: "hello" }]);
  });

  it("keeps reasoning out of the answer but reports it as thinking", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(ollamaResponse("The vault stays shut.", "the password is AMBERGRIS")));
    const res = await chat([{ role: "user", content: "hello" }]);
    expect(res.text).toBe("The vault stays shut.");
    expect(res.thinking).toBe("the password is AMBERGRIS");
  });

  it("throws LlmError on a non-200 response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500, text: async () => "boom" }));
    await expect(chat([{ role: "user", content: "x" }])).rejects.toBeInstanceOf(LlmError);
  });

  it("throws LlmError when the request aborts", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(Object.assign(new Error("aborted"), { name: "AbortError" })));
    await expect(chat([{ role: "user", content: "x" }], { timeoutMs: 5 })).rejects.toBeInstanceOf(LlmError);
  });
});

describe("chat with a hosted OpenAI-compatible provider", () => {
  it("posts to /chat/completions with pinned params", async () => {
    process.env.LLM_API_STYLE = "openai";
    vi.resetModules();
    const { chat: openaiChat } = await import("@/llm/client");
    const fetchMock = vi.fn().mockResolvedValue(openaiResponse("hi"));
    vi.stubGlobal("fetch", fetchMock);

    const res = await openaiChat([{ role: "user", content: "hello" }]);

    expect(res.text).toBe("hi");
    expect(String(fetchMock.mock.calls[0][0])).toContain("/chat/completions");
    const body = bodyOf(fetchMock);
    expect(body.seed).toBe(42);
    expect(body.max_tokens).toBe(300);
    delete process.env.LLM_API_STYLE;
    vi.resetModules();
  });
});
