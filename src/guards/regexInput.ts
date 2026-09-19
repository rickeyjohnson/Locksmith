import type { Guard } from "./types";

export const DEFAULT_BLOCKED_PATTERNS: RegExp[] = [
  /pass\s*-?\s*word/i,
  /secret/i,
  /passphrase/i,
  /ignore\s+(all\s+)?(previous|prior|above)/i,
  /disregard\s+(all\s+)?(previous|prior|above)/i,
  /system\s+prompt/i,
  /your\s+instructions/i,
  /reveal/i,
];

export function regexInputGuard(patterns: RegExp[]): Guard {
  return {
    name: "regex-input",
    stage: "input",
    async run(text) {
      const hit = patterns.find((p) => p.test(text));
      return hit
        ? { action: "block", reason: `matched ${hit.source}` }
        : { action: "pass" };
    },
  };
}
