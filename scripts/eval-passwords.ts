/**
 * The passwords the benchmark defends, kept separate from the ones the live game uses.
 *
 * Every compared defense is run against the *same* passwords, and each is repeated over
 * several of them: the secret itself is a source of variation (a word the model finds
 * easy to spell out is not the same test as one it does not), so comparing defenses that
 * each guarded a different word confounds the defense with the word.
 *
 * Written to eval-passwords.json, which git ignores, so published results are not an
 * answer key for anyone running the game.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { makePassword } from "./gen-secrets";

const FILE = "eval-passwords.json";

export function evalPasswords(count: number): { id: string; word: string }[] {
  if (!existsSync(FILE)) {
    const generated = Array.from({ length: Math.max(count, 3) }, (_, i) => ({
      id: `p${i + 1}`,
      word: makePassword(),
    }));
    writeFileSync(FILE, `${JSON.stringify(generated, null, 2)}\n`);
    console.log(`Wrote ${FILE} with ${generated.length} evaluation passwords (git-ignored).`);
  }
  const all: { id: string; word: string }[] = JSON.parse(readFileSync(FILE, "utf8"));
  if (all.length < count) {
    throw new Error(
      `${FILE} holds ${all.length} passwords but ${count} were requested — delete it to regenerate.`,
    );
  }
  return all.slice(0, count);
}
