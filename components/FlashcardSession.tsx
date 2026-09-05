"use client";

import { useMemo, useRef, useState } from "react";
import { RotateCcw, Check, X } from "lucide-react";

type Flashcard = {
  id: string;
  front: string;
  back: string;
  concept: { name: string } | null;
};

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const MAX_REQUEUES = 2;

export function FlashcardSession({ cards }: { cards: Flashcard[] }) {
  const cardsById = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);
  const [queue, setQueue] = useState<string[]>(() => shuffle(cards.map((c) => c.id)));
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState<Map<string, "known" | "learning">>(new Map());
  const repeatCounts = useRef<Record<string, number>>({});

  const currentId = queue[0];
  const current = currentId ? cardsById.get(currentId) : undefined;
  const done = queue.length === 0;

  async function recordProgress(flashcardId: string, correct: boolean) {
    try {
      await fetch("/api/study/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flashcardId, correct }),
      });
    } catch {
      // best-effort; study session continues regardless
    }
  }

  function handleAnswer(correct: boolean) {
    if (!currentId) return;
    recordProgress(currentId, correct);
    setResults((prev) => new Map(prev).set(currentId, correct ? "known" : "learning"));
    setQueue((prev) => {
      const [, ...rest] = prev;
      if (!correct) {
        const count = repeatCounts.current[currentId] ?? 0;
        if (count < MAX_REQUEUES) {
          repeatCounts.current[currentId] = count + 1;
          rest.push(currentId);
        }
      }
      return rest;
    });
    setFlipped(false);
  }

  function restart() {
    repeatCounts.current = {};
    setResults(new Map());
    setQueue(shuffle(cards.map((c) => c.id)));
    setFlipped(false);
  }

  if (cards.length === 0) {
    return (
      <p className="text-sm text-black/50 dark:text-white/50 border border-dashed rounded-lg p-6 text-center">
        No flashcards found for this selection.
      </p>
    );
  }

  if (done) {
    const knownCount = Array.from(results.values()).filter((v) => v === "known").length;
    return (
      <div className="border border-black/10 dark:border-white/10 rounded-lg p-8 text-center space-y-4 bg-white dark:bg-white/5">
        <h2 className="text-xl font-semibold">Session complete</h2>
        <p className="text-black/60 dark:text-white/60">
          {knownCount} of {cards.length} cards marked as known.
        </p>
        <button
          onClick={restart}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700 transition-colors"
        >
          <RotateCcw className="size-4" /> Study again
        </button>
      </div>
    );
  }

  const totalUnique = cards.length;
  const remainingUnique = new Set(queue).size;
  const progressPct = Math.round(((totalUnique - remainingUnique) / totalUnique) * 100);

  return (
    <div className="space-y-4">
      <div className="h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
        <div className="h-full bg-indigo-600 transition-all" style={{ width: `${progressPct}%` }} />
      </div>
      <p className="text-xs text-black/50 dark:text-white/50 text-center">
        {remainingUnique} card{remainingUnique === 1 ? "" : "s"} remaining
      </p>

      <button
        onClick={() => setFlipped((f) => !f)}
        className="w-full min-h-64 border border-black/10 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center justify-center p-8 text-center gap-3"
      >
        {current?.concept && (
          <span className="text-[11px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
            {current.concept.name}
          </span>
        )}
        <p className="text-lg font-medium">{flipped ? current?.back : current?.front}</p>
        <span className="text-xs text-black/40 dark:text-white/40">
          {flipped ? "Answer — click to flip back" : "Click to reveal answer"}
        </span>
      </button>

      {flipped && (
        <div className="flex justify-center gap-3">
          <button
            onClick={() => handleAnswer(false)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors text-sm font-medium"
          >
            <X className="size-4" /> Still learning
          </button>
          <button
            onClick={() => handleAnswer(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors text-sm font-medium"
          >
            <Check className="size-4" /> Got it
          </button>
        </div>
      )}
    </div>
  );
}
