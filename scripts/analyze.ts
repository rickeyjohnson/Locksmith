/**
 * Turns collected play data into the report tables.
 *
 * Run: npx tsx scripts/analyze.ts
 * Reads Supabase when configured, otherwise the local JSONL file, so it works
 * whichever store the playtest ran against.
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: [".env.local", ".env"] });
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { LEVELS } from "../src/levels";

interface AttemptRow {
  level_id: number;
  leaked: boolean;
  raw_leaked: boolean;
  status: string;
  blocked_by: string | null;
  prompt: string;
  player_id: string;
}

interface GuessRow {
  level_id: number;
  correct: boolean;
  attempts_before: number;
  player_id: string;
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]);
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""').replace(/\n/g, " ")}"`;
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
}

function median(xs: number[]): number | "" {
  if (!xs.length) return "";
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function pct(part: number, whole: number): string {
  return whole ? `${((part / whole) * 100).toFixed(1)}%` : "";
}

async function fromSupabase(): Promise<{ attempts: AttemptRow[]; guesses: GuessRow[] }> {
  const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { persistSession: false },
  });
  const a = await db
    .from("attempts")
    .select("level_id,leaked,raw_leaked,status,blocked_by,prompt,player_id");
  if (a.error) throw new Error(a.error.message);
  const g = await db.from("guesses").select("level_id,correct,attempts_before,player_id");
  if (g.error) throw new Error(g.error.message);
  return { attempts: (a.data ?? []) as AttemptRow[], guesses: (g.data ?? []) as GuessRow[] };
}

function fromJsonl(file: string): { attempts: AttemptRow[]; guesses: GuessRow[] } {
  if (!existsSync(file)) return { attempts: [], guesses: [] };
  const attempts: AttemptRow[] = [];
  const guesses: GuessRow[] = [];
  for (const line of readFileSync(file, "utf8").split("\n").filter(Boolean)) {
    const row = JSON.parse(line);
    if (row.kind === "attempt") {
      attempts.push({
        level_id: row.data.levelId,
        leaked: row.data.leaked,
        raw_leaked: row.data.rawLeaked,
        status: row.data.status,
        blocked_by: row.data.blockedBy,
        prompt: row.data.prompt,
        player_id: row.data.playerId,
      });
    } else {
      guesses.push({
        level_id: row.data.levelId,
        correct: row.data.correct,
        attempts_before: row.data.attemptsBefore,
        player_id: row.data.playerId,
      });
    }
  }
  return { attempts, guesses };
}

async function main() {
  const useSupabase = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);
  const { attempts, guesses } = useSupabase
    ? await fromSupabase()
    : fromJsonl(process.env.DATA_FILE ?? "data/attempts.jsonl");

  console.log(`source: ${useSupabase ? "supabase" : "jsonl"} — ${attempts.length} attempts, ${guesses.length} guesses\n`);
  mkdirSync("docs/results", { recursive: true });

  const scored = attempts.filter((a) => a.status !== "error");
  const levels = LEVELS.map((l) => l.id);

  const leakRows = levels.map((lv) => {
    const rows = scored.filter((a) => a.level_id === lv);
    const reached = rows.filter((a) => !["regex-input", "prompt-shield"].includes(a.blocked_by ?? ""));
    return {
      level: lv,
      defense: LEVELS.find((l) => l.id === lv)!.name,
      attempts: rows.length,
      players: new Set(rows.map((a) => a.player_id)).size,
      errors_excluded: attempts.filter((a) => a.level_id === lv && a.status === "error").length,
      player_leak_rate: pct(rows.filter((a) => a.leaked).length, rows.length),
      model_leak_rate: pct(rows.filter((a) => a.raw_leaked).length, rows.length),
      reached_model: reached.length,
      model_leak_rate_given_reached: pct(reached.filter((a) => a.raw_leaked).length, reached.length),
    };
  });
  writeFileSync("docs/results/human-leak-rate-by-level.csv", toCsv(leakRows));

  const solveRows = levels.map((lv) => {
    const counts = guesses
      .filter((g) => g.level_id === lv && g.correct)
      .map((g) => g.attempts_before);
    const mean = counts.length ? counts.reduce((a, b) => a + b, 0) / counts.length : "";
    return {
      level: lv,
      defense: LEVELS.find((l) => l.id === lv)!.name,
      solvers: counts.length,
      mean_attempts: typeof mean === "number" ? mean.toFixed(2) : "",
      median_attempts: median(counts),
      wrong_guesses: guesses.filter((g) => g.level_id === lv && !g.correct).length,
    };
  });
  writeFileSync("docs/results/attempts-until-success.csv", toCsv(solveRows));

  const leaking = scored
    .filter((a) => a.leaked)
    .map((a) => ({ level: a.level_id, prompt: a.prompt.slice(0, 300) }));
  writeFileSync("docs/results/successful-prompts.csv", toCsv(leaking));

  console.table(leakRows);
  console.table(solveRows);
  console.log(`\n${leaking.length} leaking prompts -> docs/results/successful-prompts.csv`);
  console.log("wrote docs/results/{human-leak-rate-by-level,attempts-until-success,successful-prompts}.csv");
}

main();
