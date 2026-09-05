"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

const COLORS = ["#6366f1", "#ec4899", "#10b981", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6"];

export function CreateClassForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [term, setTerm] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, term: term || undefined, color }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to create class");
      }
      setName("");
      setTerm("");
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700 transition-colors"
      >
        <Plus className="size-4" /> New class
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-black/10 dark:border-white/10 rounded-lg p-4 bg-white dark:bg-white/5 space-y-3 max-w-md"
    >
      <div>
        <label className="block text-xs font-medium mb-1">Class name</label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. AP Biology"
          className="w-full rounded-md border border-black/15 dark:border-white/15 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-indigo-500"
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Term (optional)</label>
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="e.g. Fall 2026"
          className="w-full rounded-md border border-black/15 dark:border-white/15 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-indigo-500"
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Color</label>
        <div className="flex gap-2">
          {COLORS.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setColor(c)}
              className={`size-6 rounded-full ${color === c ? "ring-2 ring-offset-2 ring-black/40 dark:ring-white/60" : ""}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="px-3 py-1.5 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {submitting ? "Creating..." : "Create"}
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
  );
}
