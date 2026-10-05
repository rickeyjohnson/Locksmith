import { describe, it, expect, vi, beforeEach } from "vitest";
import { resilientStore } from "@/store/resilient";
import type { AttemptRecord, GuessRecord, Store } from "@/store/types";

const attempt: AttemptRecord = {
  id: "a1", playerId: "p1", levelId: 1, attemptNo: 1, prompt: "hi",
  rawModelResponse: null, shownResponse: "x", status: "ok", blockedBy: null,
  guardTrace: [], leaked: false, rawLeaked: false, latencyMs: 1, model: "m",
  configHash: "h", mode: "progression", createdAt: "2026-10-04T00:00:00.000Z",
};

const guess: GuessRecord = {
  id: "g1", playerId: "p1", levelId: 1, guess: "x", correct: false,
  attemptsBefore: 0, mode: "progression", createdAt: "2026-10-04T00:00:00.000Z",
};

function makeStore(overrides: Partial<Store> = {}): Store {
  return {
    saveAttempt: vi.fn(async () => {}),
    saveGuess: vi.fn(async () => {}),
    countAttempts: vi.fn(async () => 7),
    solvedLevels: vi.fn(async () => [1, 2]),
    ...overrides,
  };
}

const down = () => {
  throw new Error("TypeError: fetch failed");
};

beforeEach(() => vi.clearAllMocks());

describe("resilientStore", () => {
  it("uses the primary store while it works", async () => {
    const primary = makeStore();
    const fallback = makeStore();
    const store = resilientStore(primary, fallback);

    expect(await store.solvedLevels("p1")).toEqual([1, 2]);
    await store.saveAttempt(attempt);

    expect(primary.saveAttempt).toHaveBeenCalled();
    expect(fallback.saveAttempt).not.toHaveBeenCalled();
  });

  it("falls back on a read failure instead of throwing — play must not break", async () => {
    const primary = makeStore({ solvedLevels: vi.fn(down) });
    const fallback = makeStore({ solvedLevels: vi.fn(async () => [3]) });
    const store = resilientStore(primary, fallback);

    expect(await store.solvedLevels("p1")).toEqual([3]);
    expect(fallback.solvedLevels).toHaveBeenCalledWith("p1");
  });

  it("falls back on a write failure so the attempt is still recorded", async () => {
    const primary = makeStore({ saveAttempt: vi.fn(down) });
    const fallback = makeStore();
    const store = resilientStore(primary, fallback);

    await store.saveAttempt(attempt);
    expect(fallback.saveAttempt).toHaveBeenCalledWith(attempt);
  });

  it("stops retrying the primary once it has failed, so every call is not slowed by a timeout", async () => {
    const primary = makeStore({ saveGuess: vi.fn(down), saveAttempt: vi.fn(async () => {}) });
    const fallback = makeStore();
    const store = resilientStore(primary, fallback);

    await store.saveGuess(guess);
    await store.saveAttempt(attempt);

    expect(primary.saveAttempt).not.toHaveBeenCalled();
    expect(fallback.saveAttempt).toHaveBeenCalled();
  });

  it("reports whether it is degraded, so the state is visible rather than silent", async () => {
    const primary = makeStore({ countAttempts: vi.fn(down) });
    const store = resilientStore(primary, makeStore());

    expect(store.isDegraded()).toBe(false);
    await store.countAttempts("p1", 1);
    expect(store.isDegraded()).toBe(true);
  });

  it("throws if the fallback fails too — losing data silently would be worse", async () => {
    const primary = makeStore({ saveAttempt: vi.fn(down) });
    const fallback = makeStore({ saveAttempt: vi.fn(() => { throw new Error("disk full"); }) });
    const store = resilientStore(primary, fallback);

    await expect(store.saveAttempt(attempt)).rejects.toThrow(/disk full/);
  });
});
