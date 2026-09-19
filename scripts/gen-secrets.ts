import { writeFileSync, existsSync } from "node:fs";

const WORDS = [
  "thimbleweed", "marigold", "quillfeather", "ambergris", "sableclock",
  "verdigris", "nightjar", "foxglove", "cinderwick", "brambleaxe",
  "halcyon", "obsidian", "peregrine", "saffronite", "wolfsbane", "zephyrite",
];

const path = "levels.secrets.json";
if (existsSync(path)) {
  console.log(`${path} already exists — not overwriting.`);
  process.exit(0);
}

const pool = [...WORDS].sort(() => Math.random() - 0.5);
const secrets: Record<string, string> = {};
for (let id = 1; id <= 8; id++) secrets[id] = pool[id - 1].toUpperCase();

writeFileSync(path, JSON.stringify(secrets, null, 2));
console.log(`Wrote ${path} (git-ignored) with 8 passwords.`);
