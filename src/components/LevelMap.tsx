"use client";

export type PublicLevel = { id: number; name: string; blurb: string };

export function LevelMap({
  levels,
  solved,
  onPick,
}: {
  levels: PublicLevel[];
  solved: number[];
  onPick: (id: number) => void;
}) {
  const highestUnlocked = solved.length ? Math.max(...solved) + 1 : 1;
  return (
    <div className="mx-auto max-w-2xl space-y-3 p-8">
      <h2 className="text-2xl font-bold">Choose a lock</h2>
      {levels.map((level) => {
        const isSolved = solved.includes(level.id);
        const locked = level.id > highestUnlocked;
        return (
          <button
            key={level.id}
            disabled={locked}
            onClick={() => onPick(level.id)}
            className="flex w-full flex-wrap items-center gap-3 rounded border p-3 text-left disabled:opacity-40"
          >
            <span>{isSolved ? "🔓" : locked ? "🔒" : "🗝️"}</span>
            <span className="font-semibold">
              Level {level.id}: {level.name}
            </span>
            <span className="text-sm opacity-70">{level.blurb}</span>
          </button>
        );
      })}
    </div>
  );
}
