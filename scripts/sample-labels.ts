/**
 * Draws a stratified sample of automatically labeled attempts for manual review.
 *
 *   npx tsx scripts/sample-labels.ts [benchmark.csv ...]
 *
 * Writes docs/results/label-audit-sample.csv with a blank `human_label` column.
 * Fill it in by hand with "leak" or "clean", then run scripts/score-labels.ts to
 * compare the detector against the human judgment.
 *
 * Sampling is stratified so the audit sees both classes and every level: the
 * detector's errors are not spread evenly, and a uniform sample would be almost
 * entirely clean rows.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { globSync } from "node:fs";

interface Row {
  [key: string]: string;
}

function parseCsv(text: string): Row[] {
  const rows: Row[] = [];
  let field = "";
  let record: string[] = [];
  let inQuotes = false;
  let header: string[] | null = null;

  const pushField = () => {
    record.push(field);
    field = "";
  };
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

function csvEscape(v: string): string {
  return `"${String(v ?? "").replace(/"/g, '""').replace(/\n/g, " ")}"`;
}

const PER_STRATUM = Number(process.env.AUDIT_PER_STRATUM ?? 4);

function main() {
  const files = process.argv.slice(2).length
    ? process.argv.slice(2)
    : globSync("docs/results/benchmark-*.csv");
  if (!files.length) throw new Error("no benchmark CSVs found in docs/results/");

  const rows = files.flatMap((f) =>
    parseCsv(readFileSync(f, "utf8")).map((r) => ({ ...r, source_file: f })),
  );
  const scored = rows.filter((r) => r.status !== "error");

  // Strata: (level, detector verdict). Deterministic pick — every Nth row — so the
  // audit is reproducible and cannot be re-rolled until it looks good.
  const buckets = new Map<string, Row[]>();
  for (const r of scored) {
    const key = `${r.level}|${r.leaked}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(r);
  }

  const sample: Row[] = [];
  for (const [, bucket] of [...buckets.entries()].sort()) {
    const step = Math.max(1, Math.floor(bucket.length / PER_STRATUM));
    for (let i = 0; i < bucket.length && sample.length < 1e4; i += step) {
      sample.push(bucket[i]);
      if (sample.filter((s) => s.level === bucket[i].level && s.leaked === bucket[i].leaked).length >= PER_STRATUM) break;
    }
  }

  const header = [
    "audit_id", "suite", "level", "level_name", "attack_id",
    "detector_label", "human_label", "notes", "response",
  ];
  const lines = [header.join(",")];
  sample.forEach((r, i) => {
    lines.push([
      i + 1,
      csvEscape(r.suite),
      r.level,
      csvEscape(r.level_name),
      csvEscape(r.attack_id),
      r.leaked === "true" ? "leak" : "clean",
      "", // human_label — fill in by hand
      "", // notes
      csvEscape(r.response),
    ].join(","));
  });

  mkdirSync("docs/results", { recursive: true });
  writeFileSync("docs/results/label-audit-sample.csv", lines.join("\n"));

  const leaks = sample.filter((r) => r.leaked === "true").length;
  console.log(`Sampled ${sample.length} attempts from ${scored.length} scored rows across ${files.length} file(s).`);
  console.log(`  detector says leak: ${leaks} · detector says clean: ${sample.length - leaks}`);
  console.log("Wrote docs/results/label-audit-sample.csv — fill in human_label with leak/clean.");
}

main();
