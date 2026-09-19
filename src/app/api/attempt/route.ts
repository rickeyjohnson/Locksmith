import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getLevel } from "@/levels";
import { getPassword } from "@/levels/secrets";
import { runPipeline } from "@/pipeline/run";
import { verifyPlayerId } from "@/session";
import { jsonlStore } from "@/store/jsonl";
import { config } from "@/config";

const RATE_LIMIT = 10;
const WINDOW_MS = 60_000;
const hits = new Map<string, number[]>();

function rateLimited(playerId: string): boolean {
  const now = Date.now();
  const recent = (hits.get(playerId) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(playerId, recent);
  return recent.length > RATE_LIMIT;
}

export async function POST(req: Request) {
  const cookie = req.headers.get("cookie")?.match(/ls_pid=([^;]+)/)?.[1];
  const playerId = verifyPlayerId(cookie);
  if (!playerId) return NextResponse.json({ error: "no session" }, { status: 401 });

  const { levelId, prompt } = await req.json();
  const level = getLevel(Number(levelId));
  if (!level) return NextResponse.json({ error: "unknown level" }, { status: 400 });
  if (typeof prompt !== "string" || prompt.length === 0 || prompt.length > 1000) {
    return NextResponse.json({ error: "prompt must be 1-1000 characters" }, { status: 400 });
  }
  if (rateLimited(playerId)) {
    return NextResponse.json({ error: "slow down — 10 attempts per minute" }, { status: 429 });
  }

  const password = getPassword(level.id);
  const result = await runPipeline(level, password, prompt);
  const store = jsonlStore(config.dataFile);
  const attemptNo = (await store.countAttempts(playerId, level.id)) + 1;

  await store.saveAttempt({
    id: randomUUID(),
    playerId,
    levelId: level.id,
    attemptNo,
    prompt,
    rawModelResponse: result.rawModelResponse,
    shownResponse: result.shownResponse,
    status: result.status,
    blockedBy: result.blockedBy,
    guardTrace: result.guardTrace,
    leaked: result.leaked,
    rawLeaked: result.rawLeaked,
    latencyMs: result.latencyMs,
    model: config.llmModel,
    configHash: result.configHash,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({
    response: result.shownResponse,
    blocked: result.status === "blocked",
    attemptNo,
  });
}
