"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

type ClassRef = { id: string; name: string; color: string };
type Assignment = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  type: "HOMEWORK" | "EXAM" | "PROJECT" | "OTHER";
  class: ClassRef;
};

const PRIORITY_STYLES: Record<Assignment["priority"], string> = {
  LOW: "bg-black/5 text-black/60 dark:bg-white/10 dark:text-white/60",
  MEDIUM: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  HIGH: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
};

export function AssignmentManager({
  assignments,
  classes,
  fixedClassId,
}: {
  assignments: Assignment[];
  classes: ClassRef[];
  fixedClassId?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [classId, setClassId] = useState(fixedClassId ?? classes[0]?.id ?? "");
  const [dueDate, setDueDate] = useState("");
  const [type, setType] = useState<Assignment["type"]>("HOMEWORK");
  const [priority, setPriority] = useState<Assignment["priority"]>("MEDIUM");
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !classId) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId,
          title,
          type,
          priority,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to create assignment");
      setTitle("");
      setDueDate("");
      setOpen(false);
      router.refresh();
    } catch {
      window.alert("Failed to create assignment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function updateStatus(id: string, status: Assignment["status"]) {
    await fetch(`/api/assignments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this assignment?")) return;
    await fetch(`/api/assignments/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700 transition-colors"
        >
          <Plus className="size-4" /> Add assignment
        </button>
      ) : (
        <form
          onSubmit={handleCreate}
          className="border border-black/10 dark:border-white/10 rounded-lg p-4 bg-white dark:bg-white/5 flex flex-wrap items-end gap-3"
        >
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs font-medium mb-1">Title</label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chapter 4 problem set"
              className="w-full rounded-md border border-black/15 dark:border-white/15 bg-transparent px-2 py-1.5 text-sm outline-none focus:border-indigo-500"
            />
          </div>
          {!fixedClassId && (
            <div>
              <label className="block text-xs font-medium mb-1">Class</label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="rounded-md border border-black/15 dark:border-white/15 bg-transparent px-2 py-1.5 text-sm outline-none"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium mb-1">Due date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="rounded-md border border-black/15 dark:border-white/15 bg-transparent px-2 py-1.5 text-sm outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as Assignment["type"])}
              className="rounded-md border border-black/15 dark:border-white/15 bg-transparent px-2 py-1.5 text-sm outline-none"
            >
              <option value="HOMEWORK">Homework</option>
              <option value="EXAM">Exam</option>
              <option value="PROJECT">Project</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Assignment["priority"])}
              className="rounded-md border border-black/15 dark:border-white/15 bg-transparent px-2 py-1.5 text-sm outline-none"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-3 py-1.5 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-3 py-1.5 rounded-md text-sm text-black/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/10"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {assignments.length === 0 ? (
        <p className="text-sm text-black/50 dark:text-white/50 border border-dashed rounded-lg p-6 text-center">
          No assignments yet.
        </p>
      ) : (
        <ul className="divide-y divide-black/10 dark:divide-white/10 border border-black/10 dark:border-white/10 rounded-lg overflow-hidden">
          {assignments.map((a) => (
            <li
              key={a.id}
              className="flex flex-wrap items-center gap-3 px-4 py-3 bg-white dark:bg-white/5"
            >
              <input
                type="checkbox"
                checked={a.status === "DONE"}
                onChange={(e) => updateStatus(a.id, e.target.checked ? "DONE" : "TODO")}
                className="size-4 accent-indigo-600"
              />
              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm font-medium truncate ${
                    a.status === "DONE" ? "line-through text-black/40 dark:text-white/40" : ""
                  }`}
                >
                  {a.title}
                </p>
                {!fixedClassId && (
                  <p className="text-xs text-black/50 dark:text-white/50 flex items-center gap-1">
                    <span className="size-2 rounded-full inline-block" style={{ backgroundColor: a.class.color }} />
                    {a.class.name}
                  </p>
                )}
              </div>
              <span className={`text-[11px] px-1.5 py-0.5 rounded ${PRIORITY_STYLES[a.priority]}`}>
                {a.priority}
              </span>
              <span className="text-xs text-black/50 dark:text-white/50 w-14">{a.type}</span>
              <span className="text-xs text-black/60 dark:text-white/60 w-20 text-right">
                {a.dueDate ? new Date(a.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "—"}
              </span>
              <button
                onClick={() => remove(a.id)}
                className="text-black/30 hover:text-red-600 dark:text-white/30 dark:hover:text-red-400 text-xs"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
