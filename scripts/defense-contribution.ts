/**
 * Per-defense contribution table.
 *
 *   npx tsx scripts/defense-contribution.ts [benchmark.csv ...]
 *
 * For every level or isolated defense, splits the attempts into where they ended:
 * blocked at the input before the model ever saw them, blocked on the way out, or
 * delivered to the player — and of those delivered, how many leaked. Written for the
 * question "what does each defense actually contribute?", which a single leak rate
 * cannot answer: an input filter and an output filter can post the same leak rate
 * while doing completely different work.
 */
import { readFileSync, writeFileSync, mkdirSync, globSync } from "node:fs";

type Row = Record<string, string>;

function parseCsv(text: string): Row[] {
  const rows: Row[] = [];
  let field = "";
  let record: string[] = [];
  let inQuotes = false;
  let header: string[] | null = null;
  const pushField = () => { record.push(field); field = ""; };
  const pushRecord = () => {
    pushField();
    if (!header) header = record;
    else if (record.length === header.length) {
      rows.push(Object.fromEntries(header.map((h, i) => [h, record[i]])));
    }
    record = [];
  };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") pushField();
    else if (c === "\n") pushRecord();
    else if (c !== "\r") field += c;
  }
  if (field || record.length) pushRecord();
  return rows;
}

const INPUT_GUARDS = ["regex-input", "prompt-shield"];

function pct(n: number, d: number): string {
  return d ? `${((n / d) * 100).toFixed(1)}%` : "—";
}

function main() {
  const files = process.argv.slice(2).length
    ? process.argv.slice(2)
    : globSync("docs/results/benchmark-*.csv");
  if (!files.length) throw new Error("no benchmark CSVs given or found in docs/results/");

  const rows = files.flatMap((f) => parseCsv(readFileSync(f, "utf8")));
  const scored = rows.filter((r) => r.status !== "error");

  const groups = new Map<string, Row[]>();
  for (const r of scored) {
    const key = `${r.suite}|${r.level.padStart(3, "0")}|${r.level_name}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }

  const out = [
    ["suite", "level", "defense", "attempts", "blocked_before_model", "blocked_before_model_pct",
     "reached_model", "blocked_on_output", "delivered_to_player", "leaked_to_player",
     "leak_rate_overall", "leak_rate_of_delivered", "model_leaked_given_reached"].join(","),
  ];

  for (const [key, g] of [...groups.entries()].sort()) {
    const [suite, level, name] = key.split("|");
    const blockedIn = g.filter((r) => INPUT_GUARDS.includes(r.blocked_by)).length;
    const reached = g.filter((r) => !INPUT_GUARDS.includes(r.blocked_by));
    const blockedOut = reached.filter((r) => r.blocked_by).length;
    const delivered = reached.filter((r) => !r.blocked_by);
    const leaked = g.filter((r) => r.leaked === "true").length;
    const modelLeaked = reached.filter((r) => r.raw_leaked === "true").length;

    out.push([
      suite, String(Number(level)), `"${name.replace(/"/g, '""')}"`, g.length,
      blockedIn, pct(blockedIn, g.length),
      reached.length, blockedOut, delivered.length, leaked,
      pct(leaked, g.length), pct(leaked, delivered.length), pct(modelLeaked, reached.length),
    ].join(","));
  }

  mkdirSync("docs/results", { recursive: true });
  writeFileSync("docs/results/defense-contribution.csv", out.join("\n"));

  console.log("level | defense              |   n | blocked in | reached | blocked out | delivered | leaked | leak% of delivered | model leak% given reached");
  for (const line of out.slice(1)) {
    const c = line.split(",").map((x) => x.replace(/^"|"$/g, ""));
    console.log(
      `${c[1].padStart(5)} | ${c[2].slice(0, 20).padEnd(20)} | ${c[3].padStart(3)} | ${c[4].padStart(10)} | ${c[6].padStart(7)} | ${c[7].padStart(11)} | ${c[8].padStart(9)} | ${c[9].padStart(6)} | ${c[11].padStart(18)} | ${c[12].padStart(25)}`,
    );
  }
  console.log("\nWrote docs/results/defense-contribution.csv");
}

main();
