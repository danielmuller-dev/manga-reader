"use client";

import { useEffect, useMemo, useState } from "react";

type Tag = { id: string; slug: string; name: string };

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default function TagManagerClient({ workId }: { workId: string }) {
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [workTags, setWorkTags] = useState<Tag[]>([]);
  const [selectedTagId, setSelectedTagId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function loadAllTags() {
    const res = await fetch("/api/tags", { cache: "no-store" });
    const data = (await res.json()) as { items?: Tag[] };
    setAllTags(Array.isArray(data.items) ? data.items : []);
  }

  async function loadWorkTags() {
    const res = await fetch(`/api/works/${workId}/tags`, { cache: "no-store" });
    const data = (await res.json()) as { items?: Tag[] };
    setWorkTags(Array.isArray(data.items) ? data.items : []);
  }

  async function load() {
    setLoading(true);
    setMsg(null);
    try {
      await Promise.all([loadAllTags(), loadWorkTags()]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [workId]);

  const available = useMemo(() => {
    const used = new Set(workTags.map((t) => t.id));
    return allTags.filter((t) => !used.has(t.id));
  }, [allTags, workTags]);

  async function addTag() {
    setMsg(null);
    if (!selectedTagId) {
      setMsg("Selecione uma tag.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/works/${workId}/tags`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tagId: selectedTagId }),
      });

      if (!res.ok) {
        setMsg("Erro ao adicionar tag (verifique sua permissão).");
        return;
      }

      const data = (await res.json()) as { items?: Tag[] };
      setWorkTags(Array.isArray(data.items) ? data.items : []);
      setSelectedTagId("");
      setMsg("Tag adicionada!");
    } finally {
      setLoading(false);
    }
  }

  async function removeTag(tagId: string) {
    setMsg(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/works/${workId}/tags`, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tagId }),
      });

      if (!res.ok) {
        setMsg("Erro ao remover tag (verifique sua permissão).");
        return;
      }

      const data = (await res.json()) as { items?: Tag[] };
      setWorkTags(Array.isArray(data.items) ? data.items : []);
    } finally {
      setLoading(false);
    }
  }

  const msgStyle = useMemo(() => {
    if (!msg) return null;
    if (msg === "Tag adicionada!") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
    if (msg === "Selecione uma tag.") return "border-white/10 bg-white/5 text-white/80";
    if (msg.toLowerCase().includes("erro")) return "border-red-500/30 bg-red-500/10 text-red-200";
    return "border-white/10 bg-white/5 text-white/80";
  }, [msg]);

  return (
    <div className="space-y-4">
      {/* Tags da obra */}
      <div className="card p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-white/90">Tags da obra</div>
            <p className="muted mt-1 text-sm">Clique em uma tag para remover.</p>
          </div>

          <button
            type="button"
            onClick={() => void load()}
            className="btn-secondary"
            disabled={loading}
            title="Atualizar"
          >
            {loading ? "Atualizando..." : "Atualizar"}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {workTags.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => void removeTag(t.id)}
              className={cx(
                "chip",
                "hover:opacity-90 active:opacity-80",
                loading && "opacity-60"
              )}
              title="Clique para remover"
              disabled={loading}
            >
              {t.name} <span className="opacity-70">✕</span>
            </button>
          ))}

          {workTags.length === 0 && !loading ? (
            <span className="muted text-sm">Nenhuma tag nesta obra.</span>
          ) : null}
        </div>
      </div>

      {/* Adicionar tag */}
      <div className="card p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-white/90">Adicionar tag</div>
            <p className="muted mt-1 text-sm">
              Dica: crie tags em <span className="font-medium text-white/85">/admin/tags</span>.
            </p>
          </div>

          <span className="chip">{available.length} disponíveis</span>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <select
            value={selectedTagId}
            onChange={(e) => setSelectedTagId(e.target.value)}
            className={cx(
              "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm",
              "text-white outline-none",
              "focus:ring-2 focus:ring-white/20"
            )}
            disabled={loading}
          >
            <option value="">Selecione...</option>
            {available.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => void addTag()}
            className={cx("btn-primary", loading && "opacity-70")}
            disabled={loading}
          >
            {loading ? "Aguarde..." : "Adicionar"}
          </button>
        </div>

        {msg ? (
          <div className={cx("mt-3 rounded-xl border p-3 text-xs", msgStyle ?? "")}>{msg}</div>
        ) : null}
      </div>
    </div>
  );
}