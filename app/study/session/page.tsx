import Link from "next/link";
import { redirect } from "next/navigation";
import { StudySessionRunner } from "@/components/StudySessionRunner";
import { ArrowLeft } from "lucide-react";

type SearchParams = Promise<{
  classId?: string;
  unitIds?: string;
  conceptIds?: string;
  mode?: string;
}>;

export default async function StudySessionPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const { classId } = params;
  if (!classId) redirect("/classes");

  const unitIds = params.unitIds ? params.unitIds.split(",").filter(Boolean) : [];
  const conceptIds = params.conceptIds ? params.conceptIds.split(",").filter(Boolean) : [];
  const mode = params.mode === "quiz" ? "quiz" : "flashcards";

  return (
    <div className="space-y-6">
      <Link href={`/classes/${classId}/study`} className="flex items-center gap-1 text-sm text-indigo-600 hover:underline w-fit">
        <ArrowLeft className="size-3.5" /> Change scope
      </Link>
      <StudySessionRunner
        key={`${classId}:${mode}:${unitIds.join(",")}:${conceptIds.join(",")}`}
        classId={classId}
        unitIds={unitIds}
        conceptIds={conceptIds}
        mode={mode}
      />
    </div>
  );
}
