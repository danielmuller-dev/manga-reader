"use client";

import { useEffect, useMemo, useState } from "react";

type Tag = { id: string; slug: string; name: string };

export default function TagAdminClient() {
  const [name, setName] = useState("");
  const [items, setItems] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/tags", { cache: "no-store" });
      const data = (await res.json()) as { items?: Tag[] };
      setItems(Array.isArray(data.items) ? data.items : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const normalized = useMemo(() => name.trim(), [name]);

  async function createTag() {
    setMsg(null);
    const n = normalized;
    if (n.length < 2) {
      setMsg("Digite pelo menos 2 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: n }),
      });

      if (res.status === 409) {
        setMsg("Essa tag já existe.");
        return;
      }
      if (!res.ok) {
        setMsg("Erro ao criar tag.");
        return;
      }

      setName("");
      await load();
      setMsg("Tag criada!");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-white p-4">
        <div className="text-sm font-semibold">Criar nova tag</div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Ação, Romance, Isekai..."
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-gray-400"
          />
          <button
            onClick={createTag}
            className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
            disabled={loading}
          >
            Criar
          </button>
        </div>

        {msg ? <div className="mt-2 text-xs text-gray-600">{msg}</div> : null}
      </div>

      <div className="rounded-lg border bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold">Tags</div>
          <button
            onClick={load}
            className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
            disabled={loading}
          >
            Atualizar
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {items.map((t) => (
            <span
              key={t.id}
              className="rounded-full border px-3 py-1 text-xs bg-gray-50"
              title={t.slug}
            >
              {t.name}
            </span>
          ))}
          {items.length === 0 && !loading ? (
            <span className="text-sm text-gray-600">Nenhuma tag ainda.</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}