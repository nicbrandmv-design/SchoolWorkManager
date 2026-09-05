"use client";

import { useState } from "react";
import { RotateCcw, CheckCircle2, XCircle } from "lucide-react";

type QuizQuestion = {
  id: string;
  question: string;
  choices: string[];
  answerIndex: number;
  explanation: string | null;
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

export function QuizSession({ questions }: { questions: QuizQuestion[] }) {
  const [order] = useState(() => shuffle(questions));
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [missed, setMissed] = useState<QuizQuestion[]>([]);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const current = order[index];
  const isCorrect = selected !== null && selected === current?.answerIndex;

  function choose(i: number) {
    if (selected !== null) return;
    setSelected(i);
    if (i === current.answerIndex) setScore((s) => s + 1);
    else setMissed((m) => [...m, current]);
  }

  function next() {
    if (index + 1 >= order.length) {
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
  }

  function restart() {
    setIndex(0);
    setSelected(null);
    setMissed([]);
    setScore(0);
    setFinished(false);
  }

  if (questions.length === 0) {
    return (
      <p className="text-sm text-black/50 dark:text-white/50 border border-dashed rounded-lg p-6 text-center">
        No quiz questions found for this selection.
      </p>
    );
  }

  if (finished) {
    return (
      <div className="space-y-6">
        <div className="border border-black/10 dark:border-white/10 rounded-lg p-8 text-center space-y-4 bg-white dark:bg-white/5">
          <h2 className="text-xl font-semibold">Quiz complete</h2>
          <p className="text-black/60 dark:text-white/60">
            Score: {score} / {order.length}
          </p>
          <button
            onClick={restart}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700 transition-colors"
          >
            <RotateCcw className="size-4" /> Retake quiz
          </button>
        </div>
        {missed.length > 0 && (
          <div>
            <h3 className="font-medium mb-2">Review missed questions</h3>
            <div className="space-y-3">
              {missed.map((q) => (
                <div key={q.id} className="border border-black/10 dark:border-white/10 rounded-lg p-3 bg-white dark:bg-white/5">
                  <p className="text-sm font-medium">{q.question}</p>
                  <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-1">
                    Correct answer: {q.choices[q.answerIndex]}
                  </p>
                  {q.explanation && (
                    <p className="text-xs text-black/50 dark:text-white/50 mt-1">{q.explanation}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
        <div
          className="h-full bg-indigo-600 transition-all"
          style={{ width: `${(index / order.length) * 100}%` }}
        />
      </div>
      <p className="text-xs text-black/50 dark:text-white/50">
        Question {index + 1} of {order.length}
      </p>

      <div className="border border-black/10 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 p-6 space-y-4">
        {current.concept && (
          <span className="text-[11px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
            {current.concept.name}
          </span>
        )}
        <p className="text-lg font-medium">{current.question}</p>
        <div className="space-y-2">
          {current.choices.map((choice, i) => {
            const isSelected = selected === i;
            const showCorrect = selected !== null && i === current.answerIndex;
            const showWrong = isSelected && !showCorrect;
            return (
              <button
                key={i}
                onClick={() => choose(i)}
                disabled={selected !== null}
                className={`w-full text-left px-4 py-2.5 rounded-md border text-sm transition-colors flex items-center justify-between gap-2 ${
                  showCorrect
                    ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : showWrong
                      ? "border-red-400 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400"
                      : "border-black/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10"
                }`}
              >
                {choice}
                {showCorrect && <CheckCircle2 className="size-4 shrink-0" />}
                {showWrong && <XCircle className="size-4 shrink-0" />}
              </button>
            );
          })}
        </div>
        {selected !== null && (
          <div className="pt-2 space-y-3">
            {current.explanation && (
              <p className={`text-sm ${isCorrect ? "text-emerald-700 dark:text-emerald-400" : "text-black/60 dark:text-white/60"}`}>
                {current.explanation}
              </p>
            )}
            <button
              onClick={next}
              className="px-4 py-1.5 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700 transition-colors"
            >
              {index + 1 >= order.length ? "Finish" : "Next question"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
