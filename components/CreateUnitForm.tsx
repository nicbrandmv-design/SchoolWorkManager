"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

export function CreateUnitForm({ classId }: { classId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId, name }),
      });
      if (!res.ok) throw new Error("Failed to create unit");
      setName("");
      setOpen(false);
      router.refresh();
    } catch {
      window.alert("Failed to create unit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-xs text-indigo-600 hover:underline"
      >
        <Plus className="size-3.5" /> Add unit
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder="Unit name"
        className="rounded-md border border-black/15 dark:border-white/15 bg-transparent px-2 py-1 text-xs outline-none focus:border-indigo-500"
      />
      <button
        type="submit"
        disabled={submitting}
        className="text-xs px-2 py-1 rounded-md bg-indigo-600 text-white disabled:opacity-50"
      >
        Add
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-xs text-black/50 dark:text-white/50"
      >
        Cancel
      </button>
    </form>
  );
}
