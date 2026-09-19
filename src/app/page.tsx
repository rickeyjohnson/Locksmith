"use client";
import { useState } from "react";
import { Consent } from "@/components/Consent";
import { LevelMap, type PublicLevel } from "@/components/LevelMap";
import { LevelScreen } from "@/components/LevelScreen";

export default function Home() {
  const [levels, setLevels] = useState<PublicLevel[] | null>(null);
  const [solved, setSolved] = useState<number[]>([]);
  const [current, setCurrent] = useState<PublicLevel | null>(null);
  const [summary, setSummary] = useState<string | null>(null);

  async function start() {
    const data = await fetch("/api/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    }).then((r) => r.json());
    setLevels(data.levels);
    setSolved(data.solved);
  }

  if (!levels) return <Consent onStart={start} />;

  if (summary && current) {
    return (
      <div className="mx-auto max-w-xl space-y-4 p-8">
        <h2 className="text-2xl font-bold">🔓 Level {current.id} opened</h2>
        <p className="rounded border p-3">
          <strong>The defense you beat:</strong> {summary}
        </p>
        <button
          className="rounded bg-black px-4 py-2 text-white dark:bg-white dark:text-black"
          onClick={() => {
            setSummary(null);
            setCurrent(null);
          }}
        >
          Back to the locks
        </button>
      </div>
    );
  }

  if (current) {
    return (
      <LevelScreen
        level={current}
        onBack={() => setCurrent(null)}
        onSolved={(s) => {
          setSolved((prev) => [...new Set([...prev, current.id])]);
          setSummary(s);
        }}
      />
    );
  }

  return (
    <LevelMap
      levels={levels}
      solved={solved}
      onPick={(id) => setCurrent(levels.find((l) => l.id === id)!)}
    />
  );
}
