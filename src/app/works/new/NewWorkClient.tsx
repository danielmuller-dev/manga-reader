"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
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

function surfaceCoverFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center text-xs text-white/50">
      Sem capa
    </div>
  );
}

function inputGlass() {
  return [
    "w-full rounded-xl border px-3 py-2 text-sm outline-none transition",
    "border-white/10 bg-white/5 text-white placeholder:text-white/35",
    "focus:ring-2 focus:ring-white/15",
    "disabled:opacity-60 disabled:cursor-not-allowed",
  ].join(" ");
}

function textareaGlass() {
  return [
    "w-full rounded-xl border px-3 py-2 text-sm outline-none transition",
    "border-white/10 bg-white/5 text-white placeholder:text-white/35",
    "focus:ring-2 focus:ring-white/15",
    "disabled:opacity-60 disabled:cursor-not-allowed",
  ].join(" ");
}

function selectGlass() {
  return [
    "w-full rounded-xl border px-3 py-2 text-sm outline-none transition",
    "border-white/10 bg-white/5 text-white",
    "focus:ring-2 focus:ring-white/15",
    "disabled:opacity-60 disabled:cursor-not-allowed",
  ].join(" ");
}

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

  const previewSlug = useMemo(() => slugify(slug || title), [slug, title]);

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
    <div className="p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-3xl font-semibold tracking-tight text-white">Nova obra</h1>
            <p className="mt-2 text-sm text-white/70">
              Cadastre uma obra com título, tipo, descrição e capa.
            </p>
          </div>

          <Link className="btn-secondary shrink-0" href="/works">
            ← Voltar
          </Link>
        </div>

        {/* Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Form card */}
          <form onSubmit={onSubmit} className="card p-5 space-y-4 lg:col-span-7">
            {/* Alert */}
            {msg ? (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {msg}
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                Dica: o <span className="font-medium text-white/85">slug</span> vira a URL da obra.
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/85">Título</label>
              <input
                className={inputGlass()}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Martial Peak"
                required
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/85">Slug</label>
              <input
                className={inputGlass()}
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="ex: martial-peak"
                required
                disabled={saving}
              />

              <div className="text-xs text-white/55">
                URL ficará:{" "}
                <span className="font-mono text-white/75">/works/{previewSlug || "..."}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/85">Tipo</label>
              <select
                className={selectGlass()}
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

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/85">Descrição</label>
              <textarea
                className={textareaGlass()}
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição da obra..."
                disabled={saving}
              />
              <div className="text-xs text-white/45">
                Opcional, mas ajuda muito no SEO e na página da obra.
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/85">Capa (URL)</label>
              <input
                className={inputGlass()}
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="https://..."
                disabled={saving}
              />
              <div className="text-xs text-white/45">
                Se você ainda não tiver upload aqui, pode colar uma URL por enquanto.
              </div>
            </div>

            <button className="btn-primary w-full" type="submit" disabled={saving}>
              {saving ? "Criando..." : "Criar obra"}
            </button>
          </form>

          {/* Preview card */}
          <div className="lg:col-span-5 space-y-4">
            <div className="card p-5">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-white/90">Preview</div>
                <span className="chip">{type}</span>
              </div>

              <div className="mt-4 flex gap-4">
                <div className="w-28 h-40 overflow-hidden rounded-2xl border border-white/10 bg-black/30 shrink-0">
                  {coverUrl.trim() ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={coverUrl.trim()}
                      alt={title || "Capa"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    surfaceCoverFallback()
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-xs text-white/60 truncate">{type}</div>
                  <div className="mt-1 text-lg font-semibold text-white leading-tight line-clamp-2">
                    {title.trim() ? title.trim() : "Título da obra"}
                  </div>

                  <div className="mt-2 text-xs text-white/50">
                    /works/<span className="font-mono text-white/70">{previewSlug || "slug-da-obra"}</span>
                  </div>

                  <div className="mt-3 text-sm text-white/70 line-clamp-5 whitespace-pre-wrap">
                    {description.trim() ? description.trim() : "A descrição vai aparecer aqui."}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
              <div className="font-medium text-white/85">Boas práticas</div>
              <ul className="mt-2 list-disc pl-5 space-y-1 text-white/70">
                <li>Use título limpo (sem “Cap. 1”, sem extras).</li>
                <li>Slug curto e sem acentos.</li>
                <li>Descrição curta e objetiva.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}