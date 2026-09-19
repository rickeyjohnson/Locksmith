import { describe, it, expect, beforeEach } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { jsonlStore } from "@/store/jsonl";
import { signPlayerId, verifyPlayerId } from "@/session";

describe("session cookie", () => {
  it("round-trips a signed player id", () => {
    const signed = signPlayerId("abc-123");
    expect(verifyPlayerId(signed)).toBe("abc-123");
  });

  it("rejects a tampered cookie", () => {
    const signed = signPlayerId("abc-123");
    expect(verifyPlayerId(signed.replace("abc-123", "evil-1"))).toBeNull();
  });

  it("rejects nonsense", () => {
    expect(verifyPlayerId("garbage")).toBeNull();
  });
});

describe("jsonlStore", () => {
  let store: ReturnType<typeof jsonlStore>;

  beforeEach(() => {
    const dir = mkdtempSync(path.join(tmpdir(), "locksmith-"));
    store = jsonlStore(path.join(dir, "attempts.jsonl"));
  });

  it("counts attempts per player and level", async () => {
    await store.saveAttempt({
      id: "1", playerId: "p1", levelId: 1, attemptNo: 1, prompt: "a",
      rawModelResponse: null, shownResponse: "x", status: "ok", blockedBy: null,
      guardTrace: [], leaked: false, rawLeaked: false, latencyMs: 1, model: "m",
      configHash: "h", createdAt: new Date().toISOString(),
    });
    expect(await store.countAttempts("p1", 1)).toBe(1);
    expect(await store.countAttempts("p1", 2)).toBe(0);
    expect(await store.countAttempts("p2", 1)).toBe(0);
  });

  it("lists solved levels from correct guesses only", async () => {
    await store.saveGuess({
      id: "g1", playerId: "p1", levelId: 1, guess: "wrong", correct: false,
      attemptsBefore: 1, createdAt: new Date().toISOString(),
    });
    await store.saveGuess({
      id: "g2", playerId: "p1", levelId: 1, guess: "right", correct: true,
      attemptsBefore: 2, createdAt: new Date().toISOString(),
    });
    expect(await store.solvedLevels("p1")).toEqual([1]);
  });
});
