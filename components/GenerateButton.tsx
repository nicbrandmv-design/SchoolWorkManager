"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

export function GenerateButton({ materialId, retry }: { materialId: string; retry?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/materials/${materialId}/generate`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Generation failed");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleClick}
        disabled={busy}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-600 text-white text-xs hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        <Sparkles className="size-3.5" />
        {busy ? "Generating..." : retry ? "Retry generation" : "Generate flashcards"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
