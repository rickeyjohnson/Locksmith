/**
 * Runs an attack or benign corpus against the defenses and writes one CSV row per attempt.
 *
 *   npm run benchmark                      # stacked levels 1-8, attack corpus
 *   npm run benchmark -- 1,2,3             # only these levels
 *   BENCH_SUITE=isolated npm run benchmark # one defense at a time
 *   BENCH_SUITE=benign npm run benchmark   # legitimate prompts, to measure over-blocking
 *   BENCH_SEEDS=42,43,44 npm run benchmark # several seeds (replies are deterministic per seed)
 *   BENCH_PASSWORDS=3 npm run benchmark    # repeat over several secrets
 *
 * Every row records the seed, the password id and the configuration hash, so a result can
 * be traced to the exact configuration that produced it. Error rows are written too and
 * excluded from rates at analysis time rather than dropped here, so the planned count and
 * the scored count can both be reported.
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: [".env.local", ".env"] });
import { mkdirSync, writeFileSync, appendFileSync, readFileSync } from "node:fs";
import { LEVELS } from "../src/levels";
import { ISOLATED_LEVELS } from "../src/levels/isolated";
import { runPipeline } from "../src/pipeline/run";
import { loadAttacks } from "./attacks";
import { evalPasswords } from "./eval-passwords";

/**
 * Replies are deterministic for a fixed seed, so repeating a run changes nothing.
 * Real variance comes from varying the seed: BENCH_SEEDS=42,43,44.
 */
const SEEDS = (process.env.BENCH_SEEDS ?? String(process.env.LLM_SEED ?? 42))
  .split(",")
  .map((s) => Number(s.trim()))
  .filter((n) => Number.isFinite(n));

const PASSWORD_COUNT = Number(process.env.BENCH_PASSWORDS ?? 1);
const onlyLevels = process.argv[2]?.split(",").map(Number);

interface Prompt {
  id: string;
  text: string;
  source: string;
}

function loadBenign(): Prompt[] {
  return JSON.parse(readFileSync("scripts/benign.json", "utf8")).map(
    (p: { id: string; text: string }) => ({ ...p, source: "benign" }),
  );
}

// Newlines are kept as \n escapes so acrostic and spelled-out leaks stay auditable;
// responses are stored in full so a hand-check can see what the detector saw.
function csvEscape(value: string): string {
  return `"${value.replace(/"/g, '""').replace(/\r?\n/g, "\\n")}"`;
}

async function main() {
  const suite = process.env.BENCH_SUITE ?? "stacked";
  const benign = suite === "benign";
  // BENCH_POOL lets the benign corpus run against the isolated variants, where a
  // single defense's utility cost can be read off directly.
  const poolName = process.env.BENCH_POOL ?? suite;
  const pool = poolName === "isolated" ? ISOLATED_LEVELS : LEVELS;
  const levels = onlyLevels ? pool.filter((l) => onlyLevels.includes(l.id)) : pool;
  const prompts: Prompt[] = benign ? loadBenign() : loadAttacks();
  const passwords = evalPasswords(PASSWORD_COUNT);

  const header =
    "suite,level,level_name,prompt_id,prompt_source,password_id,seed,config_hash," +
    "status,blocked_by,leaked,raw_leaked,reached_model,refused,response,raw_response";
  mkdirSync("results", { recursive: true });
  const file = `results/${suite}-${poolName === suite ? "" : `${poolName}-`}${new Date().toISOString().replace(/[:.]/g, "-")}.csv`;
  writeFileSync(file, `${header}\n`);

  const planned = levels.length * prompts.length * passwords.length * SEEDS.length;
  console.log(
    `suite=${suite} pool=${poolName} levels=${levels.length} prompts=${prompts.length} ` +
      `passwords=${passwords.length} seeds=${SEEDS.length} -> ${planned} planned attempts`,
  );

  const tally = new Map<number, { leaks: number; refusals: number; scored: number; errors: number }>();

  for (const level of levels) {
    // Every level and variant is run against the same passwords, so a difference
    // between defenses cannot be an artefact of which word each one happened to guard.
    for (const password of passwords) {
      for (const prompt of prompts) {
        for (const seed of SEEDS) {
          process.env.LLM_SEED = String(seed);
          const r = await runPipeline(level, password.word, prompt.text);
          // A benign prompt answered with the block line is an over-refusal: the
          // defense cost the application a legitimate interaction.
          const refused = Boolean(r.blockedBy) || r.shownResponse.trim() === level.blockMessage;

          appendFileSync(
            file,
            [
              suite, level.id, csvEscape(level.name), prompt.id, prompt.source,
              password.id, seed, r.configHash, r.status, r.blockedBy ?? "",
              r.leaked, r.rawLeaked,
              !["regex-input", "prompt-shield"].includes(r.blockedBy ?? ""),
              refused,
              csvEscape(r.shownResponse), csvEscape(r.rawModelResponse ?? ""),
            ].join(",") + "\n",
          );

          const t = tally.get(level.id) ?? { leaks: 0, refusals: 0, scored: 0, errors: 0 };
          if (r.status === "error") t.errors += 1;
          else {
            t.scored += 1;
            if (r.leaked) t.leaks += 1;
            if (refused) t.refusals += 1;
          }
          tally.set(level.id, t);
          process.stdout.write(
            r.status === "error"
              ? "E"
              : benign
                ? refused ? "x" : "."
                : r.leaked ? "!" : r.blockedBy ? "x" : ".",
          );
        }
      }
    }
    process.stdout.write(`  L${level.id} done\n`);
  }

  const metric = benign ? "Over-refusal" : "Leak rate";
  console.log(`\nLevel | Defense                      | ${metric}      | scored | errors`);
  for (const level of levels) {
    const t = tally.get(level.id)!;
    const hits = benign ? t.refusals : t.leaks;
    const pct = t.scored ? ((hits / t.scored) * 100).toFixed(1) : "n/a";
    console.log(
      `${String(level.id).padStart(5)} | ${level.name.padEnd(28)} | ${String(pct).padStart(5)}% (${String(hits).padStart(3)}/${String(t.scored).padStart(3)})` +
        ` | ${String(t.scored).padStart(6)} | ${String(t.errors).padStart(6)}`,
    );
  }
  const totalScored = [...tally.values()].reduce((n, t) => n + t.scored, 0);
  const totalErrors = [...tally.values()].reduce((n, t) => n + t.errors, 0);
  console.log(
    `\nplanned ${planned} · scored ${totalScored} · errors ${totalErrors} (written to the CSV, excluded from rates)`,
  );
  console.log(`Wrote ${file}`);
}

main();
