import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CreateClassForm } from "@/components/CreateClassForm";
import { ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ClassesPage() {
  const classes = await prisma.class.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { units: true, materials: true, flashcards: true, assignments: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Classes</h1>
          <p className="text-black/60 dark:text-white/60 mt-1">
            Organize your materials, units, and assignments by class.
          </p>
        </div>
      </div>

      <CreateClassForm />

      {classes.length === 0 ? (
        <p className="text-sm text-black/50 dark:text-white/50 border border-dashed rounded-lg p-6 text-center">
          No classes yet. Create one above to get started.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {classes.map((c) => (
            <Link
              key={c.id}
              href={`/classes/${c.id}`}
              className="group border border-black/10 dark:border-white/10 rounded-lg p-4 bg-white dark:bg-white/5 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="size-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                <h3 className="font-medium truncate">{c.name}</h3>
              </div>
              {c.term && <p className="text-xs text-black/50 dark:text-white/50 mb-2">{c.term}</p>}
              <p className="text-xs text-black/50 dark:text-white/50">
                {c._count.units} units &middot; {c._count.materials} materials &middot;{" "}
                {c._count.flashcards} flashcards
              </p>
              <div className="mt-3 flex items-center gap-1 text-xs text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                Open <ArrowRight className="size-3.5" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
