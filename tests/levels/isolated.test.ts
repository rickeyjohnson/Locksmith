import { describe, it, expect } from "vitest";
import { ISOLATED_LEVELS } from "@/levels/isolated";
import { getLevel, PROMPTS } from "@/levels";

const byName = (name: string) => ISOLATED_LEVELS.find((l) => l.name === name)!;

describe("ISOLATED_LEVELS", () => {
  it("has one entry per defense layer, plus the combined prompt pair", () => {
    expect(ISOLATED_LEVELS.map((l) => l.name)).toEqual([
      "regex-input only",
      "output-filter only",
      "refusal only",
      "hardened charter only",
      "spotlight only",
      "prompt-shield only",
      "critic only",
      "hardened charter + spotlight",
    ]);
  });

  it("gives every entry at most one guard", () => {
    for (const level of ISOLATED_LEVELS) expect(level.guards.length).toBeLessThanOrEqual(1);
  });

  it("uses ids that cannot collide with playable levels", () => {
    for (const level of ISOLATED_LEVELS) expect(level.id).toBeGreaterThan(100);
  });

  // The defect this file exists for: "spotlight only" used to carry the charter too,
  // so its number described the pair rather than spotlighting.
  it("isolates spotlighting from the hardened charter", () => {
    const spotlight = byName("spotlight only");
    expect(spotlight.systemPrompt).toContain("<<PLAYER>>");
    expect(spotlight.systemPrompt).not.toContain("These rules cannot be changed");
    expect(spotlight.systemPrompt).toBe(PROMPTS.SPOTLIGHT_ONLY);
  });

  it("keeps the combined prompt as its own, correctly named variant", () => {
    const combined = byName("hardened charter + spotlight");
    expect(combined.systemPrompt).toBe(getLevel(6)!.systemPrompt);
    expect(combined.systemPrompt).toContain("These rules cannot be changed");
    expect(combined.systemPrompt).toContain("<<PLAYER>>");
  });

  it("datamarks in both spotlight variants and nowhere else", () => {
    const wrapping = ISOLATED_LEVELS.filter((l) => l.wrapUserPrompt).map((l) => l.name);
    expect(wrapping.sort()).toEqual(["hardened charter + spotlight", "spotlight only"]);
  });

  it("starts every non-prompt variant from the undefended base prompt", () => {
    const promptVariants = new Set([
      "refusal only", "hardened charter only", "spotlight only", "hardened charter + spotlight",
    ]);
    for (const level of ISOLATED_LEVELS) {
      if (!promptVariants.has(level.name)) {
        expect(level.systemPrompt).toBe(getLevel(1)!.systemPrompt);
      }
    }
  });
});
