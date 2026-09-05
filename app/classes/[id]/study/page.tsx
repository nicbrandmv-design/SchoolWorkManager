import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { StudySetupForm } from "@/components/StudySetupForm";
import { ArrowLeft } from "lucide-react";

export default async function StudySetupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const cls = await prisma.class.findUnique({
    where: { id },
    include: {
      units: {
        orderBy: { order: "asc" },
        include: { concepts: true, _count: { select: { flashcards: true } } },
      },
    },
  });

  if (!cls) notFound();

  return (
    <div className="space-y-6">
      <Link href={`/classes/${cls.id}`} className="flex items-center gap-1 text-sm text-indigo-600 hover:underline w-fit">
        <ArrowLeft className="size-3.5" /> Back to class
      </Link>
      <div>
        <h1 className="text-2xl font-semibold">Study {cls.name}</h1>
      </div>
      {cls.units.length === 0 ? (
        <p className="text-sm text-black/50 dark:text-white/50 border border-dashed rounded-lg p-6 text-center">
          Upload material and generate flashcards first.
        </p>
      ) : (
        <StudySetupForm classId={cls.id} units={cls.units} />
      )}
    </div>
  );
}
