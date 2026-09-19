import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { config } from "@/config";

export const COOKIE_NAME = "ls_pid";

function sign(id: string): string {
  return createHmac("sha256", config.sessionSecret).update(id).digest("hex");
}

export function newPlayerId(): string {
  return randomUUID();
}

export function signPlayerId(id: string): string {
  return `${id}.${sign(id)}`;
}

export function verifyPlayerId(cookie: string | undefined): string | null {
  if (!cookie) return null;
  const idx = cookie.lastIndexOf(".");
  if (idx < 1) return null;
  const id = cookie.slice(0, idx);
  const mac = Buffer.from(cookie.slice(idx + 1), "utf8");
  const expected = Buffer.from(sign(id), "utf8");
  if (mac.length !== expected.length) return null;
  return timingSafeEqual(mac, expected) ? id : null;
}
