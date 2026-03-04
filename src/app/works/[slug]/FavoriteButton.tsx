"use client";

import { useEffect, useState } from "react";

export default function FavoriteButton({ workId }: { workId: string }) {
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setErr(null);

    fetch(`/api/favorites/status?workId=${encodeURIComponent(workId)}`)
      .then((r) => r.json())
      .then((d: { isFavorite?: boolean; error?: string }) => {
        if (d.error) throw new Error(d.error);
        setIsFavorite(Boolean(d.isFavorite));
      })
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, [workId]);

  async function toggle() {
    setErr(null);
    setLoading(true);

    try {
      const res = await fetch("/api/favorites/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workId }),
      });

      const data = (await res.json().catch(() => ({}))) as { isFavorite?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error || "Erro ao favoritar.");

      setIsFavorite(Boolean(data.isFavorite));
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggle}
        disabled={loading}
        className="inline-block rounded-md bg-black text-white px-3 py-2 hover:opacity-90 disabled:opacity-60"
      >
        {loading ? "..." : isFavorite ? "Remover favorito" : "Favoritar"}
      </button>

      {err && <span className="text-xs text-red-600">{err}</span>}
    </div>
  );
}