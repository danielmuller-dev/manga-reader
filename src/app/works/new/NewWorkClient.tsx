"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const TYPES = ["MANGA", "MANHWA", "MANHUA", "WEBTOON", "NOVEL"] as const;
type WorkType = (typeof TYPES)[number];

function isWorkType(v: string): v is WorkType {
  return (TYPES as readonly string[]).includes(v);
}

function slugify(input: string): string {
  const s = input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return s;
}

type CreateWorkResponse = { work?: { id: string; slug: string } } | { error?: string };

export default function NewWorkClient() {
  const router = useRouter();

  const [title, setTitle] = useState<string>("");
  const [slug, setSlug] = useState<string>("");
  const [type, setType] = useState<WorkType>("MANGA");
  const [description, setDescription] = useState<string>("");
  const [coverUrl, setCoverUrl] = useState<string>("");
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  // auto slug: só preenche automaticamente se o usuário ainda não digitou um slug
  useEffect(() => {
    const auto = slugify(title);
    setSlug((prev) => (prev.trim().length ? prev : auto));
  }, [title]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);

    const cleanTitle = title.trim();
    const cleanSlug = slugify(slug);

    if (!cleanTitle) {
      setMsg("Título é obrigatório.");
      return;
    }

    if (!cleanSlug) {
      setMsg("Slug é obrigatório.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/works", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: cleanTitle,
          slug: cleanSlug,
          type,
          description: description.trim().length ? description.trim() : null,
          coverUrl: coverUrl.trim().length ? coverUrl.trim() : null,
        }),
      });

      const data = (await res.json().catch(() => ({} as CreateWorkResponse))) as CreateWorkResponse;

      if (!res.ok) {
        const error = "error" in data ? data.error : undefined;
        setMsg(error || "Erro ao criar obra.");
        return;
      }

      router.push("/works");
      router.refresh();
    } catch {
      setMsg("Falha de rede ao criar obra.");
    } finally {
      setSaving(false);
    }
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
              placeholder="Ex: Martial Peak"
              required
              disabled={saving}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Slug</label>
            <input
              className="w-full border rounded-md p-2"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="ex: martial-peak"
              required
              disabled={saving}
            />
            <div className="mt-1 text-xs text-gray-500">
              URL ficará: <span className="font-mono">/works/{slugify(slug || title)}</span>
            </div>
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
              disabled={saving}
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
              placeholder="Descrição da obra..."
              disabled={saving}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Capa (URL)</label>
            <input
              className="w-full border rounded-md p-2"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="https://..."
              disabled={saving}
            />
          </div>

          <button
            className="w-full bg-black text-white rounded-md p-2 hover:opacity-90 disabled:opacity-60"
            type="submit"
            disabled={saving}
          >
            {saving ? "Criando..." : "Criar obra"}
          </button>

          {msg ? <p className="text-sm text-red-600">{msg}</p> : null}
        </form>
      </div>
    </main>
  );
}