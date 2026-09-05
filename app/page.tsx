import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CalendarClock, BookOpen, ArrowRight, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

function formatDueDate(date: Date | null) {
  if (!date) return "No due date";
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const label = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  if (diffDays < 0) return { label: `${label} (overdue)`, overdue: true };
  if (diffDays === 0) return { label: `${label} (today)`, overdue: false };
  if (diffDays === 1) return { label: `${label} (tomorrow)`, overdue: false };
  return { label, overdue: false };
}

export default async function DashboardPage() {
  const [upcoming, classes] = await Promise.all([
    prisma.assignment.findMany({
      where: { status: { not: "DONE" } },
      orderBy: [{ dueDate: "asc" }],
      take: 8,
      include: { class: { select: { id: true, name: true, color: true } } },
    }),
    prisma.class.findMany({
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { flashcards: true, assignments: true } } },
    }),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-black/60 dark:text-white/60 mt-1">
          Your schoolwork and study material at a glance.
        </p>
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium flex items-center gap-2">
            <CalendarClock className="size-4" /> Upcoming assignments
          </h2>
          <Link href="/assignments" className="text-sm text-indigo-600 hover:underline">
            View all
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="text-sm text-black/50 dark:text-white/50 border border-dashed rounded-lg p-6 text-center">
            No assignments yet. Add one from a class page.
          </p>
        ) : (
          <ul className="divide-y divide-black/10 dark:divide-white/10 border border-black/10 dark:border-white/10 rounded-lg overflow-hidden">
            {upcoming.map((a) => {
              const due = formatDueDate(a.dueDate);
              const dueLabel = typeof due === "string" ? due : due.label;
              const overdue = typeof due === "string" ? false : due.overdue;
              return (
                <li key={a.id} className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-white/5">
                  <span
                    className="size-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: a.class.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{a.title}</p>
                    <p className="text-xs text-black/50 dark:text-white/50">{a.class.name}</p>
                  </div>
                  <span
                    className={`text-xs flex items-center gap-1 shrink-0 ${
                      overdue ? "text-red-600" : "text-black/60 dark:text-white/60"
                    }`}
                  >
                    {overdue && <AlertCircle className="size-3.5" />}
                    {dueLabel}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium flex items-center gap-2">
            <BookOpen className="size-4" /> Your classes
          </h2>
          <Link href="/classes" className="text-sm text-indigo-600 hover:underline">
            Manage classes
          </Link>
        </div>
        {classes.length === 0 ? (
          <p className="text-sm text-black/50 dark:text-white/50 border border-dashed rounded-lg p-6 text-center">
            No classes yet.{" "}
            <Link href="/classes" className="text-indigo-600 hover:underline">
              Create your first class
            </Link>
            .
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
                <p className="text-xs text-black/50 dark:text-white/50">
                  {c._count.flashcards} flashcards &middot; {c._count.assignments} assignments
                </p>
                <div className="mt-3 flex items-center gap-1 text-xs text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  Open <ArrowRight className="size-3.5" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
