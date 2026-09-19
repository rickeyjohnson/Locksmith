/**
 * Generates the per-level passwords into levels.secrets.json (git-ignored).
 *
 * The passwords are invented, pronounceable nonsense words rather than picks from a
 * word list. A list committed to this public repo would let any player shortlist every
 * password and brute-force the guess box, which would invalidate the attempt counts.
 */
import { writeFileSync, existsSync } from "node:fs";
import { randomInt } from "node:crypto";

const ONSETS = ["b", "br", "c", "cl", "d", "dr", "f", "fl", "g", "gr", "h", "j", "k", "l", "m", "n", "p", "pl", "qu", "r", "s", "sk", "sl", "sp", "st", "t", "tr", "v", "w", "z"];
const NUCLEI = ["a", "e", "i", "o", "u", "ai", "ea", "ee", "oa", "ou"];
const CODAS = ["b", "ck", "d", "ft", "g", "l", "lm", "m", "n", "nd", "ng", "nt", "p", "r", "rk", "sh", "sk", "st", "t", "th"];

const pick = <T,>(xs: T[], rand: () => number): T => xs[Math.floor(rand() * xs.length)];

/**
 * Builds open syllables (consonant + vowel) and closes only the final one, so a
 * generated word never stacks three consonants and stays sayable out loud.
 */
export function makePassword(
  rand: () => number = () => randomInt(1 << 30) / (1 << 30),
): string {
  let word = "";
  while (word.length < 6) {
    word += pick(ONSETS, rand) + pick(NUCLEI, rand);
  }
  word += pick(CODAS, rand);
  return word.slice(0, 14).toUpperCase();
}

function main() {
  const path = "levels.secrets.json";
  if (existsSync(path) && !process.argv.includes("--force")) {
    console.log(`${path} already exists — pass --force to regenerate.`);
    return;
  }
  const secrets: Record<string, string> = {};
  for (let id = 1; id <= 8; id++) secrets[id] = makePassword();
  writeFileSync(path, JSON.stringify(secrets, null, 2));
  console.log(`Wrote ${path} (git-ignored) with 8 generated passwords.`);
}

if (process.argv[1]?.endsWith("gen-secrets.ts")) main();
