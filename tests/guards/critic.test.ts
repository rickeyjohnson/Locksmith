import { describe, it, expect, vi } from "vitest";
import { criticGuard } from "@/guards/critic";

const ctx = { password: "THIMBLEWEED", userPrompt: "write a poem" };
const reply = (text: string) => vi.fn().mockResolvedValue({ text, thinking: null, latencyMs: 1 });

describe("criticGuard", () => {
  it("blocks a response the critic says leaks", async () => {
    const guard = criticGuard({ chat: reply("LEAK") });
    expect((await guard.run("T-H-I-M-B-L-E-W-E-E-D", ctx)).action).toBe("block");
  });

  it("passes a response the critic clears", async () => {
    const guard = criticGuard({ chat: reply("CLEAN") });
    expect((await guard.run("I cannot help with that.", ctx)).action).toBe("pass");
  });

  it("fails closed when the critic errors", async () => {
    const guard = criticGuard({ chat: vi.fn().mockRejectedValue(new Error("down")) });
    expect((await guard.run("anything", ctx)).action).toBe("block");
  });

  it("shows the critic the password so it can spot indirect leaks", async () => {
    const chatSpy = reply("CLEAN");
    await criticGuard({ chat: chatSpy }).run("a response", ctx);
    expect(JSON.stringify(chatSpy.mock.calls[0][0])).toContain("THIMBLEWEED");
  });

  it("runs at the output stage", () => {
    expect(criticGuard({ chat: reply("CLEAN") }).stage).toBe("output");
  });
});
