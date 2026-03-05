"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";

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
      scanlatorId?: string | null;
    }
  | {
      kind: "TEXT";
      number: number | null;
      title: string | null;
      textContent: string;
      scanlatorId?: string | null;
    };

type UploadResponse = { urls: string[]; error?: string };

type ScanlatorItem = { id: string; slug: string; name: string };
type ScanlatorsResponse = { scanlators: ScanlatorItem[] } | { error: string };

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

type UploadItem = {
  id: string;
  file: File;
  previewUrl: string;
};

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function moveInArray<T>(arr: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex === toIndex) return arr;
  if (fromIndex < 0 || toIndex < 0) return arr;
  if (fromIndex >= arr.length || toIndex >= arr.length) return arr;

  const copy = [...arr];
  const [moved] = copy.splice(fromIndex, 1);
  copy.splice(toIndex, 0, moved);
  return copy;
}

async function readJsonSafe<T>(res: Response): Promise<T | null> {
  try {
    const data = (await res.json()) as T;
    return data;
  } catch {
    return null;
  }
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
  const [pagesText, setPagesText] = useState<string>("");

  // Upload Blob
  const [items, setItems] = useState<UploadItem[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // DnD reorder state (items e uploadedUrls)
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropId, setDropId] = useState<string | null>(null);

  // Dropzone state
  const [isOverDropzone, setIsOverDropzone] = useState<boolean>(false);

  // Novel
  const [novelText, setNovelText] = useState<string>("");

  // ✅ scanlators permitidas para esta obra (se retornar, mostramos o select)
  const [scanlators, setScanlators] = useState<ScanlatorItem[]>([]);
  const [scanlatorId, setScanlatorId] = useState<string>(""); // "" = auto
  const [scanlatorsLoaded, setScanlatorsLoaded] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const totalSelected = items.length;
  const totalUploaded = uploadedUrls.length;

  const canUpload = kind === "IMAGES" && totalSelected > 0 && !uploading;

  const pagesPreviewCount = useMemo(() => {
    if (kind !== "IMAGES") return 0;
    if (uploadedUrls.length > 0) return uploadedUrls.length;
    if (items.length > 0) return items.length;
    return parseUrlsFromTextarea(pagesText).length;
  }, [kind, uploadedUrls, items.length, pagesText]);

  const showScanlatorSelect = scanlatorsLoaded && scanlators.length > 0;

  // Carrega scanlators permitidas para essa obra (SCAN/ADMIN)
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`/api/works/${workId}/scanlators`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        const data = await readJsonSafe<ScanlatorsResponse>(res);

        if (cancelled) return;

        if (!res.ok || !data) {
          setScanlators([]);
          setScanlatorsLoaded(true);
          return;
        }

        if ("error" in data) {
          setScanlators([]);
          setScanlatorsLoaded(true);
          return;
        }

        const list = Array.isArray(data.scanlators) ? data.scanlators : [];
        setScanlators(list);
        setScanlatorsLoaded(true);

        // Se tiver só 1, já seleciona automaticamente (evita scan errada)
        if (list.length === 1) {
          setScanlatorId(list[0].id);
        }
      } catch {
        if (cancelled) return;
        setScanlators([]);
        setScanlatorsLoaded(true);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [workId]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      for (const it of items) URL.revokeObjectURL(it.previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetImagesState() {
    for (const it of items) URL.revokeObjectURL(it.previewUrl);

    setItems([]);
    setUploadedUrls([]);
    setPagesText("");
    setUploadProgress(0);
    setDragId(null);
    setDropId(null);
    setIsOverDropzone(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
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

  function addFiles(newFiles: File[]) {
    if (newFiles.length === 0) return;

    const imageFiles = newFiles.filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length === 0) {
      setMsg("Selecione apenas arquivos de imagem.");
      return;
    }

    const nextItems: UploadItem[] = imageFiles.map((file) => ({
      id: makeId(),
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setItems((prev) => [...prev, ...nextItems]);
    setUploadedUrls([]);
    setPagesText("");
    setMsg(null);
    setUploadProgress(0);
  }

  function removeItem(id: string) {
    setItems((prev) => {
      const target = prev.find((x) => x.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((x) => x.id !== id);
    });
    setUploadedUrls([]);
    setUploadProgress(0);
    setMsg(null);
  }

  function moveItem(fromId: string, toId: string) {
    if (fromId === toId) return;

    setItems((prev) => {
      const fromIndex = prev.findIndex((x) => x.id === fromId);
      const toIndex = prev.findIndex((x) => x.id === toId);
      if (fromIndex < 0 || toIndex < 0) return prev;

      const copy = [...prev];
      const [moved] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, moved);
      return copy;
    });

    setUploadedUrls([]);
    setUploadProgress(0);
    setMsg(null);
  }

  function moveUploadedUrl(fromIndex: number, toIndex: number) {
    setUploadedUrls((prev) => moveInArray(prev, fromIndex, toIndex));
    setMsg(null);
  }

  async function uploadSelectedFiles() {
    if (!canUpload) return;

    setMsg(null);
    setUploading(true);
    setUploadProgress(0);

    try {
      const form = new FormData();
      for (const it of items) form.append("files", it.file);

      const xhr = new XMLHttpRequest();

      const result = await new Promise<UploadResponse>((resolve, reject) => {
        xhr.open("POST", "/api/upload", true);

        xhr.upload.onprogress = (evt) => {
          if (!evt.lengthComputable) return;
          const pct = clamp(Math.round((evt.loaded / evt.total) * 100), 0, 100);
          setUploadProgress(pct);
        };

        xhr.onload = () => {
          const ok = xhr.status >= 200 && xhr.status < 300;

          let parsed: UploadResponse | null = null;
          try {
            parsed = JSON.parse(xhr.responseText) as UploadResponse;
          } catch {
            parsed = null;
          }

          if (!ok) {
            resolve({
              urls: [],
              error: parsed?.error || `Erro ao enviar imagens (HTTP ${xhr.status}).`,
            });
            return;
          }

          resolve(parsed ?? { urls: [], error: "Resposta inválida do servidor." });
        };

        xhr.onerror = () => reject(new Error("Falha de rede no upload."));
        xhr.onabort = () => reject(new Error("Upload cancelado."));

        xhr.send(form);
      });

      if (result.error) {
        setMsg(result.error);
        return;
      }

      const urls = Array.isArray(result.urls) ? result.urls : [];
      if (urls.length === 0) {
        setMsg("Upload não retornou URLs.");
        return;
      }

      setUploadedUrls(urls);
      setPagesText("");
      setUploadProgress(100);
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

    const scanlatorIdToSend = showScanlatorSelect
      ? scanlatorId.trim()
        ? scanlatorId.trim()
        : null
      : null;

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
        scanlatorId: scanlatorIdToSend,
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
        scanlatorId: scanlatorIdToSend,
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
    router.refresh();
  }

  const showReorderHint =
    kind === "IMAGES" &&
    ((items.length > 1 && uploadedUrls.length === 0) || uploadedUrls.length > 1);

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      void onSubmit(e);
    }} 
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
          disabled={uploading}
        >
          <option value="IMAGES">IMAGES (mangá/webtoon)</option>
          <option value="TEXT">TEXT (novel)</option>
        </select>
      </div>

      {showScanlatorSelect && (
        <div>
          <label className="text-sm font-medium">Postar como (Scanlator)</label>
          <select
            className="w-full border rounded-md p-2"
            value={scanlatorId}
            onChange={(e) => setScanlatorId(e.target.value)}
            disabled={uploading}
          >
            <option value="">Automático</option>
            {scanlators.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.slug})
              </option>
            ))}
          </select>
          <div className="text-xs opacity-70 mt-1">
            Se você for membro de mais de uma scan vinculada à obra, escolha aqui para evitar postar na scan errada.
          </div>
        </div>
      )}

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
            disabled={uploading}
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
            disabled={uploading}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Título (opcional)</label>
          <input
            className="w-full border rounded-md p-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ex: O começo"
            disabled={uploading}
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
                  Selecione várias imagens ou arraste e solte. Depois reordene e clique em “Enviar páginas”.
                  Após o upload, você pode reordenar as URLs enviadas antes de salvar.
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  resetImagesState();
                }}
                className="text-xs underline"
                disabled={uploading}
              >
                Limpar
              </button>
            </div>

            <div className="mt-3 space-y-3">
              <div
                className={[
                  "rounded-lg border border-dashed p-4 transition",
                  isOverDropzone ? "bg-black/5 border-black" : "bg-white",
                ].join(" ")}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (!uploading) setIsOverDropzone(true);
                }}
                onDragLeave={() => setIsOverDropzone(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsOverDropzone(false);
                  if (uploading) return;
                  addFiles(Array.from(e.dataTransfer.files ?? []));
                }}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm">
                    <div className="font-medium">Arraste e solte aqui</div>
                    <div className="text-xs opacity-70">ou clique para selecionar (apenas imagens)</div>
                  </div>

                  <button
                    type="button"
                    className="rounded-md bg-black px-3 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={uploading}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    Selecionar arquivos
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    addFiles(Array.from(e.target.files ?? []));
                    e.target.value = "";
                  }}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs opacity-80">
                <span>Selecionadas: {totalSelected}</span>
                <span>•</span>
                <span>Enviadas: {totalUploaded}</span>
                <span>•</span>
                <span>Preview: {pagesPreviewCount} página(s)</span>
                {showReorderHint && (
                  <>
                    <span>•</span>
                    <span>Arraste as miniaturas para ordenar</span>
                  </>
                )}
              </div>

              {uploadedUrls.length === 0 && items.length > 0 && (
                <div className="rounded-lg border bg-white p-3">
                  <div className="text-sm font-medium">Preview (ordem das páginas)</div>
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {items.map((it, idx) => (
                      <div
                        key={it.id}
                        draggable={!uploading}
                        onDragStart={() => {
                          if (uploading) return;
                          setDragId(it.id);
                          setDropId(null);
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          if (uploading) return;
                          setDropId(it.id);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (uploading) return;
                          if (dragId) moveItem(dragId, it.id);
                          setDragId(null);
                          setDropId(null);
                        }}
                        onDragEnd={() => {
                          setDragId(null);
                          setDropId(null);
                        }}
                        className={[
                          "relative overflow-hidden rounded-md border bg-gray-50",
                          dropId === it.id && dragId && dragId !== it.id ? "ring-2 ring-black" : "",
                          uploading ? "opacity-70" : "",
                        ].join(" ")}
                        title={`Página ${idx + 1}: ${it.file.name}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={it.previewUrl} alt={it.file.name} className="h-28 w-full object-cover" />
                        <div className="flex items-center justify-between gap-2 p-1">
                          <span className="text-[11px] opacity-70">#{idx + 1}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              removeItem(it.id);
                            }}
                            disabled={uploading}
                            className="text-[11px] underline disabled:opacity-50"
                          >
                            remover
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {uploadedUrls.length > 0 && (
                <div className="rounded-lg border bg-white p-3">
                  <div className="text-sm font-medium">Páginas enviadas (ordem final)</div>
                  <div className="text-xs opacity-70">
                    Você pode reordenar aqui também (isso será salvo no capítulo).
                  </div>

                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {uploadedUrls.map((url, idx) => {
                      const id = `u-${idx}`;
                      return (
                        <div
                          key={id}
                          draggable={!uploading}
                          onDragStart={() => {
                            if (uploading) return;
                            setDragId(id);
                            setDropId(null);
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            if (uploading) return;
                            setDropId(id);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (uploading) return;
                            if (!dragId || !dragId.startsWith("u-")) return;

                            const fromIndex = Number(dragId.slice(2));
                            if (Number.isInteger(fromIndex)) {
                              moveUploadedUrl(fromIndex, idx);
                            }

                            setDragId(null);
                            setDropId(null);
                          }}
                          onDragEnd={() => {
                            setDragId(null);
                            setDropId(null);
                          }}
                          className={[
                            "relative overflow-hidden rounded-md border bg-gray-50",
                            dropId === id && dragId && dragId !== id ? "ring-2 ring-black" : "",
                            uploading ? "opacity-70" : "",
                          ].join(" ")}
                          title={`Página ${idx + 1}`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={`Página ${idx + 1}`} className="h-28 w-full object-cover" />
                          <div className="p-1">
                            <span className="text-[11px] opacity-70">#{idx + 1}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <button
                  type="button"
                  disabled={!canUpload}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    void uploadSelectedFiles();
                  }}
                  className="rounded-md bg-black px-3 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? `Enviando... (${uploadProgress}%)` : "Enviar páginas"}
                </button>

                {uploading && (
                  <div className="w-full">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                      <div className="h-2 bg-black transition-[width]" style={{ width: `${uploadProgress}%` }} />
                    </div>
                    <div className="mt-1 text-xs opacity-70">Progresso do upload: {uploadProgress}%</div>
                  </div>
                )}

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
          </div>

          <div>
            <label className="text-sm font-medium">URLs das páginas (fallback, 1 por linha)</label>
            <textarea
              className="w-full border rounded-md p-2"
              rows={6}
              value={pagesText}
              onChange={(e) => {
                setPagesText(e.target.value);
                if (e.target.value.trim().length > 0) {
                  setUploadedUrls([]);
                  setUploadProgress(0);
                }
              }}
              placeholder={"https://...\nhttps://...\nhttps://..."}
              disabled={uploading}
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
            disabled={uploading}
          />
        </div>
      )}

      <button
        className="w-full bg-black text-white rounded-md p-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        type="submit"
        disabled={uploading}
      >
        Criar capítulo
      </button>

      {msg && <p className="text-sm text-red-600">{msg}</p>}
    </form>
  );
}