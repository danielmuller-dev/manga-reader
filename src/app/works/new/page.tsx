"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const TYPES = ["MANGA", "MANHWA", "MANHUA", "WEBTOON", "NOVEL"] as const;
type WorkType = (typeof TYPES)[number];

function isWorkType(v: string): v is WorkType {
  return (TYPES as readonly string[]).includes(v);
}

export default function NewWorkPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<WorkType>("MANGA");
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const res = await fetch("/api/works", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        type,
        description: description || null,
        coverUrl: coverUrl || null,
      }),
    });

    const data = await res.json().catch(() => ({} as { error?: string }));
    if (!res.ok) return setMsg(data.error || "Erro ao criar obra.");

    router.push("/works");
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 text-gray-900">
      <div className="max-w-lg mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Nova obra</h1>
          <Link className="underline" href="/works">
            Voltar
          </Link>
        </div>

        <form onSubmit={onSubmit} className="space-y-3 rounded-xl border bg-white p-4 shadow-sm">
          <div>
            <label className="text-sm font-medium">Título</label>
            <input
              className="w-full border rounded-md p-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Tipo</label>
            <select
              className="w-full border rounded-md p-2"
              value={type}
              onChange={(e) => {
                const v = e.target.value;
                if (isWorkType(v)) setType(v);
              }}
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Descrição</label>
            <textarea
              className="w-full border rounded-md p-2"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Capa (URL)</label>
            <input
              className="w-full border rounded-md p-2"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
            />
          </div>

          <button className="w-full bg-black text-white rounded-md p-2 hover:opacity-90" type="submit">
            Criar obra
          </button>

          {msg && <p className="text-sm text-red-600">{msg}</p>}
        </form>
      </div>
    </main>
  );
}