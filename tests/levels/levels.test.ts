import { describe, it, expect } from "vitest";
import { LEVELS, getLevel, configHash, PUBLIC_LEVELS } from "@/levels";

describe("levels", () => {
  it("defines levels 1 through 8 in order", () => {
    expect(LEVELS.map((l) => l.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it("level 7 runs the shield between the regex guard and the output filter", () => {
    expect(getLevel(7)!.guards.map((g) => g.name)).toEqual([
      "regex-input", "prompt-shield", "output-filter",
    ]);
  });

  it("level 8 adds the critic last, after the output filter", () => {
    expect(getLevel(8)!.guards.map((g) => g.name)).toEqual([
      "regex-input", "prompt-shield", "output-filter", "critic",
    ]);
  });

  it("the two AI levels are the only ones that call the model for defense", () => {
    const aiGuards = ["prompt-shield", "critic"];
    for (const level of LEVELS) {
      const usesAi = level.guards.some((g) => aiGuards.includes(g.name));
      expect(usesAi).toBe(level.id >= 7);
    }
  });

  it("level 1 has no guards", () => {
    expect(getLevel(1)!.guards).toHaveLength(0);
  });

  it("level 2 adds the regex input guard", () => {
    expect(getLevel(2)!.guards.map((g) => g.name)).toEqual(["regex-input"]);
  });

  it("level 3 stacks the output filter on the regex guard", () => {
    expect(getLevel(3)!.guards.map((g) => g.name)).toEqual(["regex-input", "output-filter"]);
  });

  it("levels stack: every level keeps every guard from the level below it", () => {
    for (let i = 1; i < LEVELS.length; i++) {
      const prev = LEVELS[i - 1].guards.map((g) => g.name);
      const curr = LEVELS[i].guards.map((g) => g.name);
      expect(curr).toEqual(expect.arrayContaining(prev));
    }
  });

  it("every level runs its input guards before its output guards", () => {
    for (const level of LEVELS) {
      const stages = level.guards.map((g) => g.stage);
      expect(stages).toEqual([...stages].sort((a, b) => (a === b ? 0 : a === "input" ? -1 : 1)));
    }
  });

  it("every system prompt has a password placeholder", () => {
    for (const level of LEVELS) expect(level.systemPrompt).toContain("{{PASSWORD}}");
  });

  it("level 6 wraps the user prompt for spotlighting", () => {
    const wrapped = getLevel(6)!.wrapUserPrompt!("hello world");
    expect(wrapped).toContain("hello^world");
  });

  it("configHash is stable for the same config and differs across levels", () => {
    expect(configHash(getLevel(1)!)).toBe(configHash(getLevel(1)!));
    expect(configHash(getLevel(1)!)).not.toBe(configHash(getLevel(2)!));
  });

  it("public level data carries no prompts or passwords", () => {
    for (const level of PUBLIC_LEVELS) {
      expect(Object.keys(level).sort()).toEqual(["blurb", "id", "name"]);
    }
  });
});
