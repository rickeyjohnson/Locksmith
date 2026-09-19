import type { LevelConfig } from "@/levels";
import { configHash } from "@/levels";
import { chat as realChat } from "@/llm/client";
import { detectLeak } from "@/pipeline/leak";

export interface PipelineResult {
  status: "ok" | "blocked" | "error";
  rawModelResponse: string | null;
  shownResponse: string;
  blockedBy: string | null;
  guardTrace: { guard: string; action: string; reason?: string; ms: number }[];
  leaked: boolean;
  rawLeaked: boolean;
  latencyMs: number;
  configHash: string;
}

export async function runPipeline(
  level: LevelConfig,
  password: string,
  userPrompt: string,
  deps: { chat?: typeof realChat } = {},
): Promise<PipelineResult> {
  const chat = deps.chat ?? realChat;
  const started = Date.now();
  const trace: PipelineResult["guardTrace"] = [];
  const ctx = { password, userPrompt };
  const hash = configHash(level);

  const base = (over: Partial<PipelineResult>): PipelineResult => ({
    status: "ok",
    rawModelResponse: null,
    shownResponse: "",
    blockedBy: null,
    guardTrace: trace,
    leaked: false,
    rawLeaked: false,
    latencyMs: Date.now() - started,
    configHash: hash,
    ...over,
  });

  for (const guard of level.guards.filter((g) => g.stage === "input")) {
    const t0 = Date.now();
    const decision = await guard.run(userPrompt, ctx);
    trace.push({
      guard: guard.name,
      action: decision.action,
      reason: "reason" in decision ? decision.reason : undefined,
      ms: Date.now() - t0,
    });
    if (decision.action === "block") {
      return base({
        status: "blocked",
        blockedBy: guard.name,
        shownResponse: level.blockMessage,
      });
    }
  }

  let raw: string;
  try {
    const result = await chat([
      { role: "system", content: level.systemPrompt.replaceAll("{{PASSWORD}}", password) },
      {
        role: "user",
        content: level.wrapUserPrompt ? level.wrapUserPrompt(userPrompt) : userPrompt,
      },
    ]);
    raw = result.thinking ? `${result.text}\n<thinking>${result.thinking}</thinking>` : result.text;
  } catch {
    return base({
      status: "error",
      shownResponse: "Locksmith is offline — try again during a playtest window.",
    });
  }

  const rawLeaked = detectLeak(raw, password);
  let shown = raw;

  for (const guard of level.guards.filter((g) => g.stage === "output")) {
    const t0 = Date.now();
    const decision = await guard.run(shown, ctx);
    trace.push({
      guard: guard.name,
      action: decision.action,
      reason: "reason" in decision ? decision.reason : undefined,
      ms: Date.now() - t0,
    });
    if (decision.action === "block") {
      return base({
        status: "blocked",
        rawModelResponse: raw,
        shownResponse: level.blockMessage,
        blockedBy: guard.name,
        rawLeaked,
        leaked: false,
      });
    }
    if (decision.text !== undefined) shown = decision.text;
  }

  return base({
    status: "ok",
    rawModelResponse: raw,
    shownResponse: shown,
    leaked: detectLeak(shown, password),
    rawLeaked,
  });
}
