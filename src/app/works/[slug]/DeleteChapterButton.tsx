"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteChapterButton({ chapterId }: { chapterId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onDelete() {
    const ok = confirm("Tem certeza que deseja excluir este capítulo? Isso não pode ser desfeito.");
    if (!ok) return;

    setLoading(true);
    setErr(null);

    try {
      const res = await fetch(`/api/chapters/${chapterId}/delete`, { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) throw new Error(data.error || "Erro ao excluir capítulo.");

      router.refresh(); // atualiza a página server-side
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onDelete}
        disabled={loading}
        className={[
          "rounded-xl px-3 py-2 text-sm transition disabled:opacity-60",
          "border border-white/10 bg-white/5 text-white/80",
          "hover:bg-white/10 hover:text-white",
          "focus:outline-none focus:ring-2 focus:ring-white/15",
        ].join(" ")}
        title="Excluir capítulo"
      >
        {loading ? "Excluindo..." : "Excluir"}
      </button>

      {err && <span className="text-xs text-red-400">{err}</span>}
    </div>
  );
}