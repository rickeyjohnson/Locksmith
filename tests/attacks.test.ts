import { describe, it, expect } from "vitest";
import { loadAttacks } from "../scripts/attacks";

describe("loadAttacks", () => {
  it("includes the hand-written canonical attacks", () => {
    const ids = loadAttacks().map((a) => a.id);
    expect(ids).toContain("direct");
    expect(ids).toContain("translate");
  });

  it("includes public dataset attacks", () => {
    expect(loadAttacks().some((a) => a.source === "tensor-trust")).toBe(true);
  });

  it("gives every attack a unique id and a source", () => {
    const attacks = loadAttacks();
    expect(new Set(attacks.map((a) => a.id)).size).toBe(attacks.length);
    for (const a of attacks) expect(a.source).toBeTruthy();
  });

  it("keeps every attack within the 1000-character prompt cap the game enforces", () => {
    for (const a of loadAttacks()) expect(a.text.length).toBeLessThanOrEqual(1000);
  });
});
