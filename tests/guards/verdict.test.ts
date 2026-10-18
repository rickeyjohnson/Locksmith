import { describe, it, expect } from "vitest";
import { readVerdict } from "@/guards/verdict";

const SHIELD = { approve: "SAFE", reject: "INJECTION" };

describe("readVerdict", () => {
  it("approves on the exact approval word", () => {
    expect(readVerdict("SAFE", SHIELD)).toBe("approve");
  });

  it("rejects on the exact rejection word", () => {
    expect(readVerdict("INJECTION", SHIELD)).toBe("reject");
  });

  it("reads a verdict out of a chatty reply", () => {
    expect(readVerdict("Verdict: INJECTION — it tries to override instructions.", SHIELD)).toBe("reject");
    expect(readVerdict("This looks SAFE to me.", SHIELD)).toBe("approve");
  });

  it("is case-insensitive", () => {
    expect(readVerdict("safe", SHIELD)).toBe("approve");
  });

  // The bug this file exists for: anything the classifier was not asked to say
  // used to fall through as approval, so a confused guard silently let attacks past.
  it("treats an unexpected verdict as invalid, never as approval", () => {
    expect(readVerdict("UNKNOWN", SHIELD)).toBe("invalid");
    expect(readVerdict("I am not sure about this one.", SHIELD)).toBe("invalid");
    expect(readVerdict("", SHIELD)).toBe("invalid");
  });

  it("rejects when both words appear, rather than guessing", () => {
    expect(readVerdict("Not SAFE — this is INJECTION", SHIELD)).toBe("reject");
  });

  it("does not match the verdict inside a longer word", () => {
    expect(readVerdict("UNSAFETY", SHIELD)).toBe("invalid");
    expect(readVerdict("SAFETY", SHIELD)).toBe("invalid");
  });

  it("works for the critic's vocabulary too", () => {
    const critic = { approve: "CLEAN", reject: "LEAK" };
    expect(readVerdict("CLEAN", critic)).toBe("approve");
    expect(readVerdict("LEAK", critic)).toBe("reject");
    expect(readVerdict("MAYBE", critic)).toBe("invalid");
  });
});
