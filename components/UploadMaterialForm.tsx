"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud } from "lucide-react";

type Unit = { id: string; name: string };

export function UploadMaterialForm({ classId, units }: { classId: string; units: Unit[] }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [unitId, setUnitId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("classId", classId);
      if (unitId) formData.append("unitId", unitId);
      const res = await fetch("/api/materials", { method: "POST", body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Upload failed");
      }
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-dashed border-black/20 dark:border-white/20 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-3"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="text-sm flex-1"
      />
      <select
        value={unitId}
        onChange={(e) => setUnitId(e.target.value)}
        className="rounded-md border border-black/15 dark:border-white/15 bg-transparent px-2 py-1.5 text-sm outline-none"
      >
        <option value="">No unit yet (name from file)</option>
        {units.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={!file || submitting}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors shrink-0"
      >
        <UploadCloud className="size-4" />
        {submitting ? "Uploading..." : "Upload PDF"}
      </button>
      {error && <p className="text-xs text-red-600 basis-full">{error}</p>}
    </form>
  );
}
