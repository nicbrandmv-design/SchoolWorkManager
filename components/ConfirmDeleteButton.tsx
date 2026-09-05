"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function ConfirmDeleteButton({
  url,
  confirmMessage,
  className,
  redirectTo,
}: {
  url: string;
  confirmMessage: string;
  className?: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    if (!window.confirm(confirmMessage)) return;
    setBusy(true);
    try {
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      if (redirectTo) router.push(redirectTo);
      router.refresh();
    } catch {
      window.alert("Failed to delete. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      className={className ?? "text-black/40 hover:text-red-600 dark:text-white/40 dark:hover:text-red-400 transition-colors disabled:opacity-50"}
      title="Delete"
    >
      <Trash2 className="size-4" />
    </button>
  );
}
