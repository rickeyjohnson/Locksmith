import { config } from "@/config";
import { jsonlStore } from "./jsonl";
import { supabaseStore } from "./supabase";
import type { Store } from "./types";

let cached: Store | null = null;

/**
 * Supabase when both keys are configured, otherwise the local JSONL file. The
 * fallback means a missing or misconfigured database never breaks play — the
 * attempts are still captured on disk.
 */
export function getStore(): Store {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  cached = url && key ? supabaseStore(url, key) : jsonlStore(config.dataFile);
  return cached;
}

export function storeKind(): "supabase" | "jsonl" {
  return process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY ? "supabase" : "jsonl";
}
