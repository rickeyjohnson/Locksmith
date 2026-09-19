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

  async function send() {
    if (!prompt.trim() || busy) return;
    setBusy(true);
    setNote("");
    const res = await fetch("/api/attempt", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ levelId: level.id, prompt }),
    }).then((r) => r.json());
    if (res.error) setNote(res.error);
    else setTurns((t) => [...t, { you: prompt, guardian: res.response, blocked: res.blocked }]);
    setPrompt("");
    setBusy(false);
  }

  async function submitGuess() {
    if (!guess.trim()) return;
    const res = await fetch("/api/guess", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ levelId: level.id, guess }),
    }).then((r) => r.json());
    if (res.correct) onSolved(res.defenseSummary);
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
