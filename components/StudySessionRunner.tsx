"use client";

import { useEffect, useState } from "react";
import { FlashcardSession } from "@/components/FlashcardSession";
import { QuizSession } from "@/components/QuizSession";

type FlashcardData = {
  id: string;
  front: string;
  back: string;
  concept: { name: string } | null;
};

type QuizQuestionData = {
  id: string;
  question: string;
  choices: string[];
  answerIndex: number;
  explanation: string | null;
  concept: { name: string } | null;
};

export function StudySessionRunner({
  classId,
  unitIds,
  conceptIds,
  mode,
}: {
  classId: string;
  unitIds: string[];
  conceptIds: string[];
  mode: "flashcards" | "quiz";
}) {
  const [data, setData] = useState<FlashcardData[] | QuizQuestionData[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // This component is remounted (via a `key` on the parent) whenever the study
  // scope changes, so this effect only ever needs to run once per mount.
  useEffect(() => {
    const params = new URLSearchParams({ classId });
    if (conceptIds.length) params.set("conceptIds", conceptIds.join(","));
    else if (unitIds.length) params.set("unitIds", unitIds.join(","));

    const endpoint = mode === "quiz" ? "/api/quiz" : "/api/flashcards";
    fetch(`${endpoint}?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load study material");
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Something went wrong"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return <p className="text-sm text-red-600 border border-dashed rounded-lg p-6 text-center">{error}</p>;
  }

  if (!data) {
    return (
      <p className="text-sm text-black/50 dark:text-white/50 border border-dashed rounded-lg p-6 text-center">
        Loading&hellip;
      </p>
    );
  }

  if (mode === "quiz") {
    return <QuizSession questions={data as QuizQuestionData[]} />;
  }
  return <FlashcardSession cards={data as FlashcardData[]} />;
}
