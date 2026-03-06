"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
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

type CreateWorkResponse =
  | { work?: { id: string; slug: string } }
  | { error?: string };

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

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [type, setType] = useState<WorkType>("MANGA");
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [coverFileName, setCoverFileName] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const auto = slugify(title);
    setSlug((prev) => (prev.trim().length ? prev : auto));
  }, [title]);

  const previewSlug = useMemo(() => slugify(slug || title), [slug, title]);

  async function handleCoverUpload(file: File) {
    const form = new FormData();
    form.append("file", file);

    setUploading(true);
    setMsg(null);
    setCoverFileName(file.name);

    try {
      const res = await fetch("/api/upload/cover", {
        method: "POST",
        body: form,
      });

      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };

      if (!res.ok) {
        setMsg(data.error || "Erro no upload da capa.");
        return;
      }

      setCoverUrl(data.url || "");
    } catch {
      setMsg("Falha no upload da capa.");
    } finally {
      setUploading(false);
    }
  }

  function onSelectCover(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    void handleCoverUpload(file);

    // permite selecionar o mesmo arquivo novamente depois
    e.target.value = "";
  }

  function removeCover() {
    setCoverUrl("");
    setCoverFileName("");
  }

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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: cleanTitle,
          slug: cleanSlug,
          type,
          description: description.trim() || null,
          coverUrl: coverUrl || null,
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
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold text-white">Nova obra</h1>
            <p className="text-sm text-white/70 mt-1">
              Cadastre uma obra com título, tipo e capa.
            </p>
          </div>

          <Link className="btn-secondary" href="/works">
            ← Voltar
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <form onSubmit={onSubmit} className="card p-5 space-y-4 lg:col-span-7">
            {msg ? (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {msg}
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70">
                Dica: o <span className="font-medium text-white/85">slug</span> vira a URL da obra.
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm text-white/80">Título</label>
              <input
                className={inputGlass()}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Martial Peak"
                disabled={saving || uploading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-white/80">Slug</label>
              <input
                className={inputGlass()}
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="martial-peak"
                disabled={saving || uploading}
              />
              <div className="text-xs text-white/50">
                URL: /works/{previewSlug || "..."}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-white/80">Tipo</label>
              <select
                className={selectGlass()}
                value={type}
                disabled={saving || uploading}
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

            <div className="space-y-2">
              <label className="text-sm text-white/80">Descrição</label>
              <textarea
                rows={5}
                className={textareaGlass()}
                value={description}
                disabled={saving || uploading}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição da obra..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-white/80">Capa</label>

              <input
                id="cover-upload"
                type="file"
                accept="image/*"
                disabled={uploading || saving}
                onChange={onSelectCover}
                className="hidden"
              />

              <label
                htmlFor="cover-upload"
                className={[
                  "flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3 transition",
                  "border-white/10 bg-white/5 hover:bg-white/10",
                  uploading || saving ? "opacity-60 cursor-not-allowed" : "",
                ].join(" ")}
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white">
                    {uploading ? "Enviando capa..." : "Escolher imagem da capa"}
                  </div>
                  <div className="text-xs text-white/50 truncate">
                    {coverFileName
                      ? coverFileName
                      : "PNG, JPG ou WEBP • clique para selecionar"}
                  </div>
                </div>

                <div className="shrink-0 rounded-lg border border-white/10 bg-white/10 px-3 py-1.5 text-xs text-white/80">
                  {uploading ? "Upload..." : "Selecionar"}
                </div>
              </label>

              <div className="flex items-center justify-between gap-3 text-xs text-white/45">
                <span>A capa será enviada automaticamente para o storage do projeto.</span>

                {coverUrl ? (
                  <button
                    type="button"
                    onClick={removeCover}
                    className="text-red-300 hover:text-red-200 transition"
                    disabled={uploading || saving}
                  >
                    Remover capa
                  </button>
                ) : null}
              </div>
            </div>

            <button className="btn-primary w-full" disabled={saving || uploading}>
              {saving ? "Criando..." : uploading ? "Aguardando upload..." : "Criar obra"}
            </button>
          </form>

          <div className="lg:col-span-5 space-y-4">
            <div className="card p-5">
              <div className="flex justify-between items-center">
                <div className="text-sm text-white/70">Preview</div>
                <span className="chip">{type}</span>
              </div>

              <div className="flex gap-4 mt-4">
                <div className="w-28 h-40 rounded-xl border border-white/10 overflow-hidden bg-black/30">
                  {coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={coverUrl}
                      alt="Capa"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    surfaceCoverFallback()
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-xs text-white/50">{type}</div>

                  <div className="text-lg font-semibold text-white line-clamp-2">
                    {title || "Título da obra"}
                  </div>

                  <div className="text-xs text-white/40 mt-1">
                    /works/{previewSlug || "..."}
                  </div>

                  <div className="text-sm text-white/70 mt-3 line-clamp-5 whitespace-pre-wrap">
                    {description || "Descrição aparecerá aqui."}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
              <div className="font-medium text-white/85">Boas práticas</div>
              <ul className="mt-2 list-disc pl-5 space-y-1 text-white/70">
                <li>Use título limpo, sem extras de capítulo.</li>
                <li>Prefira slug curto e sem acentos.</li>
                <li>Use uma capa vertical em boa qualidade.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}