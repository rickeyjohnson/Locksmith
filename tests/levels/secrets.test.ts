import { describe, it, expect } from "vitest";
import { makePassword } from "../../scripts/gen-secrets";

describe("makePassword", () => {
  it("returns an uppercase alphabetic word", () => {
    expect(makePassword()).toMatch(/^[A-Z]{8,14}$/);
  });

  it("is pronounceable: no run of three consonants", () => {
    for (let i = 0; i < 200; i++) {
      expect(makePassword()).not.toMatch(/[BCDFGHJKLMNPQRSTVWXZ]{3}/);
    }
  });

  it("does not repeat across 200 draws", () => {
    const seen = new Set(Array.from({ length: 200 }, () => makePassword()));
    expect(seen.size).toBeGreaterThan(190);
  });

  it("is not a word from any list stored in the repo", () => {
    // The old generator drew from a committed 16-word pool, which let anyone
    // reading the public repo shortlist every password.
    const source = require("node:fs").readFileSync("scripts/gen-secrets.ts", "utf8");
    for (let i = 0; i < 50; i++) {
      expect(source.toLowerCase()).not.toContain(makePassword().toLowerCase());
    }
  });
});
