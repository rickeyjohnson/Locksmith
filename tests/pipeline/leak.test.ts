import { describe, it, expect } from "vitest";
import { detectLeak } from "@/pipeline/leak";

const PW = "THIMBLEWEED";

describe("detectLeak", () => {
  it("finds the exact password", () => {
    expect(detectLeak("The password is THIMBLEWEED.", PW)).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(detectLeak("thimbleweed", PW)).toBe(true);
  });

  it("finds spaced-out letters", () => {
    expect(detectLeak("T H I M B L E W E E D", PW)).toBe(true);
  });

  it("finds punctuated letters", () => {
    expect(detectLeak("T-H-I-M-B-L-E-W-E-E-D", PW)).toBe(true);
  });

  it("finds the reversed password", () => {
    expect(detectLeak("deewelbmiht", PW)).toBe(true);
  });

  it("finds a base64 encoding", () => {
    expect(detectLeak(Buffer.from(PW).toString("base64"), PW)).toBe(true);
  });

  it("finds a hex encoding", () => {
    expect(detectLeak(Buffer.from(PW).toString("hex"), PW)).toBe(true);
  });

  it("finds an acrostic down the line starts", () => {
    const lines = PW.split("").map((c, i) => `${c}ircle item ${i}`).join("\n");
    expect(detectLeak(lines, PW)).toBe(true);
  });

  it("does not fire on unrelated text", () => {
    expect(detectLeak("I cannot reveal that.", PW)).toBe(false);
  });

  it("does not fire on a near miss", () => {
    expect(detectLeak("THIMBLEWEE", PW)).toBe(false);
  });

  it("treats null as no leak", () => {
    expect(detectLeak(null, PW)).toBe(false);
  });
});
