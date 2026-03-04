"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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

  // MVP: input via URL
  const [pagesText, setPagesText] = useState<string>(""); // 1 URL por linha
  const [novelText, setNovelText] = useState<string>("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    let payload: CreateChapterPayload;

    if (kind === "IMAGES") {
      const pages = pagesText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      if (pages.length === 0) {
        setMsg("Cole pelo menos 1 URL de imagem (uma por linha).");
        return;
      }

      payload = {
        kind: "IMAGES",
        title: title ? title : null,
        number: number ? Number(number) : null,
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
        title: title ? title : null,
        number: number ? Number(number) : null,
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
    <form onSubmit={onSubmit} className="space-y-3 rounded-xl border bg-white p-4 shadow-sm">
      <div>
        <label className="text-sm font-medium">Tipo do capítulo</label>
        <select
          className="w-full border rounded-md p-2"
          value={kind}
          onChange={(e) => setKind(e.target.value as Kind)}
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
            onChange={(e) => setReadMode(e.target.value as ReadMode)}
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
        <div>
          <label className="text-sm font-medium">URLs das páginas (1 por linha)</label>
          <textarea
            className="w-full border rounded-md p-2"
            rows={7}
            value={pagesText}
            onChange={(e) => setPagesText(e.target.value)}
            placeholder={"https://...\nhttps://...\nhttps://..."}
          />
          <p className="text-xs opacity-70 mt-1">
            MVP: cole URLs públicas das imagens. Depois a gente faz upload.
          </p>
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

      <button className="w-full bg-black text-white rounded-md p-2 hover:opacity-90" type="submit">
        Criar capítulo
      </button>

      {msg && <p className="text-sm text-red-600">{msg}</p>}
    </form>
  );
}