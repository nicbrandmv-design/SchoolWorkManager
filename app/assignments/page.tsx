import { prisma } from "@/lib/prisma";
import { AssignmentManager } from "@/components/AssignmentManager";

export const dynamic = "force-dynamic";

export default async function AssignmentsPage() {
  const [assignments, classes] = await Promise.all([
    prisma.assignment.findMany({
      orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
      include: { class: { select: { id: true, name: true, color: true } } },
    }),
    prisma.class.findMany({ orderBy: { createdAt: "asc" }, select: { id: true, name: true, color: true } }),
  ]);

  const serialized = assignments.map((a) => ({
    ...a,
    dueDate: a.dueDate ? a.dueDate.toISOString() : null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Assignments</h1>
        <p className="text-black/60 dark:text-white/60 mt-1">
          Everything due, across all of your classes.
        </p>
      </div>

      {classes.length === 0 ? (
        <p className="text-sm text-black/50 dark:text-white/50 border border-dashed rounded-lg p-6 text-center">
          Create a class first before adding assignments.
        </p>
      ) : (
        <AssignmentManager assignments={serialized} classes={classes} />
      )}
    </div>
  );
}
