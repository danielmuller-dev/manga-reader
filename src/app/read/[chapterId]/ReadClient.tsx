"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type Chapter = {
  id: string;
  number: number | null;
  title: string | null;
  kind: "IMAGES" | "TEXT";
  readMode: "SCROLL" | "PAGINATED" | null;
  work: { id: string; slug: string; title: string };
  pages: { index: number; imageUrl: string }[];
  text: { content: string } | null;
};

type ChapterApiResponse = { chapter?: Chapter; error?: string };

type NavData = {
  work?: { slug: string; title: string };
  prevChapterId?: string | null;
  nextChapterId?: string | null;
  error?: string;
};

export default function ReadClient({ chapterId }: { chapterId: string }) {
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [err, setErr] = useState<string | null>(null);

  const [pageIdx, setPageIdx] = useState<number>(0);

  const [prevChapterId, setPrevChapterId] = useState<string | null>(null);
  const [nextChapterId, setNextChapterId] = useState<string | null>(null);

  const pendingScrollY = useRef<number | null>(null);
  const didRestoreScroll = useRef(false);

  const lastSaved = useRef<{ pageIdx: number; scrollY: number }>({
    pageIdx: -1,
    scrollY: -1,
  });

  const initialParams = useMemo(() => {
    if (typeof window === "undefined")
      return { p: null as number | null, s: null as number | null };
    const sp = new URLSearchParams(window.location.search);
    const pRaw = sp.get("p");
    const sRaw = sp.get("s");
    const p = pRaw != null ? Number(pRaw) : null;
    const s = sRaw != null ? Number(sRaw) : null;
    return {
      p: Number.isFinite(p as number) ? (p as number) : null,
      s: Number.isFinite(s as number) ? (s as number) : null,
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      await Promise.resolve();

      setLoading(true);
      setErr(null);

      setPrevChapterId(null);
      setNextChapterId(null);

      try {
        const r = await fetch(`/api/chapters/${chapterId}`, { cache: "no-store" });
        const raw = await r.text();

        if (!raw || !raw.trim()) throw new Error(`Resposta vazia (status ${r.status}).`);

        let data: ChapterApiResponse;
        try {
          data = JSON.parse(raw) as ChapterApiResponse;
        } catch {
          throw new Error(`Resposta não-JSON (status ${r.status}).`);
        }

        if (!r.ok) throw new Error(data.error || `Erro ao carregar capítulo (status ${r.status}).`);
        if (!data.chapter) throw new Error("Capítulo inválido.");

        if (cancelled) return;

        setChapter(data.chapter);

        // page inicial
        if (data.chapter.kind === "IMAGES" && data.chapter.readMode === "PAGINATED" && initialParams.p != null) {
          setPageIdx(Math.max(0, Math.min(data.chapter.pages.length - 1, initialParams.p)));
        } else {
          setPageIdx(0);
        }

        // scroll inicial
        if (initialParams.s != null) {
          pendingScrollY.current = Math.max(0, initialParams.s);
          didRestoreScroll.current = false;
        } else {
          pendingScrollY.current = null;
          didRestoreScroll.current = true;
        }

        // nav
        try {
          const navRes = await fetch(`/api/chapters/${chapterId}/nav`, { cache: "no-store" });
          const nav = (await navRes.json().catch(() => ({}))) as NavData;

          if (!cancelled && navRes.ok) {
            setPrevChapterId(nav.prevChapterId ?? null);
            setNextChapterId(nav.nextChapterId ?? null);
          }
        } catch {
          // se nav falhar, leitor continua normal
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        if (!cancelled) setErr(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [chapterId, initialParams.p, initialParams.s]);

  const headerTitle = useMemo(() => {
    if (!chapter) return "Carregando...";
    const num = chapter.number != null ? `Cap. ${chapter.number}` : "Capítulo";
    return `${chapter.work.title} • ${num}${chapter.title ? ` - ${chapter.title}` : ""}`;
  }, [chapter]);

  async function saveProgress(mode: "SCROLL" | "PAGINATED", pageIndex?: number | null, scrollY?: number | null) {
    if (!chapter) return;

    await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workId: chapter.work.id,
        chapterId: chapter.id,
        mode,
        pageIndex: pageIndex ?? null,
        scrollY: scrollY ?? null,
      }),
    });
  }

  useEffect(() => {
    if (!chapter) return;
    if (!(chapter.kind === "IMAGES" && chapter.readMode === "PAGINATED")) return;

    if (lastSaved.current.pageIdx === pageIdx) return;
    lastSaved.current.pageIdx = pageIdx;

    void saveProgress("PAGINATED", pageIdx, null);
  }, [pageIdx, chapter]);

  useEffect(() => {
    if (!chapter) return;

    const isScrollMode =
      (chapter.kind === "IMAGES" && chapter.readMode !== "PAGINATED") || chapter.kind === "TEXT";

    if (!isScrollMode) return;

    const t = setInterval(() => {
      const y = Math.floor(window.scrollY || 0);
      if (lastSaved.current.scrollY === y) return;
      lastSaved.current.scrollY = y;

      void saveProgress("SCROLL", null, y);
    }, 2000);

    return () => clearInterval(t);
  }, [chapter]);

  useEffect(() => {
    if (!chapter) return;
    if (didRestoreScroll.current) return;

    const y = pendingScrollY.current;
    if (y == null) {
      didRestoreScroll.current = true;
      return;
    }

    const t = setTimeout(() => {
      window.scrollTo({ top: y, left: 0, behavior: "auto" });
      didRestoreScroll.current = true;
    }, 300);

    return () => clearTimeout(t);
  }, [chapter]);

  useEffect(() => {
    if (!chapter) return;

    const paginated = chapter.kind === "IMAGES" && chapter.readMode === "PAGINATED";
    const totalPages = chapter.pages.length;

    function goPrevPage() {
      setPageIdx((p) => Math.max(0, p - 1));
    }
    function goNextPage() {
      setPageIdx((p) => Math.min(Math.max(0, totalPages - 1), p + 1));
    }
    function goPrevChapter() {
      if (prevChapterId) window.location.href = `/read/${prevChapterId}`;
    }
    function goNextChapter() {
      if (nextChapterId) window.location.href = `/read/${nextChapterId}`;
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;

      if (e.shiftKey) {
        e.preventDefault();
        if (e.key === "ArrowLeft") goPrevChapter();
        if (e.key === "ArrowRight") goNextChapter();
        return;
      }

      if (!paginated) return;

      e.preventDefault();
      if (e.key === "ArrowLeft") goPrevPage();
      if (e.key === "ArrowRight") goNextPage();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [chapter, prevChapterId, nextChapterId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-6 text-gray-900">
        <p>Carregando...</p>
      </main>
    );
  }

  if (err || !chapter) {
    return (
      <main className="min-h-screen bg-gray-50 p-6 text-gray-900 space-y-3">
        <p className="text-red-600">{err || "Capítulo não encontrado."}</p>
        <Link className="underline" href="/works">
          Voltar
        </Link>
      </main>
    );
  }

  const backHref = `/works/${chapter.work.slug}`;
  const paginated = chapter.kind === "IMAGES" && chapter.readMode === "PAGINATED";
  const totalPages = chapter.pages.length;
  const currentPage = chapter.pages[pageIdx];

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <div className="sticky top-0 z-10 border-b bg-white">
        <div className="max-w-4xl mx-auto p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 shrink-0">
            <Link className="underline" href={backHref}>
              ← Obra
            </Link>

            <div className="hidden sm:flex items-center gap-2">
              <Link
                className={`border rounded-md px-2 py-1 ${
                  !prevChapterId ? "opacity-40 pointer-events-none" : "hover:bg-gray-50"
                }`}
                href={prevChapterId ? `/read/${prevChapterId}` : "#"}
                aria-disabled={!prevChapterId}
                title="Capítulo anterior (Shift+←)"
              >
                ⟵ Anterior
              </Link>

              <Link
                className={`border rounded-md px-2 py-1 ${
                  !nextChapterId ? "opacity-40 pointer-events-none" : "hover:bg-gray-50"
                }`}
                href={nextChapterId ? `/read/${nextChapterId}` : "#"}
                aria-disabled={!nextChapterId}
                title="Próximo capítulo (Shift+→)"
              >
                Próximo ⟶
              </Link>
            </div>
          </div>

          <div className="text-sm font-medium truncate">{headerTitle}</div>

          {paginated ? (
            <div className="flex items-center gap-2 shrink-0">
              <button
                className="border rounded-md px-2 py-1 disabled:opacity-40"
                disabled={pageIdx <= 0}
                onClick={() => setPageIdx((p) => Math.max(0, p - 1))}
                title="Página anterior (←)"
              >
                ◀
              </button>

              <span className="text-xs opacity-70">
                {totalPages === 0 ? "0/0" : `${pageIdx + 1}/${totalPages}`}
              </span>

              <button
                className="border rounded-md px-2 py-1 disabled:opacity-40"
                disabled={pageIdx >= totalPages - 1}
                onClick={() => setPageIdx((p) => Math.min(totalPages - 1, p + 1))}
                title="Próxima página (→)"
              >
                ▶
              </button>
            </div>
          ) : (
            <span className="text-xs opacity-70 shrink-0">{chapter.kind}</span>
          )}
        </div>

        <div className="sm:hidden border-t bg-white">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
            <Link
              className={`border rounded-md px-3 py-2 text-sm ${
                !prevChapterId ? "opacity-40 pointer-events-none" : "hover:bg-gray-50"
              }`}
              href={prevChapterId ? `/read/${prevChapterId}` : "#"}
              aria-disabled={!prevChapterId}
            >
              ⟵ Anterior
            </Link>

            <Link
              className={`border rounded-md px-3 py-2 text-sm ${
                !nextChapterId ? "opacity-40 pointer-events-none" : "hover:bg-gray-50"
              }`}
              href={nextChapterId ? `/read/${nextChapterId}` : "#"}
              aria-disabled={!nextChapterId}
            >
              Próximo ⟶
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {chapter.kind === "TEXT" && (
          <article className="bg-white border rounded-xl p-4 shadow-sm whitespace-pre-wrap leading-relaxed">
            {chapter.text?.content || "Sem conteúdo."}
          </article>
        )}

        {chapter.kind === "IMAGES" && !paginated && (
          <div className="space-y-3">
            {chapter.pages.map((p) => (
              <div key={p.index} className="bg-white border rounded-xl overflow-hidden shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.imageUrl} alt={`Página ${p.index + 1}`} className="w-full h-auto" />
              </div>
            ))}
            {chapter.pages.length === 0 && <p className="opacity-70">Sem páginas.</p>}
          </div>
        )}

        {chapter.kind === "IMAGES" && paginated && (
          <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
            {currentPage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={currentPage.imageUrl} alt={`Página ${pageIdx + 1}`} className="w-full h-auto" />
            ) : (
              <p className="p-4 opacity-70">Sem páginas.</p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-2">
          <Link
            className={`rounded-md border bg-white px-3 py-2 hover:bg-gray-50 ${
              !prevChapterId ? "opacity-40 pointer-events-none" : ""
            }`}
            href={prevChapterId ? `/read/${prevChapterId}` : "#"}
            aria-disabled={!prevChapterId}
          >
            ⟵ Capítulo anterior
          </Link>

          <Link className="underline" href={backHref}>
            Voltar pra obra
          </Link>

          <Link
            className={`rounded-md border bg-white px-3 py-2 hover:bg-gray-50 ${
              !nextChapterId ? "opacity-40 pointer-events-none" : ""
            }`}
            href={nextChapterId ? `/read/${nextChapterId}` : "#"}
            aria-disabled={!nextChapterId}
          >
            Próximo capítulo ⟶
          </Link>
        </div>

        <p className="text-xs opacity-60">
          Dica: <span className="font-medium">←/→</span> muda página (modo paginado).{" "}
          <span className="font-medium">Shift + ←/→</span> muda capítulo.
        </p>
      </div>
    </main>
  );
}