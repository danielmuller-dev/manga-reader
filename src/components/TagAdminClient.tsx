"use client";

import { useEffect, useMemo, useState } from "react";

type Tag = { id: string; slug: string; name: string };

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default function TagAdminClient() {
  const [name, setName] = useState<string>("");
  const [items, setItems] = useState<Tag[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
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
      {/* Create */}
      <div className="card p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-white/90">Criar nova tag</div>
            <p className="muted mt-1 text-sm">Ex: Ação, Romance, Isekai…</p>
          </div>

          <span className="chip">Tags</span>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Digite o nome da tag…"
            className={cx(
              "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm",
              "text-white placeholder:text-white/40 outline-none",
              "focus:ring-2 focus:ring-white/20"
            )}
            disabled={loading}
          />

          <button
            type="button"
            onClick={() => void createTag()}
            className={cx("btn-primary", loading && "opacity-70")}
            disabled={loading}
            title="Criar tag"
          >
            {loading ? "Criando..." : "Criar"}
          </button>
        </div>

        {msg ? (
          <div
            className={cx(
              "mt-3 rounded-xl border p-3 text-xs",
              msg === "Tag criada!"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                : "border-white/10 bg-white/5 text-white/80"
            )}
          >
            {msg}
          </div>
        ) : null}
      </div>

      {/* List */}
      <div className="card p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-white/90">Tags</div>
            <p className="muted mt-1 text-sm">{items.length} no total</p>
          </div>

          <button
            type="button"
            onClick={() => void load()}
            className="btn-secondary"
            disabled={loading}
            title="Atualizar lista"
          >
            {loading ? "Atualizando..." : "Atualizar"}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {items.map((t) => (
            <span
              key={t.id}
              className="chip"
              title={t.slug}
            >
              {t.name}
            </span>
          ))}

          {items.length === 0 && !loading ? (
            <span className="muted text-sm">Nenhuma tag ainda.</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}