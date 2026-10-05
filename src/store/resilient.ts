import type { AttemptRecord, GuessRecord, Store } from "./types";

export interface ResilientStore extends Store {
  isDegraded(): boolean;
}

/**
 * Runs on the primary store, and switches permanently to the fallback the first time
 * the primary throws.
 *
 * A paused or unreachable database used to take the whole game down: /api/session
 * returned 500 and players were stuck on the consent screen, which would have silently
 * ruined a playtest. Collecting attempts into the local file is far better than
 * refusing to play. The switch is permanent for the process because the failure mode in
 * practice is "the database is gone", and retrying it on every call would add a network
 * timeout to every single attempt.
 */
export function resilientStore(primary: Store, fallback: Store): ResilientStore {
  let degraded = false;

  async function run<T>(
    op: (s: Store) => Promise<T>,
    name: string,
  ): Promise<T> {
    if (!degraded) {
      try {
        return await op(primary);
      } catch (err) {
        degraded = true;
        console.warn(
          `[store] primary store failed on ${name} (${(err as Error).message}); ` +
            "falling back to local file logging for the rest of this process",
        );
      }
    }
    return op(fallback);
  }

  return {
    isDegraded: () => degraded,
    saveAttempt: (a: AttemptRecord) => run((s) => s.saveAttempt(a), "saveAttempt"),
    saveGuess: (g: GuessRecord) => run((s) => s.saveGuess(g), "saveGuess"),
    countAttempts: (playerId, levelId) =>
      run((s) => s.countAttempts(playerId, levelId), "countAttempts"),
    solvedLevels: (playerId) => run((s) => s.solvedLevels(playerId), "solvedLevels"),
  };
}
