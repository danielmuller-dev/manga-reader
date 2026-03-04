"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const KINDS = ["IMAGES", "TEXT"] as const;
type Kind = (typeof KINDS)[number];

const READ_MODES = ["SCROLL", "PAGINATED"] as const;
type ReadMode = (typeof READ_MODES)[number];

type CreateChapterPayload =
  | {
      kind: "IMAGES";
      number: number | null;
      title: string | null;
      readMode: ReadMode;
      pages: string[];
    }
  | {
      kind: "TEXT";
      number: number | null;
      title: string | null;
      textContent: string;
    };

type UploadResponse = { urls: string[]; error?: string };

function toNullableNumber(value: string): number | null {
  const s = value.trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function toNullableString(value: string): string | null {
  const s = value.trim();
  return s.length ? s : null;
}

function parseUrlsFromTextarea(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function NewChapterForm({
  workId,
  workSlug,
}: {
  workId: string;
  workSlug: string;
}) {
  const router = useRouter();

  const [msg, setMsg] = useState<string | null>(null);

  const [kind, setKind] = useState<Kind>("IMAGES");
  const [readMode, setReadMode] = useState<ReadMode>("SCROLL");
  const [number, setNumber] = useState<string>("");
  const [title, setTitle] = useState<string>("");

  // Fallback (URLs coladas)
  const [pagesText, setPagesText] = useState<string>(""); // 1 URL por linha

  // Upload Blob
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);

  // Novel
  const [novelText, setNovelText] = useState<string>("");

  const totalSelected = selectedFiles.length;
  const totalUploaded = uploadedUrls.length;

  const canUpload = kind === "IMAGES" && totalSelected > 0 && !uploading;

  const pagesPreviewCount = useMemo(() => {
    if (kind !== "IMAGES") return 0;
    if (uploadedUrls.length > 0) return uploadedUrls.length;
    return parseUrlsFromTextarea(pagesText).length;
  }, [kind, uploadedUrls, pagesText]);

  function resetImagesState() {
    setSelectedFiles([]);
    setUploadedUrls([]);
    setPagesText("");
  }

  function onChangeKind(nextKind: Kind) {
    setKind(nextKind);
    setMsg(null);

    if (nextKind === "IMAGES") {
      setNovelText("");
    } else {
      resetImagesState();
    }
  }

  async function uploadSelectedFiles() {
    if (!canUpload) return;

    setMsg(null);
    setUploading(true);

    try {
      const form = new FormData();
      for (const file of selectedFiles) form.append("files", file);

      const res = await fetch("/api/upload/chapter", {
        method: "POST",
        body: form,
      });

      const data = (await res.json().catch(() => null)) as UploadResponse | null;

      if (!res.ok) {
        const error = data?.error || "Erro ao enviar imagens.";
        setMsg(error);
        return;
      }

      const urls = Array.isArray(data?.urls) ? data?.urls : [];
      if (urls.length === 0) {
        setMsg("Upload não retornou URLs.");
        return;
      }

      setUploadedUrls(urls);
      // opcional: limpar textarea para evitar confusão
      setPagesText("");
    } catch (err) {
      console.error("Upload failed:", err);
      setMsg("Erro ao enviar imagens. Veja o terminal.");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const chapterNumber = toNullableNumber(number);
    if (number.trim() && chapterNumber === null) {
      setMsg("Número inválido. Use apenas número (ex: 1, 2, 10.5).");
      return;
    }

    const chapterTitle = toNullableString(title);

    let payload: CreateChapterPayload;

    if (kind === "IMAGES") {
      const pages =
        uploadedUrls.length > 0 ? uploadedUrls : parseUrlsFromTextarea(pagesText);

      if (pages.length === 0) {
        setMsg("Envie pelo menos 1 página (upload) ou cole URLs (uma por linha).");
        return;
      }

      payload = {
        kind: "IMAGES",
        title: chapterTitle,
        number: chapterNumber,
        readMode,
        pages,
      };
    } else {
      const textContent = novelText.trim();
      if (!textContent) {
        setMsg("Digite o texto do capítulo.");
        return;
      }

      payload = {
        kind: "TEXT",
        title: chapterTitle,
        number: chapterNumber,
        textContent,
      };
    }

    const res = await fetch(`/api/works/${workId}/chapters`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setMsg(data.error || "Erro ao criar capítulo.");
      return;
    }

    router.push(`/works/${workSlug}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded-xl border bg-white p-4 shadow-sm"
    >
      <div>
        <label className="text-sm font-medium">Tipo do capítulo</label>
        <select
          className="w-full border rounded-md p-2"
          value={kind}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "IMAGES" || v === "TEXT") onChangeKind(v);
          }}
        >
          <option value="IMAGES">IMAGES (mangá/webtoon)</option>
          <option value="TEXT">TEXT (novel)</option>
        </select>
      </div>

      {kind === "IMAGES" && (
        <div>
          <label className="text-sm font-medium">Modo de leitura</label>
          <select
            className="w-full border rounded-md p-2"
            value={readMode}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "SCROLL" || v === "PAGINATED") setReadMode(v);
            }}
          >
            <option value="SCROLL">SCROLL</option>
            <option value="PAGINATED">PAGINATED</option>
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium">Número (opcional)</label>
          <input
            className="w-full border rounded-md p-2"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="ex: 1"
            inputMode="decimal"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Título (opcional)</label>
          <input
            className="w-full border rounded-md p-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ex: O começo"
          />
        </div>
      </div>

      {kind === "IMAGES" ? (
        <div className="space-y-2">
          <div className="rounded-lg border p-3 bg-gray-50">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium">Upload de páginas</div>
                <div className="text-xs opacity-70">
                  Selecione várias imagens e clique em “Enviar páginas”.
                </div>
              </div>

              <button
                type="button"
                onClick={() => resetImagesState()}
                className="text-xs underline"
              >
                Limpar
              </button>
            </div>

            <div className="mt-3 space-y-2">
              <input
                type="file"
                multiple
                accept="image/*"
                className="block w-full text-sm"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  setSelectedFiles(files);
                  setUploadedUrls([]);
                  setMsg(null);
                }}
              />

              <div className="flex items-center gap-2 text-xs opacity-80">
                <span>Selecionadas: {totalSelected}</span>
                <span>•</span>
                <span>Enviadas: {totalUploaded}</span>
                <span>•</span>
                <span>Preview: {pagesPreviewCount} página(s)</span>
              </div>

              <button
                type="button"
                disabled={!canUpload}
                onClick={uploadSelectedFiles}
                className="rounded-md bg-black px-3 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? "Enviando..." : "Enviar páginas"}
              </button>

              {uploadedUrls.length > 0 ? (
                <div className="text-xs text-green-700">
                  Upload concluído! {uploadedUrls.length} página(s) pronta(s) para salvar.
                </div>
              ) : (
                <div className="text-xs opacity-70">
                  Alternativa (fallback): cole URLs públicas abaixo (1 por linha).
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">
              URLs das páginas (fallback, 1 por linha)
            </label>
            <textarea
              className="w-full border rounded-md p-2"
              rows={6}
              value={pagesText}
              onChange={(e) => {
                setPagesText(e.target.value);
                if (e.target.value.trim().length > 0) setUploadedUrls([]);
              }}
              placeholder={"https://...\nhttps://...\nhttps://..."}
            />
          </div>
        </div>
      ) : (
        <div>
          <label className="text-sm font-medium">Texto do capítulo (novel)</label>
          <textarea
            className="w-full border rounded-md p-2"
            rows={10}
            value={novelText}
            onChange={(e) => setNovelText(e.target.value)}
          />
        </div>
      )}

      <button
        className="w-full bg-black text-white rounded-md p-2 hover:opacity-90"
        type="submit"
        disabled={uploading}
      >
        Criar capítulo
      </button>

      {msg && <p className="text-sm text-red-600">{msg}</p>}
    </form>
  );
}