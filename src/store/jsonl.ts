import { appendFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import type { AttemptRecord, GuessRecord, Store } from "./types";

type Row =
  | { kind: "attempt"; data: AttemptRecord }
  | { kind: "guess"; data: GuessRecord };

export function jsonlStore(file: string): Store {
  function append(row: Row) {
    mkdirSync(path.dirname(file), { recursive: true });
    appendFileSync(file, `${JSON.stringify(row)}\n`, "utf8");
  }

  function rows(): Row[] {
    if (!existsSync(file)) return [];
    return readFileSync(file, "utf8")
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as Row);
  }

  return {
    async saveAttempt(data) { append({ kind: "attempt", data }); },
    async saveGuess(data) { append({ kind: "guess", data }); },
    async countAttempts(playerId, levelId) {
      return rows().filter(
        (r) => r.kind === "attempt" && r.data.playerId === playerId && r.data.levelId === levelId,
      ).length;
    },
    async solvedLevels(playerId) {
      const ids = rows()
        .filter((r): r is { kind: "guess"; data: GuessRecord } => r.kind === "guess")
        .filter((r) => r.data.playerId === playerId && r.data.correct)
        .map((r) => r.data.levelId);
      return [...new Set(ids)].sort((a, b) => a - b);
    },
  };
}
