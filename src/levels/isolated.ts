import type { LevelConfig } from "@/levels";
import { getLevel, PROMPTS, datamark } from "@/levels";
import { regexInputGuard, DEFAULT_BLOCKED_PATTERNS } from "@/guards/regexInput";
import { outputFilterGuard } from "@/guards/outputFilter";
import { promptShieldGuard } from "@/guards/promptShield";
import { criticGuard } from "@/guards/critic";

/**
 * Benchmark-only variants: one defense layer at a time on top of the undefended level 1
 * prompt, so a layer's own effect can be separated from the stack it normally sits in.
 * Ids start at 101 so they can never collide with a playable level.
 *
 * "spotlight only" previously reused level 6's system prompt, which is the hardened
 * charter *plus* the spotlighting instruction — so its result measured the pair, not
 * spotlighting. It now applies the spotlighting rule to the bare base prompt, and the
 * combined prompt is measured separately and named for what it is.
 */
function variant(id: number, name: string, over: Partial<LevelConfig>): LevelConfig {
  const base = getLevel(1)!;
  return { ...base, id, name, defenseSummary: name, guards: [], wrapUserPrompt: undefined, ...over };
}

export const ISOLATED_LEVELS: LevelConfig[] = [
  variant(101, "regex-input only", { guards: [regexInputGuard(DEFAULT_BLOCKED_PATTERNS)] }),
  variant(102, "output-filter only", { guards: [outputFilterGuard()] }),
  variant(103, "refusal only", { systemPrompt: PROMPTS.REFUSAL }),
  variant(104, "hardened charter only", { systemPrompt: PROMPTS.HARDENED }),
  variant(105, "spotlight only", {
    systemPrompt: PROMPTS.SPOTLIGHT_ONLY,
    wrapUserPrompt: datamark,
  }),
  variant(106, "prompt-shield only", { guards: [promptShieldGuard()] }),
  variant(107, "critic only", { guards: [criticGuard()] }),
  // The level 6 prompt, measured as the combination it actually is.
  variant(108, "hardened charter + spotlight", {
    systemPrompt: PROMPTS.SPOTLIT,
    wrapUserPrompt: datamark,
  }),
];
