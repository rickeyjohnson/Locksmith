import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AttemptRecord, GuessRecord, Store } from "./types";

/**
 * Postgres-backed store. Requires the secret (service_role) key: row-level security
 * is enabled with no policies, so a publishable/anon key cannot read or write.
 */
export function supabaseStore(url: string, serviceKey: string, injected?: SupabaseClient): Store {
  const db = injected ?? createClient(url, serviceKey, { auth: { persistSession: false } });

  function check(error: { message: string } | null) {
    if (error) throw new Error(`supabase write failed: ${error.message}`);
  }

  return {
    async saveAttempt(a: AttemptRecord) {
      const { error } = await db.from("attempts").insert({
        id: a.id,
        player_id: a.playerId,
        level_id: a.levelId,
        attempt_no: a.attemptNo,
        prompt: a.prompt,
        raw_model_response: a.rawModelResponse,
        shown_response: a.shownResponse,
        status: a.status,
        blocked_by: a.blockedBy,
        guard_trace: a.guardTrace,
        leaked: a.leaked,
        raw_leaked: a.rawLeaked,
        latency_ms: a.latencyMs,
        model: a.model,
        config_hash: a.configHash,
        created_at: a.createdAt,
      });
      check(error);
    },

    async saveGuess(g: GuessRecord) {
      const { error } = await db.from("guesses").insert({
        id: g.id,
        player_id: g.playerId,
        level_id: g.levelId,
        guess: g.guess,
        correct: g.correct,
        attempts_before: g.attemptsBefore,
        created_at: g.createdAt,
      });
      check(error);
    },

    async countAttempts(playerId, levelId) {
      const { count, error } = await db
        .from("attempts")
        .select("id", { count: "exact", head: true })
        .eq("player_id", playerId)
        .eq("level_id", levelId);
      if (error) throw new Error(`supabase read failed: ${error.message}`);
      return count ?? 0;
    },

    async solvedLevels(playerId) {
      const { data, error } = await db
        .from("guesses")
        .select("level_id")
        .eq("player_id", playerId)
        .eq("correct", true);
      if (error) throw new Error(`supabase read failed: ${error.message}`);
      const ids = (data ?? []).map((r: { level_id: number }) => r.level_id);
      return [...new Set(ids)].sort((a, b) => a - b);
    },
  };
}
