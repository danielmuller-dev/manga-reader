"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type ChapterScanlator = { id: string; slug: string; name: string };

type Chapter = {
  id: string;
  number: number | null;
  title: string | null;
  kind: "IMAGES" | "TEXT";
  readMode: "SCROLL" | "PAGINATED" | null;
  scanlator: ChapterScanlator | null;
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

function safeNumberFromQuery(value: string | null): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function formatChapterLabel(chapter: Chapter) {
  const num = chapter.number != null ? `Cap. ${chapter.number}` : "Capítulo";
  return `${num}${chapter.title ? ` — ${chapter.title}` : ""}`;
}

type ProgressMode = "SCROLL" | "PAGINATED";

export default function ReadClient({ chapterId }: { chapterId: string }) {
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [err, setErr] = useState<string | null>(null);

  const [pageIdx, setPageIdx] = useState<number>(0);

  const [prevChapterId, setPrevChapterId] = useState<string | null>(null);
  const [nextChapterId, setNextChapterId] = useState<string | null>(null);

  const pendingScrollY = useRef<number | null>(null);
  const didRestoreScroll = useRef(false);

  // lastSaved: evita re-salvar o mesmo valor
  const lastSaved = useRef<{ mode: ProgressMode | null; pageIdx: number; scrollY: number }>({
    mode: null,
    pageIdx: -1,
    scrollY: -1,
  });

  // UX: mostra/oculta topbar quando o usuário rola para baixo (modo cinema)
  const [compactTopbar, setCompactTopbar] = useState<boolean>(false);
  const lastScrollYForTopbar = useRef<number>(0);

  // Debounce timers
  const saveTimer = useRef<number | null>(null);
  const latestScrollY = useRef<number>(0);

  const initialParams = useMemo(() => {
    if (typeof window === "undefined") {
      return { p: null as number | null, s: null as number | null };
    }
    const sp = new URLSearchParams(window.location.search);
    const p = safeNumberFromQuery(sp.get("p"));
    const s = safeNumberFromQuery(sp.get("s"));
    return { p, s };
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      await Promise.resolve();

      setLoading(true);
      setErr(null);
      setPrevChapterId(null);
      setNextChapterId(null);

      // limpa estado de progresso local para evitar “carry” entre capítulos
      lastSaved.current = { mode: null, pageIdx: -1, scrollY: -1 };
      latestScrollY.current = 0;

      try {
        const r = await fetch(`/api/chapters/${chapterId}`, { cache: "no-store" });
        const raw = await r.text();

        if (!raw || !raw.trim()) {
          throw new Error(`Resposta vazia (status ${r.status}).`);
        }

        let data: ChapterApiResponse;
        try {
          data = JSON.parse(raw) as ChapterApiResponse;
        } catch {
          throw new Error(`Resposta não-JSON (status ${r.status}).`);
        }

        if (!r.ok) {
          throw new Error(data.error || `Erro ao carregar capítulo (status ${r.status}).`);
        }
        if (!data.chapter) throw new Error("Capítulo inválido.");

        if (cancelled) return;

        setChapter(data.chapter);

        // page inicial
        if (
          data.chapter.kind === "IMAGES" &&
          data.chapter.readMode === "PAGINATED" &&
          initialParams.p != null
        ) {
          setPageIdx(clamp(initialParams.p, 0, Math.max(0, data.chapter.pages.length - 1)));
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
    return formatChapterLabel(chapter);
  }, [chapter]);

  const scanlatorLabel = useMemo(() => {
    if (!chapter) return null;
    return chapter.scanlator?.name ?? null;
  }, [chapter]);

  const backHref = useMemo(() => {
    if (!chapter) return "/works";
    return `/works/${chapter.work.slug}`;
  }, [chapter]);

  const paginated = useMemo(() => {
    if (!chapter) return false;
    return chapter.kind === "IMAGES" && chapter.readMode === "PAGINATED";
  }, [chapter]);

  const isScrollMode = useMemo(() => {
    if (!chapter) return false;
    return (chapter.kind === "IMAGES" && chapter.readMode !== "PAGINATED") || chapter.kind === "TEXT";
  }, [chapter]);

  const totalPages = useMemo(() => {
    if (!chapter) return 0;
    return chapter.pages.length;
  }, [chapter]);

  const currentPage = useMemo(() => {
    if (!chapter) return null;
    return chapter.pages[pageIdx] ?? null;
  }, [chapter, pageIdx]);

  function goPrevPage() {
    setPageIdx((p) => clamp(p - 1, 0, Math.max(0, totalPages - 1)));
  }
  function goNextPage() {
    setPageIdx((p) => clamp(p + 1, 0, Math.max(0, totalPages - 1)));
  }

  function goPrevChapter() {
    if (prevChapterId) window.location.href = `/read/${prevChapterId}`;
  }
  function goNextChapter() {
    if (nextChapterId) window.location.href = `/read/${nextChapterId}`;
  }

  async function saveProgress(mode: ProgressMode, pageIndex: number | null, scrollY: number | null) {
    if (!chapter) return;

    // Evita salvar valores repetidos
    if (mode === "PAGINATED") {
      if (lastSaved.current.mode === "PAGINATED" && lastSaved.current.pageIdx === (pageIndex ?? -1)) return;
    } else {
      if (lastSaved.current.mode === "SCROLL" && lastSaved.current.scrollY === (scrollY ?? -1)) return;
    }

    // Otimista: marca como salvo localmente antes do await pra reduzir spam
    lastSaved.current.mode = mode;
    if (mode === "PAGINATED") lastSaved.current.pageIdx = pageIndex ?? -1;
    if (mode === "SCROLL") lastSaved.current.scrollY = scrollY ?? -1;

    try {
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workId: chapter.work.id,
          chapterId: chapter.id,
          mode,
          pageIndex,
          scrollY,
        }),
      });
    } catch {
      // não quebra a leitura se falhar
    }
  }

  function scheduleSave(mode: ProgressMode, pageIndex: number | null, scrollY: number | null, delayMs: number) {
    if (saveTimer.current != null) {
      window.clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    saveTimer.current = window.setTimeout(() => {
      saveTimer.current = null;
      void saveProgress(mode, pageIndex, scrollY);
    }, delayMs);
  }

  function flushSaveNow() {
    if (!chapter) return;

    if (saveTimer.current != null) {
      window.clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }

    if (paginated) {
      void saveProgress("PAGINATED", pageIdx, null);
      return;
    }

    if (isScrollMode) {
      const y = Math.floor(latestScrollY.current || window.scrollY || 0);
      void saveProgress("SCROLL", null, y);
    }
  }

  // PAGINATED: salva com debounce (melhor pra quem segura seta)
  useEffect(() => {
    if (!chapter) return;
    if (!paginated) return;

    scheduleSave("PAGINATED", pageIdx, null, 350);
    return () => {
      // não precisa limpar aqui; debounce global já é limpo no próximo schedule ou flush
    };
  }, [pageIdx, chapter, paginated]);

  // SCROLL/TEXT: salva em scroll com debounce + pausa quando aba não está visível
  useEffect(() => {
    if (!chapter) return;
    if (!isScrollMode) return;

    function onScroll() {
      // se aba não está visível, não fica salvando
      if (document.visibilityState !== "visible") return;

      const y = Math.floor(window.scrollY || 0);
      latestScrollY.current = y;

      // debounce um pouco maior pra reduzir chamadas
      scheduleSave("SCROLL", null, y, 900);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [chapter, isScrollMode]);

  // Restaura scroll inicial
  useEffect(() => {
    if (!chapter) return;
    if (didRestoreScroll.current) return;

    const y = pendingScrollY.current;
    if (y == null) {
      didRestoreScroll.current = true;
      return;
    }

    const t = window.setTimeout(() => {
      window.scrollTo({ top: y, left: 0, behavior: "auto" });
      latestScrollY.current = y;
      didRestoreScroll.current = true;
    }, 300);

    return () => window.clearTimeout(t);
  }, [chapter]);

  // Salva ao sair / trocar de aba (garante “último estado”)
  useEffect(() => {
    if (!chapter) return;

    function onVisibilityChange() {
      if (document.visibilityState === "hidden") {
        flushSaveNow();
      }
    }

    function onPageHide() {
      flushSaveNow();
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [chapter, pageIdx, paginated, isScrollMode]);

  // Atalhos de teclado (mantém o comportamento atual)
  useEffect(() => {
    if (!chapter) return;

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
  }, [chapter, paginated, prevChapterId, nextChapterId, totalPages]);

  // Modo cinema: colapsa topbar ao rolar para baixo, reabre ao rolar para cima
  useEffect(() => {
    if (!chapter) return;

    lastScrollYForTopbar.current = Math.floor(window.scrollY || 0);
    setCompactTopbar(false);

    function onScroll() {
      const y = Math.floor(window.scrollY || 0);
      const prev = lastScrollYForTopbar.current;
      lastScrollYForTopbar.current = y;

      const delta = y - prev;

      // ignora micro variação (trackpad)
      if (Math.abs(delta) < 8) return;

      if (y < 24) {
        setCompactTopbar(false);
        return;
      }

      if (delta > 0) setCompactTopbar(true); // descendo
      if (delta < 0) setCompactTopbar(false); // subindo
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [chapterId, chapter]);

  if (loading) {
    return (
      <main className="text-gray-900">
        <div className="card p-5">
          <p className="text-sm opacity-70">Carregando...</p>
        </div>
      </main>
    );
  }

  if (err || !chapter) {
    return (
      <main className="text-gray-900">
        <div className="card p-5 space-y-3">
          <p className="text-sm text-red-600">{err || "Capítulo não encontrado."}</p>
          <Link className="btn-secondary" href="/works">
            Voltar
          </Link>
        </div>
      </main>
    );
  }

  const headerSubtitle = `${chapter.work.title} • ${headerTitle}`;
  const chapterKindLabel = chapter.kind === "IMAGES" ? "IMAGENS" : "TEXTO";

  return (
    <main className="text-gray-900">
      {/* Background / cinematic glow */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-black via-zinc-950 to-black" />
      <div className="fixed inset-0 -z-10 opacity-40">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-56 left-10 h-[520px] w-[520px] rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-40 right-10 h-[520px] w-[520px] rounded-full bg-white/5 blur-3xl" />
      </div>

      {/* Reader topbar - glass */}
      <div className="sticky top-0 z-50">
        <div
          className={cx(
            "border-b border-white/10 bg-white/5 text-white backdrop-blur",
            "shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
          )}
        >
          <div
            className={cx(
              "max-w-6xl mx-auto px-4 transition-all duration-200",
              compactTopbar ? "py-2" : "py-3"
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 shrink-0">
                <Link className="btn-secondary" href={backHref} title="Voltar para a obra">
                  ← Obra
                </Link>

                <Link
                  className={cx(
                    "btn-secondary hidden sm:inline-flex",
                    !prevChapterId && "opacity-40 pointer-events-none"
                  )}
                  href={prevChapterId ? `/read/${prevChapterId}` : "#"}
                  aria-disabled={!prevChapterId}
                  title="Capítulo anterior (Shift+←)"
                >
                  ⟵ Anterior
                </Link>

                <Link
                  className={cx(
                    "btn-secondary hidden sm:inline-flex",
                    !nextChapterId && "opacity-40 pointer-events-none"
                  )}
                  href={nextChapterId ? `/read/${nextChapterId}` : "#"}
                  aria-disabled={!nextChapterId}
                  title="Próximo capítulo (Shift+→)"
                >
                  Próximo ⟶
                </Link>
              </div>

              <div className="min-w-0 flex-1">
                <div className={cx("truncate font-semibold", compactTopbar ? "text-sm" : "text-sm")}>
                  {headerSubtitle}
                </div>

                <div className={cx("truncate", compactTopbar ? "hidden" : "block")}>
                  {scanlatorLabel ? (
                    <div className="text-xs text-white/75">
                      Postado por: <span className="font-medium text-white/90">{scanlatorLabel}</span>
                    </div>
                  ) : (
                    <div className="text-xs text-white/60">Postado por: —</div>
                  )}
                </div>
              </div>

              {paginated ? (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    className="btn-secondary"
                    disabled={pageIdx <= 0}
                    onClick={goPrevPage}
                    title="Página anterior (←)"
                  >
                    ◀
                  </button>

                  <span className="text-xs text-white/75 whitespace-nowrap">
                    {totalPages === 0 ? "0/0" : `${pageIdx + 1}/${totalPages}`}
                  </span>

                  <button
                    className="btn-secondary"
                    disabled={pageIdx >= totalPages - 1}
                    onClick={goNextPage}
                    title="Próxima página (→)"
                  >
                    ▶
                  </button>
                </div>
              ) : (
                <span className="text-xs text-white/70 shrink-0">{chapterKindLabel}</span>
              )}
            </div>

            {/* Mobile chapter nav */}
            <div className={cx("sm:hidden transition-all", compactTopbar ? "hidden" : "block")}>
              <div className="mt-3 border-t border-white/10 pt-3 flex items-center justify-between gap-2">
                <Link
                  className={cx("btn-secondary", !prevChapterId && "opacity-40 pointer-events-none")}
                  href={prevChapterId ? `/read/${prevChapterId}` : "#"}
                  aria-disabled={!prevChapterId}
                >
                  ⟵ Anterior
                </Link>

                <Link
                  className={cx("btn-secondary", !nextChapterId && "opacity-40 pointer-events-none")}
                  href={nextChapterId ? `/read/${nextChapterId}` : "#"}
                  aria-disabled={!nextChapterId}
                >
                  Próximo ⟶
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* subtle gradient separator */}
        <div className="h-6 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />
      </div>

      {/* Reader body */}
      <div className={cx(chapter.kind === "IMAGES" && "bg-transparent")}>
        <div className="max-w-4xl mx-auto px-2 sm:px-4 py-4 space-y-4">
          {/* Chapter meta card */}
          <div className="card p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate text-white/95">
                  {chapter.work.title}
                </div>
                <div className="text-xs text-white/70 truncate">{headerTitle}</div>
              </div>

              <div className="flex items-center gap-2">
                <span className="chip">{chapter.kind === "IMAGES" ? "IMAGES" : "TEXT"}</span>
                <span className="chip">{paginated ? "PAGINATED" : "SCROLL"}</span>
                {scanlatorLabel ? <span className="chip">by {scanlatorLabel}</span> : null}
              </div>
            </div>
          </div>

          {chapter.kind === "TEXT" ? (
            <article className="card p-5 whitespace-pre-wrap leading-relaxed text-white/90">
              {chapter.text?.content || "Sem conteúdo."}
            </article>
          ) : null}

          {chapter.kind === "IMAGES" && !paginated ? (
            <div className="space-y-3">
              {chapter.pages.map((p) => (
                <div
                  key={p.index}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-black/30 shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.imageUrl} alt={`Página ${p.index + 1}`} className="w-full h-auto" />
                </div>
              ))}

              {chapter.pages.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white/80">
                  Sem páginas.
                </div>
              ) : null}
            </div>
          ) : null}

          {chapter.kind === "IMAGES" && paginated ? (
            <div className="space-y-3">
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
                {currentPage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentPage.imageUrl}
                    alt={`Página ${pageIdx + 1}`}
                    className="w-full h-auto"
                  />
                ) : (
                  <div className="p-4 text-white/80">Sem páginas.</div>
                )}
              </div>

              {/* Paginado - controle inferior premium */}
              <div className="card p-3">
                <div className="flex items-center justify-between gap-2">
                  <button
                    className="btn-secondary"
                    disabled={pageIdx <= 0}
                    onClick={goPrevPage}
                    title="Página anterior (←)"
                  >
                    ◀ Página
                  </button>

                  <div className="text-xs text-white/75">
                    {totalPages === 0 ? "0/0" : `${pageIdx + 1} de ${totalPages}`}
                  </div>

                  <button
                    className="btn-secondary"
                    disabled={pageIdx >= totalPages - 1}
                    onClick={goNextPage}
                    title="Próxima página (→)"
                  >
                    Página ▶
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {/* Bottom nav */}
          <div className="card p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Link
                  className={cx("btn-secondary", !prevChapterId && "opacity-40 pointer-events-none")}
                  href={prevChapterId ? `/read/${prevChapterId}` : "#"}
                  aria-disabled={!prevChapterId}
                >
                  ⟵ Capítulo anterior
                </Link>

                <Link className={cx("btn-ghost")} href={backHref}>
                  Voltar pra obra
                </Link>
              </div>

              <div className="flex items-center justify-between gap-2 sm:justify-end">
                <Link
                  className={cx("btn-secondary", !nextChapterId && "opacity-40 pointer-events-none")}
                  href={nextChapterId ? `/read/${nextChapterId}` : "#"}
                  aria-disabled={!nextChapterId}
                >
                  Próximo capítulo ⟶
                </Link>
              </div>
            </div>

            <p className="mt-3 text-xs text-white/70">
              Dica: <span className="font-medium text-white/85">←/→</span> muda página (modo paginado).{" "}
              <span className="font-medium text-white/85">Shift + ←/→</span> muda capítulo.
            </p>
          </div>

          {/* Spacer para não “colar” o fim no fundo */}
          <div className="h-6" />
        </div>
      </div>
    </main>
  );
}