/**
 * Downloads human-written prompt-extraction attacks from the public Tensor Trust
 * dataset (Toyer et al., ICLR 2024, arXiv:2311.01011) and writes a deterministic
 * sample to scripts/attacks-extra.json.
 *
 * Run: npx tsx scripts/fetch-attacks.ts
 */
import { writeFileSync } from "node:fs";

const SOURCES = [
  "https://raw.githubusercontent.com/HumanCompatibleAI/tensor-trust-data/main/benchmarks/extraction-robustness/v1/extraction_robustness_dataset.jsonl",
  "https://raw.githubusercontent.com/HumanCompatibleAI/tensor-trust-data/main/benchmarks/extraction/v1/prompt_extraction_robustness_dataset.jsonl",
];

const MAX = Number(process.env.ATTACK_SAMPLE ?? 60);

const ATTACK_FIELDS = ["attack", "attacker_input", "attack_llm_output", "adversarial_input"];

function attackText(row: Record<string, unknown>): string {
  for (const field of ATTACK_FIELDS) {
    const value = row[field];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function usable(text: string): boolean {
  return text.length > 15 && text.length < 600;
}

async function fetchLines(): Promise<string[]> {
  for (const url of SOURCES) {
    const res = await fetch(url);
    if (res.ok) {
      console.log(`Fetched ${url}`);
      return (await res.text()).split("\n").filter(Boolean);
    }
    console.log(`  ${res.status} for ${url}`);
  }
  throw new Error(
    "No Tensor Trust dataset URL worked. Browse https://github.com/HumanCompatibleAI/tensor-trust-data " +
      "for the current path to the extraction benchmark and add it to SOURCES.",
  );
}

async function main() {
  const lines = await fetchLines();
  console.log(`Row fields: ${Object.keys(JSON.parse(lines[0])).join(", ")}`);

  const attacks: { id: string; text: string; source: string }[] = [];
  for (const [i, line] of lines.entries()) {
    const text = attackText(JSON.parse(line));
    if (usable(text)) attacks.push({ id: `tt-${i}`, text, source: "tensor-trust" });
  }
  if (!attacks.length) throw new Error("Parsed rows but found no attack text — check ATTACK_FIELDS.");

  // Even stride, so re-running picks the same sample.
  const step = Math.max(1, Math.floor(attacks.length / MAX));
  const sampled = attacks.filter((_, i) => i % step === 0).slice(0, MAX);

  writeFileSync("scripts/attacks-extra.json", `${JSON.stringify(sampled, null, 2)}\n`);
  console.log(`Wrote ${sampled.length} attacks from ${attacks.length} candidates.`);
}

main();
