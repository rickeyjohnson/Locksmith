"use client";
import { useState } from "react";

export function Consent({ onStart }: { onStart: (nickname: string) => void }) {
  const [nickname, setNickname] = useState("");
  return (
    <div className="mx-auto max-w-xl space-y-4 p-8">
      <h1 className="text-3xl font-bold">🔐 Locksmith</h1>
      <p>
        Talk a guardian AI into revealing its password. Each level defends itself harder
        than the last.
      </p>
      <div className="space-y-2 rounded border border-amber-500/50 bg-amber-500/10 p-4 text-sm">
        <p className="font-semibold">Before you play — research data notice</p>
        <p>
          This is a class research project. Your prompts, the model&apos;s responses, and
          your attempt counts are recorded and analyzed.
        </p>
        <p>
          <strong>Do not type personal information.</strong> Every password in this game is
          fictional.
        </p>
      </div>
      <input
        className="w-full rounded border p-2"
        placeholder="Nickname (optional)"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
      />
      <button
        className="rounded bg-black px-4 py-2 text-white dark:bg-white dark:text-black"
        onClick={() => onStart(nickname)}
      >
        I understand — start
      </button>
    </div>
  );
}
