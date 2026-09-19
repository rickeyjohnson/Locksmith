import { NextResponse } from "next/server";
import { PUBLIC_LEVELS } from "@/levels";
import { COOKIE_NAME, newPlayerId, signPlayerId, verifyPlayerId } from "@/session";
import { jsonlStore } from "@/store/jsonl";
import { config } from "@/config";

export async function POST(req: Request) {
  const cookie = req.headers.get("cookie")?.match(/ls_pid=([^;]+)/)?.[1];
  const existing = verifyPlayerId(cookie);
  const playerId = existing ?? newPlayerId();
  const store = jsonlStore(config.dataFile);

  const res = NextResponse.json({
    playerId,
    levels: PUBLIC_LEVELS,
    solved: await store.solvedLevels(playerId),
  });
  res.cookies.set(COOKIE_NAME, signPlayerId(playerId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
