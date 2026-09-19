import { readFileSync, existsSync } from "node:fs";

export interface Attack {
  id: string;
  text: string;
  source: string;
}

/**
 * The canonical hand-written attacks plus, when present, the sampled public
 * dataset attacks written by scripts/fetch-attacks.ts.
 */
export function loadAttacks(): Attack[] {
  const canonical: Attack[] = JSON.parse(readFileSync("scripts/attacks.json", "utf8")).map(
    (a: { id: string; text: string }) => ({ ...a, source: "canonical" }),
  );
  const extraPath = "scripts/attacks-extra.json";
  const extra: Attack[] = existsSync(extraPath)
    ? JSON.parse(readFileSync(extraPath, "utf8"))
    : [];
  return [...canonical, ...extra];
}
