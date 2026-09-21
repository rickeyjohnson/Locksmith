"use client";
import { useState } from "react";
import type { PublicLevel } from "./LevelMap";

type Turn = { you: string; guardian: string; blocked: boolean };

export function LevelScreen({
  level,
  onSolved,
  onBack,
}: {
  level: PublicLevel;
  onSolved: (summary: string) => void;
  onBack: () => void;
}) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [prompt, setPrompt] = useState("");
  const [guess, setGuess] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  /**
   * A server error does not return JSON, so parsing has to be guarded — otherwise the
   * throw escapes and leaves the screen stuck on "thinking…" with no way to recover.
   */
  async function post(path: string, body: unknown): Promise<Record<string, unknown>> {
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      return (await res.json()) as Record<string, unknown>;
    } catch {
      return { error: "Something went wrong reaching the vault. Try again in a moment." };
    }
  }

  async function send() {
    if (!prompt.trim() || busy) return;
    setBusy(true);
    setNote("");
    try {
      const res = await post("/api/attempt", { levelId: level.id, prompt });
      if (res.error) setNote(String(res.error));
      else {
        setTurns((t) => [
          ...t,
          { you: prompt, guardian: String(res.response), blocked: Boolean(res.blocked) },
        ]);
        setPrompt("");
      }
    } finally {
      setBusy(false);
    }
  }

  async function submitGuess() {
    if (!guess.trim()) return;
    const res = await post("/api/guess", { levelId: level.id, guess });
    if (res.error) setNote(String(res.error));
    else if (res.correct) onSolved(String(res.defenseSummary));
    else setNote("Wrong password.");
    setGuess("");
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-8">
      <button className="self-start text-sm underline" onClick={onBack}>
        ← All locks
      </button>
      <h2 className="text-2xl font-bold">
        Level {level.id}: {level.name}
      </h2>
      <p className="opacity-70">{level.blurb}</p>
      <p className="text-sm opacity-70">Attempts: {turns.length}</p>
      <p className="text-xs opacity-60">
        The guardian answers each message on its own — it does not remember your earlier
        messages in this level.
      </p>

      <div className="space-y-3">
        {turns.map((turn, i) => (
          <div key={i} className="space-y-1">
            <p className="rounded bg-black/5 p-2 dark:bg-white/10">
              <strong>You:</strong> {turn.you}
            </p>
            <p
              className={`rounded p-2 ${
                turn.blocked
                  ? "border border-red-500/40 bg-red-500/10"
                  : "bg-black/5 dark:bg-white/10"
              }`}
            >
              <strong>Guardian:</strong> {turn.guardian}
            </p>
          </div>
        ))}
        {busy && (
          <p className="rounded bg-black/5 p-2 opacity-70 dark:bg-white/10">
            <strong>Guardian:</strong> <span className="animate-pulse">thinking…</span>{" "}
            <span className="text-xs">(this can take up to half a minute on the later levels)</span>
          </p>
        )}
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          className="flex-1 rounded border p-2"
          maxLength={1000}
          value={prompt}
          placeholder="Say something to the guardian…"
          onChange={(e) => setPrompt(e.target.value)}
        />
        <button
          type="submit"
          className="rounded bg-black px-4 text-white disabled:opacity-50 dark:bg-white dark:text-black"
          disabled={busy}
        >
          {busy ? "…" : "Send"}
        </button>
      </form>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          submitGuess();
        }}
      >
        <input
          className="flex-1 rounded border p-2"
          value={guess}
          placeholder="Guess the password"
          onChange={(e) => setGuess(e.target.value)}
        />
        <button type="submit" className="rounded border px-4">
          Try password
        </button>
      </form>

      {note && <p className="text-sm text-red-500">{note}</p>}
    </div>
  );
}
