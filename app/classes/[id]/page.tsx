import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CreateUnitForm } from "@/components/CreateUnitForm";
import { UploadMaterialForm } from "@/components/UploadMaterialForm";
import { GenerateButton } from "@/components/GenerateButton";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { AssignmentManager } from "@/components/AssignmentManager";
import { FileText, GraduationCap } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-black/5 text-black/60 dark:bg-white/10 dark:text-white/60",
  PROCESSING: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  DONE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  ERROR: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
};

export default async function ClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const cls = await prisma.class.findUnique({
    where: { id },
    include: {
      units: {
        orderBy: { order: "asc" },
        include: { concepts: true, _count: { select: { flashcards: true } } },
      },
      materials: { orderBy: { uploadedAt: "desc" }, include: { unit: true } },
      assignments: { orderBy: { dueDate: "asc" } },
    },
  });

  if (!cls) notFound();

  const assignments = cls.assignments.map((a) => ({
    ...a,
    dueDate: a.dueDate ? a.dueDate.toISOString() : null,
    class: { id: cls.id, name: cls.name, color: cls.color },
  }));

  return (
    <div className="space-y-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full" style={{ backgroundColor: cls.color }} />
            <h1 className="text-2xl font-semibold">{cls.name}</h1>
          </div>
          {cls.term && <p className="text-black/60 dark:text-white/60 mt-1">{cls.term}</p>}
        </div>
        <div className="flex items-center gap-3">
          {cls.units.length > 0 && (
            <Link
              href={`/classes/${cls.id}/study`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700 transition-colors"
            >
              <GraduationCap className="size-4" /> Study
            </Link>
          )}
          <ConfirmDeleteButton
            url={`/api/classes/${cls.id}`}
            confirmMessage="Delete this class and all of its units, materials, flashcards, and assignments?"
            redirectTo="/classes"
          />
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium">Units &amp; concepts</h2>
          <CreateUnitForm classId={cls.id} />
        </div>
        {cls.units.length === 0 ? (
          <p className="text-sm text-black/50 dark:text-white/50 border border-dashed rounded-lg p-6 text-center">
            No units yet. Add one, or upload a PDF below and one will be created for you.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {cls.units.map((u) => (
              <div key={u.id} className="border border-black/10 dark:border-white/10 rounded-lg p-3 bg-white dark:bg-white/5">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{u.name}</p>
                  <span className="text-xs text-black/50 dark:text-white/50">
                    {u._count.flashcards} cards
                  </span>
                </div>
                {u.concepts.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {u.concepts.map((c) => (
                      <span
                        key={c.id}
                        className="text-[11px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
                      >
                        {c.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-medium mb-3">Materials</h2>
        <div className="space-y-3">
          <UploadMaterialForm
            classId={cls.id}
            units={cls.units.map((u) => ({ id: u.id, name: u.name }))}
            blobEnabled={Boolean(process.env.BLOB_READ_WRITE_TOKEN)}
          />
          {cls.materials.length === 0 ? (
            <p className="text-sm text-black/50 dark:text-white/50 border border-dashed rounded-lg p-6 text-center">
              No materials uploaded yet.
            </p>
          ) : (
            <ul className="divide-y divide-black/10 dark:divide-white/10 border border-black/10 dark:border-white/10 rounded-lg overflow-hidden">
              {cls.materials.map((m) => (
                <li key={m.id} className="flex flex-wrap items-center gap-3 px-4 py-3 bg-white dark:bg-white/5">
                  <FileText className="size-4 text-black/40 dark:text-white/40 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <Link href={`/classes/${cls.id}/materials/${m.id}`} className="text-sm font-medium hover:underline truncate block">
                      {m.originalName}
                    </Link>
                    <p className="text-xs text-black/50 dark:text-white/50">
                      {m.unit?.name ?? "No unit"}
                    </p>
                  </div>
                  <span className={`text-[11px] px-1.5 py-0.5 rounded shrink-0 ${STATUS_STYLES[m.status]}`}>
                    {m.status}
                  </span>
                  {(m.status === "PENDING" || m.status === "ERROR") && (
                    <GenerateButton materialId={m.id} retry={m.status === "ERROR"} />
                  )}
                  <ConfirmDeleteButton url={`/api/materials/${m.id}`} confirmMessage="Delete this material and its generated cards?" />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section>
        <h2 className="font-medium mb-3">Assignments</h2>
        <AssignmentManager
          assignments={assignments}
          classes={[{ id: cls.id, name: cls.name, color: cls.color }]}
          fixedClassId={cls.id}
        />
      </section>
    </div>
  );
}
