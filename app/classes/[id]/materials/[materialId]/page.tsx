import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { GenerateButton } from "@/components/GenerateButton";
import { ArrowLeft } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-black/5 text-black/60 dark:bg-white/10 dark:text-white/60",
  PROCESSING: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  DONE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  ERROR: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
};

export default async function MaterialDetailPage({
  params,
}: {
  params: Promise<{ id: string; materialId: string }>;
}) {
  const { id, materialId } = await params;

  const material = await prisma.material.findUnique({
    where: { id: materialId },
    include: {
      unit: true,
      flashcards: { include: { concept: true }, orderBy: { createdAt: "asc" } },
      quizQuestions: { include: { concept: true }, orderBy: { createdAt: "asc" } },
    },
  });

  if (!material || material.classId !== id) notFound();

  return (
    <div className="space-y-6">
      <Link href={`/classes/${id}`} className="flex items-center gap-1 text-sm text-indigo-600 hover:underline w-fit">
        <ArrowLeft className="size-3.5" /> Back to class
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{material.originalName}</h1>
          <p className="text-sm text-black/50 dark:text-white/50 mt-1">
            {material.unit?.name ?? "No unit"} &middot; uploaded{" "}
            {material.uploadedAt.toLocaleDateString()}
          </p>
        </div>
        <span className={`text-xs px-2 py-1 rounded shrink-0 ${STATUS_STYLES[material.status]}`}>
          {material.status}
        </span>
      </div>

      {material.status === "ERROR" && (
        <div className="border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 rounded-lg p-4 text-sm text-red-700 dark:text-red-400">
          <p className="mb-2">{material.errorMessage ?? "Something went wrong."}</p>
          <GenerateButton materialId={material.id} retry />
        </div>
      )}

      {material.status === "PENDING" && (
        <div className="border border-dashed rounded-lg p-6 text-center space-y-3">
          <p className="text-sm text-black/60 dark:text-white/60">
            Text was extracted from this PDF. Generate flashcards and quiz questions from it with AI.
          </p>
          <div className="flex justify-center">
            <GenerateButton materialId={material.id} />
          </div>
        </div>
      )}

      {material.status === "PROCESSING" && (
        <p className="text-sm text-black/60 dark:text-white/60 border border-dashed rounded-lg p-6 text-center">
          Generating flashcards and quiz questions&hellip;
        </p>
      )}

      {material.status === "DONE" && (
        <div className="space-y-8">
          <section>
            <h2 className="font-medium mb-3">Flashcards ({material.flashcards.length})</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {material.flashcards.map((f) => (
                <div key={f.id} className="border border-black/10 dark:border-white/10 rounded-lg p-3 bg-white dark:bg-white/5">
                  {f.concept && (
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                      {f.concept.name}
                    </span>
                  )}
                  <p className="text-sm font-medium mt-2">{f.front}</p>
                  <p className="text-sm text-black/60 dark:text-white/60 mt-1">{f.back}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-medium mb-3">Quiz questions ({material.quizQuestions.length})</h2>
            <div className="space-y-3">
              {material.quizQuestions.map((q) => {
                const choices = JSON.parse(q.choices) as string[];
                return (
                  <div key={q.id} className="border border-black/10 dark:border-white/10 rounded-lg p-3 bg-white dark:bg-white/5">
                    {q.concept && (
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                        {q.concept.name}
                      </span>
                    )}
                    <p className="text-sm font-medium mt-2">{q.question}</p>
                    <ul className="mt-2 space-y-1">
                      {choices.map((choice, i) => (
                        <li
                          key={i}
                          className={`text-sm px-2 py-1 rounded ${
                            i === q.answerIndex
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                              : "text-black/70 dark:text-white/70"
                          }`}
                        >
                          {choice}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
