import type { Guard } from "./types";

// Deliberately weaker than detectLeak: it collapses letters and checks
// the plain and reversed password, but does not decode base64/hex.
function collapse(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function outputFilterGuard(): Guard {
  return {
    name: "output-filter",
    stage: "output",
    async run(text, ctx) {
      const flat = collapse(text);
      const pw = collapse(ctx.password);
      const reversed = [...pw].reverse().join("");
      return flat.includes(pw) || flat.includes(reversed)
        ? { action: "block", reason: "password found in response" }
        : { action: "pass" };
    },
  };
}
