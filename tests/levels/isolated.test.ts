import { describe, it, expect } from "vitest";
import { ISOLATED_LEVELS } from "@/levels/isolated";
import { getLevel } from "@/levels";

describe("ISOLATED_LEVELS", () => {
  it("has one entry per defense layer", () => {
    expect(ISOLATED_LEVELS.map((l) => l.name)).toEqual([
      "regex-input only",
      "output-filter only",
      "refusal only",
      "hardened only",
      "spotlight only",
      "prompt-shield only",
      "critic only",
    ]);
  });

  it("gives every entry at most one guard", () => {
    for (const level of ISOLATED_LEVELS) expect(level.guards.length).toBeLessThanOrEqual(1);
  });

  it("uses ids that cannot collide with playable levels", () => {
    for (const level of ISOLATED_LEVELS) expect(level.id).toBeGreaterThan(100);
  });

  it("starts from the undefended level 1 prompt unless the variant is a prompt defense", () => {
    const base = getLevel(1)!.systemPrompt;
    const promptVariants = ["refusal only", "hardened only", "spotlight only"];
    for (const level of ISOLATED_LEVELS) {
      if (promptVariants.includes(level.name)) expect(level.systemPrompt).not.toBe(base);
      else expect(level.systemPrompt).toBe(base);
    }
  });

  it("only datamarks in the spotlight variant", () => {
    for (const level of ISOLATED_LEVELS) {
      expect(Boolean(level.wrapUserPrompt)).toBe(level.name === "spotlight only");
    }
  });
});
