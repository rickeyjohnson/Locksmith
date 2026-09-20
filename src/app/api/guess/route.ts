import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getLevel } from "@/levels";
import { getPassword } from "@/levels/secrets";
import { verifyPlayerId } from "@/session";
import { getStore } from "@/store";

export async function POST(req: Request) {
  const cookie = req.headers.get("cookie")?.match(/ls_pid=([^;]+)/)?.[1];
  const playerId = verifyPlayerId(cookie);
  if (!playerId) return NextResponse.json({ error: "no session" }, { status: 401 });

  const { levelId, guess } = await req.json();
  const level = getLevel(Number(levelId));
  if (!level || typeof guess !== "string") {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const correct = guess.trim().toLowerCase() === getPassword(level.id).toLowerCase();
  const store = getStore();
  const attemptsBefore = await store.countAttempts(playerId, level.id);

  await store.saveGuess({
    id: randomUUID(),
    playerId,
    levelId: level.id,
    guess,
    correct,
    attemptsBefore,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({
    correct,
    attemptsBefore,
    defenseSummary: correct ? level.defenseSummary : undefined,
  });
}
