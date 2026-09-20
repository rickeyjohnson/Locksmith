import { describe, it, expect } from "vitest";
import { supabaseStore } from "@/store/supabase";

type Inserted = Record<string, unknown[]>;

function fakeClient() {
  const inserted: Inserted = { attempts: [], guesses: [], players: [] };
  const client = {
    from(table: string) {
      return {
        insert: async (row: unknown) => {
          inserted[table].push(row);
          return { error: null };
        },
      };
    },
  };
  return { client, inserted };
}

const attempt = {
  id: "a1",
  playerId: "p1",
  levelId: 3,
  attemptNo: 2,
  prompt: "hi",
  rawModelResponse: "raw",
  shownResponse: "shown",
  status: "ok" as const,
  blockedBy: null,
  guardTrace: [],
  leaked: false,
  rawLeaked: true,
  latencyMs: 12,
  model: "qwen3:8b",
  configHash: "abc",
  createdAt: "2026-09-25T00:00:00.000Z",
};

describe("supabaseStore", () => {
  it("maps an attempt to snake_case columns", async () => {
    const { client, inserted } = fakeClient();
    await supabaseStore("url", "key", client as never).saveAttempt(attempt);
    expect(inserted.attempts[0]).toEqual({
      id: "a1",
      player_id: "p1",
      level_id: 3,
      attempt_no: 2,
      prompt: "hi",
      raw_model_response: "raw",
      shown_response: "shown",
      status: "ok",
      blocked_by: null,
      guard_trace: [],
      leaked: false,
      raw_leaked: true,
      latency_ms: 12,
      model: "qwen3:8b",
      config_hash: "abc",
      created_at: "2026-09-25T00:00:00.000Z",
    });
  });

  it("keeps the raw model response, which the player never saw", async () => {
    const { client, inserted } = fakeClient();
    await supabaseStore("url", "key", client as never).saveAttempt(attempt);
    const row = inserted.attempts[0] as Record<string, unknown>;
    expect(row.raw_model_response).toBe("raw");
    expect(row.raw_leaked).toBe(true);
    expect(row.leaked).toBe(false);
  });

  it("maps a guess to snake_case columns", async () => {
    const { client, inserted } = fakeClient();
    await supabaseStore("url", "key", client as never).saveGuess({
      id: "g1",
      playerId: "p1",
      levelId: 1,
      guess: "x",
      correct: true,
      attemptsBefore: 4,
      createdAt: "2026-09-25T00:00:00.000Z",
    });
    expect(inserted.guesses[0]).toMatchObject({
      id: "g1",
      player_id: "p1",
      level_id: 1,
      correct: true,
      attempts_before: 4,
    });
  });

  it("throws when the insert fails, so the route reports it instead of losing data", async () => {
    const failing = { from: () => ({ insert: async () => ({ error: { message: "nope" } }) }) };
    await expect(
      supabaseStore("url", "key", failing as never).saveGuess({
        id: "g1",
        playerId: "p1",
        levelId: 1,
        guess: "x",
        correct: false,
        attemptsBefore: 0,
        createdAt: "2026-09-25T00:00:00.000Z",
      }),
    ).rejects.toThrow(/nope/);
  });
});
