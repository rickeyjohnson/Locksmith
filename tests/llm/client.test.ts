import { describe, it, expect, vi, afterEach } from "vitest";
import { chat, stripThinking, LlmError } from "@/llm/client";

function mockResponse(content: string) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ choices: [{ message: { content } }] }),
  } as unknown as Response;
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

describe("chat", () => {
  it("posts messages and returns the assistant text", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse("hi"));
    vi.stubGlobal("fetch", fetchMock);

    const res = await chat([{ role: "user", content: "hello" }]);

    expect(res.text).toBe("hi");
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/chat/completions");
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.messages).toEqual([{ role: "user", content: "hello" }]);
    expect(body.seed).toBe(42);
    expect(body.stream).toBe(false);
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
