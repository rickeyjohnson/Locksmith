import type { LevelConfig } from "@/levels";
import { getLevel } from "@/levels";
import { regexInputGuard, DEFAULT_BLOCKED_PATTERNS } from "@/guards/regexInput";
import { outputFilterGuard } from "@/guards/outputFilter";
import { promptShieldGuard } from "@/guards/promptShield";
import { criticGuard } from "@/guards/critic";

/**
 * Benchmark-only variants: each defense layer applied alone on top of the undefended
 * level 1, so a defense's individual effect can be separated from the stack it sits in.
 * Ids start at 101 so they can never collide with a playable level.
 */
function variant(id: number, name: string, over: Partial<LevelConfig>): LevelConfig {
  const base = getLevel(1)!;
  return { ...base, id, name, defenseSummary: name, guards: [], wrapUserPrompt: undefined, ...over };
}

export const ISOLATED_LEVELS: LevelConfig[] = [
  variant(101, "regex-input only", { guards: [regexInputGuard(DEFAULT_BLOCKED_PATTERNS)] }),
  variant(102, "output-filter only", { guards: [outputFilterGuard()] }),
  variant(103, "refusal only", { systemPrompt: getLevel(4)!.systemPrompt }),
  variant(104, "hardened only", { systemPrompt: getLevel(5)!.systemPrompt }),
  variant(105, "spotlight only", {
    systemPrompt: getLevel(6)!.systemPrompt,
    wrapUserPrompt: getLevel(6)!.wrapUserPrompt,
  }),
  variant(106, "prompt-shield only", { guards: [promptShieldGuard()] }),
  variant(107, "critic only", { guards: [criticGuard()] }),
];
