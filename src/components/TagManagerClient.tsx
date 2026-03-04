"use client";

import { useEffect, useMemo, useState } from "react";

type Tag = { id: string; slug: string; name: string };

export default function TagManagerClient({ workId }: { workId: string }) {
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [workTags, setWorkTags] = useState<Tag[]>([]);
  const [selectedTagId, setSelectedTagId] = useState<string>("");
  const [loading, setLoading] = useState(false);
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

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold">Tags da obra</div>
          <button
            onClick={load}
            className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
            disabled={loading}
          >
            Atualizar
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {workTags.map((t) => (
            <button
              key={t.id}
              onClick={() => removeTag(t.id)}
              className="rounded-full border px-3 py-1 text-xs bg-gray-50 hover:bg-gray-100"
              title="Clique para remover"
              disabled={loading}
            >
              {t.name} ✕
            </button>
          ))}
          {workTags.length === 0 && !loading ? (
            <span className="text-sm text-gray-600">Nenhuma tag nesta obra.</span>
          ) : null}
        </div>
      </div>

      <div className="rounded-lg border bg-white p-4">
        <div className="text-sm font-semibold">Adicionar tag</div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <select
            value={selectedTagId}
            onChange={(e) => setSelectedTagId(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-gray-400"
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
            onClick={addTag}
            className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
            disabled={loading}
          >
            Adicionar
          </button>
        </div>

        <div className="mt-2 text-xs text-gray-600">
          Dica: crie tags em <b>/admin/tags</b>.
        </div>

        {msg ? <div className="mt-2 text-xs text-gray-600">{msg}</div> : null}
      </div>
    </div>
  );
}