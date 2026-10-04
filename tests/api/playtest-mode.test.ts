import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const saved = { ...process.env };

// vi.mock is hoisted above plain const declarations, so the shared spy object has
// to be created with vi.hoisted or the factory closes over an undefined binding.
const fakeStore = vi.hoisted(() => ({
  saveAttempt: vi.fn(async () => {}),
  saveGuess: vi.fn(async () => {}),
  countAttempts: vi.fn(async () => 0),
  solvedLevels: vi.fn(async () => [] as number[]),
}));

vi.mock("@/store", () => ({
  getStore: () => fakeStore,
  storeKind: () => "jsonl",
}));

/**
 * Each test resets the module registry so the route re-reads the environment, which
 * means the cookie has to be signed by the same freshly-loaded session module —
 * a signature from an earlier instance verifies against a different secret.
 */
async function cookieFor(id: string) {
  const { signPlayerId } = await import("@/session");
  return { headers: { cookie: `ls_pid=${signPlayerId(id)}` } };
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  process.env = { ...saved };
});
afterEach(() => { process.env = { ...saved }; });

describe("playtest unlock mode", () => {
  it("session reports unlockAll=false by default", async () => {
    delete process.env.PLAYTEST_UNLOCK_ALL;
    const { POST } = await import("@/app/api/session/route");
    const res = await POST(new Request("http://localhost/api/session", { method: "POST" }));
    expect((await res.json()).unlockAll).toBe(false);
  });

  it("session reports unlockAll=true when the env var is set", async () => {
    process.env.PLAYTEST_UNLOCK_ALL = "true";
    const { POST } = await import("@/app/api/session/route");
    const res = await POST(new Request("http://localhost/api/session", { method: "POST" }));
    expect((await res.json()).unlockAll).toBe(true);
  });

  it("a guess in a normal session is logged as progression", async () => {
    delete process.env.PLAYTEST_UNLOCK_ALL;
    const { POST } = await import("@/app/api/guess/route");
    await POST(new Request("http://localhost/api/guess", {
      method: "POST",
      headers: (await cookieFor("p1")).headers,
      body: JSON.stringify({ levelId: 1, guess: "nope" }),
    }));
    expect(fakeStore.saveGuess.mock.calls[0][0]).toMatchObject({ mode: "progression" });
  });

  it("a guess during a playtest session is logged as free, so the two are never pooled", async () => {
    process.env.PLAYTEST_UNLOCK_ALL = "true";
    const { POST } = await import("@/app/api/guess/route");
    await POST(new Request("http://localhost/api/guess", {
      method: "POST",
      headers: (await cookieFor("p1")).headers,
      body: JSON.stringify({ levelId: 8, guess: "nope" }),
    }));
    expect(fakeStore.saveGuess.mock.calls[0][0]).toMatchObject({ mode: "free", levelId: 8 });
  });
});
