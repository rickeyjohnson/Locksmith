import { readFileSync } from "node:fs";
import path from "node:path";

let cache: Record<string, string> | null = null;

function load(): Record<string, string> {
  if (cache) return cache;
  const file = path.join(process.cwd(), "levels.secrets.json");
  try {
    cache = JSON.parse(readFileSync(file, "utf8"));
  } catch {
    throw new Error(
      "levels.secrets.json missing — run: npx tsx scripts/gen-secrets.ts",
    );
  }
  return cache!;
}

export function getPassword(levelId: number): string {
  const pw = load()[String(levelId)];
  if (!pw) throw new Error(`no password configured for level ${levelId}`);
  return pw;
}
