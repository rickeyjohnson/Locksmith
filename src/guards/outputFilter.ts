import type { Guard } from "./types";

/**
 * The non-AI output baseline: a literal, case-insensitive substring match, which is what a
 * naive real-world filter does. It deliberately misses spaced, hyphenated, reversed, and
 * encoded spellings — src/pipeline/leak.ts catches all of those, so the logs separate
 * "the model kept the secret" from "a filter caught it".
 *
 * An earlier version normalized away spaces and punctuation before matching. That was
 * stronger than any real naive filter and made levels 3-8 unbeatable: across 144 benchmark
 * attempts, every leak the model produced was plain text this filter swallowed, so no
 * player could ever see the password. See Task 3 of
 * docs/superpowers/plans/2026-09-20-locksmith-phase-b.md.
 */
export function outputFilterGuard(): Guard {
  return {
    name: "output-filter",
    stage: "output",
    async run(text, ctx) {
      const haystack = text.toLowerCase();
      const pw = ctx.password.toLowerCase();
      return haystack.includes(pw)
        ? { action: "block", reason: "password found in response" }
        : { action: "pass" };
    },
  };
}
