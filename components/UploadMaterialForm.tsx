"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { UploadCloud, FileText, X } from "lucide-react";

type Unit = { id: string; name: string };

function isPdf(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

export function UploadMaterialForm({
  classId,
  units,
  blobEnabled,
}: {
  classId: string;
  units: Unit[];
  blobEnabled: boolean;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [unitId, setUnitId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function pickFile(candidate: File | null | undefined) {
    if (!candidate) return;
    if (!isPdf(candidate)) {
      setError("Only PDF files are supported");
      return;
    }
    setError(null);
    setFile(candidate);
  }

  function clearFile() {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setSubmitting(true);
    setError(null);
    try {
      if (blobEnabled) {
        const blob = await upload(file.name, file, {
          access: "public",
          handleUploadUrl: "/api/materials/blob-upload",
        });
        const res = await fetch("/api/materials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            classId,
            unitId: unitId || null,
            originalName: file.name,
            blobUrl: blob.url,
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Upload failed");
        }
      } else {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("classId", classId);
        if (unitId) formData.append("unitId", unitId);
        const res = await fetch("/api/materials", { method: "POST", body: formData });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Upload failed");
        }
      }
      clearFile();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          pickFile(e.dataTransfer.files?.[0]);
        }}
        onClick={() => !file && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 text-center transition-colors ${
          file ? "cursor-default" : "cursor-pointer"
        } ${
          dragging
            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10"
            : "border-black/20 dark:border-white/20 hover:border-black/30 dark:hover:border-white/30"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          onChange={(e) => pickFile(e.target.files?.[0])}
          className="absolute inset-0 opacity-0 cursor-pointer"
          tabIndex={-1}
        />
        {file ? (
          <div className="flex items-center gap-2 text-sm relative z-10">
            <FileText className="size-4 text-black/50 dark:text-white/50" />
            <span className="font-medium">{file.name}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                clearFile();
              }}
              className="text-black/40 hover:text-red-600 dark:text-white/40 dark:hover:text-red-400"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <>
            <UploadCloud className="size-6 text-black/40 dark:text-white/40" />
            <p className="text-sm text-black/60 dark:text-white/60">
              <span className="font-medium text-indigo-600">Click to upload</span> or drag and drop a PDF
            </p>
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
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
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  );
}
