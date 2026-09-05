"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Layers, ListChecks } from "lucide-react";

type Concept = { id: string; name: string };
type Unit = { id: string; name: string; concepts: Concept[]; _count: { flashcards: number } };

export function StudySetupForm({ classId, units }: { classId: string; units: Unit[] }) {
  const router = useRouter();
  const [selectedUnitIds, setSelectedUnitIds] = useState<Set<string>>(new Set());
  const [selectedConceptIds, setSelectedConceptIds] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<"flashcards" | "quiz">("flashcards");

  const totalCards = useMemo(
    () => units.reduce((sum, u) => sum + u._count.flashcards, 0),
    [units],
  );

  function toggleUnit(unitId: string) {
    setSelectedUnitIds((prev) => {
      const next = new Set(prev);
      if (next.has(unitId)) next.delete(unitId);
      else next.add(unitId);
      return next;
    });
    const unit = units.find((u) => u.id === unitId);
    if (unit) {
      setSelectedConceptIds((prev) => {
        const next = new Set(prev);
        unit.concepts.forEach((c) => next.delete(c.id));
        return next;
      });
    }
  }

  function toggleConcept(conceptId: string) {
    setSelectedConceptIds((prev) => {
      const next = new Set(prev);
      if (next.has(conceptId)) next.delete(conceptId);
      else next.add(conceptId);
      return next;
    });
  }

  function selectAll() {
    setSelectedUnitIds(new Set(units.map((u) => u.id)));
    setSelectedConceptIds(new Set());
  }

  function clearAll() {
    setSelectedUnitIds(new Set());
    setSelectedConceptIds(new Set());
  }

  function start() {
    const params = new URLSearchParams({ classId, mode });
    if (selectedConceptIds.size > 0) {
      params.set("conceptIds", Array.from(selectedConceptIds).join(","));
    } else if (selectedUnitIds.size > 0) {
      params.set("unitIds", Array.from(selectedUnitIds).join(","));
    }
    router.push(`/study/session?${params.toString()}`);
  }

  const hasSelection = selectedUnitIds.size > 0 || selectedConceptIds.size > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-black/60 dark:text-white/60">
          Pick one unit to focus on, a few units for exam prep, or specific concepts within a unit.
        </p>
        <div className="flex gap-2 text-xs">
          <button onClick={selectAll} className="text-indigo-600 hover:underline">
            Select all ({totalCards} cards)
          </button>
          <span className="text-black/30">&middot;</span>
          <button onClick={clearAll} className="text-indigo-600 hover:underline">
            Clear
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {units.map((unit) => (
          <div key={unit.id} className="border border-black/10 dark:border-white/10 rounded-lg p-3">
            <label className="flex items-center gap-2 font-medium text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={selectedUnitIds.has(unit.id)}
                onChange={() => toggleUnit(unit.id)}
                className="size-4 accent-indigo-600"
              />
              {unit.name}
              <span className="text-xs font-normal text-black/50 dark:text-white/50">
                ({unit._count.flashcards} cards)
              </span>
            </label>
            {unit.concepts.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2 ml-6">
                {unit.concepts.map((c) => (
                  <label
                    key={c.id}
                    className={`text-xs px-2 py-1 rounded-full border cursor-pointer transition-colors ${
                      selectedConceptIds.has(c.id)
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "border-black/15 dark:border-white/20 text-black/60 dark:text-white/60"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedConceptIds.has(c.id)}
                      onChange={() => toggleConcept(c.id)}
                      className="sr-only"
                    />
                    {c.name}
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex rounded-md border border-black/15 dark:border-white/15 overflow-hidden text-sm">
          <button
            onClick={() => setMode("flashcards")}
            className={`flex items-center gap-1.5 px-3 py-1.5 ${
              mode === "flashcards" ? "bg-indigo-600 text-white" : "hover:bg-black/5 dark:hover:bg-white/10"
            }`}
          >
            <Layers className="size-4" /> Flashcards
          </button>
          <button
            onClick={() => setMode("quiz")}
            className={`flex items-center gap-1.5 px-3 py-1.5 ${
              mode === "quiz" ? "bg-indigo-600 text-white" : "hover:bg-black/5 dark:hover:bg-white/10"
            }`}
          >
            <ListChecks className="size-4" /> Quiz
          </button>
        </div>
        <button
          onClick={start}
          disabled={!hasSelection}
          className="px-4 py-1.5 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-40 transition-colors"
        >
          Start studying
        </button>
      </div>
    </div>
  );
}
