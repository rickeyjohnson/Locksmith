import { config as loadEnv } from "dotenv";
loadEnv({ path: [".env.local", ".env"] });
import { mkdirSync, writeFileSync } from "node:fs";
import { LEVELS } from "../src/levels";
import { ISOLATED_LEVELS } from "../src/levels/isolated";
import { getPassword } from "../src/levels/secrets";
import { runPipeline } from "../src/pipeline/run";
import { loadAttacks } from "./attacks";

const RUNS = Number(process.env.BENCH_RUNS ?? 2);
const attacks = loadAttacks();
const onlyLevels = process.argv[2]?.split(",").map(Number);

function csvEscape(value: string): string {
  return `"${value.replace(/"/g, '""').replace(/\n/g, " ")}"`;
}

async function main() {
  const suite = process.env.BENCH_SUITE ?? "stacked";
  const pool = suite === "isolated" ? ISOLATED_LEVELS : LEVELS;
  const levels = onlyLevels ? pool.filter((l) => onlyLevels.includes(l.id)) : pool;
  const rows: string[] = [
    "suite,level,level_name,attack_id,attack_source,run,status,blocked_by,leaked,raw_leaked,response",
  ];
  const tally = new Map<number, { leaks: number; rawLeaks: number; total: number }>();

  for (const level of levels) {
    // Isolated variants borrow level 1's password: they are level 1 plus one defense.
    const password = getPassword(level.id > 100 ? 1 : level.id);
    for (const attack of attacks) {
      for (let run = 1; run <= RUNS; run++) {
        const r = await runPipeline(level, password, attack.text);
        rows.push(
          [
            suite,
            level.id,
            csvEscape(level.name),
            attack.id,
            attack.source,
            run,
            r.status,
            r.blockedBy ?? "",
            r.leaked,
            r.rawLeaked,
            csvEscape(r.shownResponse.slice(0, 500)),
          ].join(","),
        );
        const t = tally.get(level.id) ?? { leaks: 0, rawLeaks: 0, total: 0 };
        if (r.status !== "error") {
          t.total += 1;
          if (r.leaked) t.leaks += 1;
          if (r.rawLeaked) t.rawLeaks += 1;
        }
        tally.set(level.id, t);
        process.stdout.write(r.leaked ? "!" : r.status === "blocked" ? "x" : r.status === "error" ? "E" : ".");
      }
    }
    process.stdout.write(`  L${level.id} done\n`);
  }

  mkdirSync("results", { recursive: true });
  const file = `results/benchmark-${new Date().toISOString().replace(/[:.]/g, "-")}.csv`;
  writeFileSync(file, rows.join("\n"));

  console.log("\nLevel | Defense                | Leak rate     | Model leaked (pre-filter)");
  for (const level of levels) {
    const t = tally.get(level.id)!;
    const pct = t.total ? ((t.leaks / t.total) * 100).toFixed(1) : "n/a";
    const rawPct = t.total ? ((t.rawLeaks / t.total) * 100).toFixed(1) : "n/a";
    console.log(
      `  ${level.id}   | ${level.name.padEnd(22)} | ${String(pct).padStart(5)}% (${t.leaks}/${t.total}) | ${rawPct}%`,
    );
  }
  console.log(`\nWrote ${file}`);
}

main();
