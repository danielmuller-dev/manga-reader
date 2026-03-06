"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type HomeWork = {
  id: string;
  slug: string;
  title: string;
  type: string;
  coverUrl: string | null;
  createdAt?: string;
};

type HomeChapter = {
  id: string;
  number: number | null;
  title: string | null;
  kind: string;
  readMode: string | null;
  createdAt: string;
  work: { slug: string; title: string };
};

type LatestUpdate = {
  work: { id: string; slug: string; title: string; type: string; coverUrl: string | null };
  chapters: { id: string; number: number | null; title: string | null; createdAt: string }[];
};

type HomeProgress = {
  mode: "SCROLL" | "PAGINATED";
  pageIndex: number | null;
  scrollY: number | null;
  updatedAt: string;
  chapterId: string;
  work: { slug: string; title: string; coverUrl: string | null; type: string };
  chapter: { number: number | null; title: string | null };
};

type HomeResponse = {
  latestWorks: HomeWork[]; // ainda vem da API, mas não usamos nessa seção
  latestChapters: HomeChapter[];
  latestUpdates: LatestUpdate[]; // ✅ novo
  progress: HomeProgress[];
  favorites: HomeWork[];
  error?: string;
};

function formatChapterLabel(n: number | null, t: string | null) {
  const base = n != null ? `Capítulo ${n}` : "Capítulo";
  return t ? `${base} — ${t}` : base;
}

function surfaceCoverFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center text-xs text-white/50">
      Sem capa
    </div>
  );
}

function safeDate(value: string | undefined) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? d : null;
}

// ✅ "há 1 minuto", "há 38 minutos", "há 14 dias"
function formatRelativePTBR(d: Date): string {
  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));

  if (diffSec < 5) return "há instantes";
  if (diffSec < 60) return `há ${diffSec} segundo${diffSec === 1 ? "" : "s"}`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `há ${diffMin} minuto${diffMin === 1 ? "" : "s"}`;

  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `há ${diffH} hora${diffH === 1 ? "" : "s"}`;

  const diffD = Math.floor(diffH / 24);
  if (diffD < 30) return `há ${diffD} dia${diffD === 1 ? "" : "s"}`;

  const diffM = Math.floor(diffD / 30);
  if (diffM < 12) return `há ${diffM} mês${diffM === 1 ? "" : "es"}`;

  const diffY = Math.floor(diffM / 12);
  return `há ${diffY} ano${diffY === 1 ? "" : "s"}`;
}

export default function HomePage() {
  const [data, setData] = useState<HomeResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/home", { cache: "no-store" })
      .then(async (r) => {
        const d = (await r.json()) as HomeResponse;
        if (!r.ok) throw new Error(d.error || "Erro ao carregar home.");
        return d;
      })
      .then((d) => setData(d))
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : String(e)));
  }, []);

  const hasFavorites = useMemo(() => (data?.favorites?.length ?? 0) > 0, [data]);
  const hasProgress = useMemo(() => (data?.progress?.length ?? 0) > 0, [data]);

  if (err) {
    return (
      <main className="min-h-screen">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold">Home</h1>
              <p className="muted text-sm">Painel do Manga Reader</p>
            </div>

            <Link className="btn-secondary" href="/works">
              Obras
            </Link>
          </div>

          <div className="card p-4">
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {err}
            </div>

            <div className="mt-4">
              <Link className="btn-primary" href="/works">
                Ir para Obras
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Manga Reader</h1>
              <p className="muted text-sm">
                Leitura em PT-BR • Mangá / Manhwa / Manhua / Webtoon / Novel
              </p>
            </div>

            <Link className="btn-secondary" href="/works">
              Obras
            </Link>
          </div>

          <div className="card p-4">
            <p className="text-sm text-white/70">Carregando...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="space-y-10">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
              <span className="text-sm font-semibold tracking-wide">Manga Reader</span>
              <span className="text-xs text-white/60">beta</span>
            </div>

            <h1 className="mt-5 text-3xl font-semibold tracking-tight">Home</h1>
            <p className="mt-2 text-sm text-white/70">
              Leitura em PT-BR • Mangá / Manhwa / Manhua / Webtoon / Novel
            </p>
          </div>

          <nav className="flex items-center gap-2">
            <Link className="btn-secondary" href="/works">
              Obras
            </Link>
          </nav>
        </header>

        {/* Favoritos */}
        {hasFavorites ? (
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Meus favoritos</h2>
                <p className="muted text-sm">Acesso rápido às obras que você curte.</p>
              </div>

              <Link className="btn-ghost" href="/works">
                Ver obras →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {data.favorites.map((w) => (
                <Link key={w.id} href={`/works/${w.slug}`} className="card card-hover p-2">
                  <div className="w-full aspect-[3/4] overflow-hidden rounded-xl border border-white/10 bg-black/30">
                    {w.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={w.coverUrl} alt={w.title} className="w-full h-full object-cover" />
                    ) : (
                      surfaceCoverFallback()
                    )}
                  </div>

                  <div className="mt-2 px-1">
                    <div className="text-xs text-white/60">{w.type}</div>
                    <div className="text-sm font-semibold leading-tight line-clamp-2">{w.title}</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {/* Continue lendo (se já tiver) */}
        {hasProgress ? (
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Continue lendo</h2>
                <p className="muted text-sm">Retome rápido de onde você parou.</p>
              </div>

              <Link className="btn-ghost" href="/history">
                Ver histórico →
              </Link>
            </div>

            <div className="overflow-x-auto">
              <div className="flex gap-3 min-w-max pr-2">
                {data.progress.map((p) => {
                  const qs =
                    p.mode === "PAGINATED"
                      ? `?p=${p.pageIndex ?? 0}`
                      : `?s=${p.scrollY ?? 0}`;

                  const updated = safeDate(p.updatedAt);
                  const updatedRel = updated ? formatRelativePTBR(updated) : null;

                  return (
                    <Link
                      key={`${p.work.slug}-${p.chapterId}`}
                      href={`/read/${p.chapterId}${qs}`}
                      className="card card-hover p-2 w-[150px] sm:w-[160px] lg:w-[170px] shrink-0"
                      title={updatedRel ? `Atualizado ${updatedRel}` : "Continuar lendo"}
                    >
                      <div className="w-full aspect-[3/4] overflow-hidden rounded-xl border border-white/10 bg-black/30">
                        {p.work.coverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.work.coverUrl}
                            alt={p.work.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          surfaceCoverFallback()
                        )}
                      </div>

                      <div className="mt-2 px-1">
                        <div className="text-xs text-white/60 truncate">{p.work.type}</div>
                        <div className="text-sm font-semibold leading-tight line-clamp-2">
                          {p.work.title}
                        </div>

                        <div className="mt-1 text-[12px] font-semibold truncate text-emerald-300">
                          {formatChapterLabel(p.chapter.number, p.chapter.title)}
                        </div>

                        <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div className="h-full bg-emerald-400/90" style={{ width: "35%" }} />
                        </div>

                        {updatedRel ? (
                          <div className="mt-2 text-[11px] text-white/40 truncate">{updatedRel}</div>
                        ) : null}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        ) : null}

        {/* ✅ Últimas atualizações (NOVA SEÇÃO) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Últimas atualizações</h2>
              <p className="muted text-sm">Capítulos recém-postados em cada obra.</p>
            </div>

            <Link className="btn-ghost" href="/works">
              Ver obras →
            </Link>
          </div>

          {data.latestUpdates.length === 0 ? (
            <div className="card p-5">
              <p className="text-sm text-white/70">Nenhuma atualização ainda.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="flex gap-3 min-w-max pr-2">
                {data.latestUpdates.map((u) => {
                  return (
                    <div
                      key={u.work.id}
                      className="rounded-2xl border border-white/10 bg-black/20 shadow-[0_10px_30px_rgba(0,0,0,0.35)] overflow-hidden w-[360px] shrink-0"
                    >
                      <div className="flex gap-3 p-3">
                        <Link
                          href={`/works/${u.work.slug}`}
                          className="w-20 h-28 overflow-hidden rounded-xl border border-white/10 bg-black/30 shrink-0"
                          title={u.work.title}
                        >
                          {u.work.coverUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={u.work.coverUrl}
                              alt={u.work.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            surfaceCoverFallback()
                          )}
                        </Link>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="text-sm font-semibold leading-tight line-clamp-2">
                                {u.work.title}
                              </div>
                              <div className="text-xs text-white/50 mt-1">{u.work.type}</div>
                            </div>

                            <Link className="btn-ghost shrink-0" href={`/works/${u.work.slug}`}>
                              Abrir →
                            </Link>
                          </div>

                          <div className="mt-3 space-y-2">
                            {u.chapters.slice(0, 2).map((c) => {
                              const d = safeDate(c.createdAt);
                              const rel = d ? formatRelativePTBR(d) : null;

                              return (
                                <Link
                                  key={c.id}
                                  href={`/read/${c.id}`}
                                  className="block rounded-xl border border-white/10 bg-white/5 px-3 py-2 hover:bg-white/10 transition"
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="text-sm font-semibold text-white/90 truncate">
                                      {formatChapterLabel(c.number, c.title)}
                                    </div>
                                  </div>

                                  <div className="mt-1 text-xs text-white/50">
                                    <span className="inline-flex items-center gap-2">
                                      <span className="h-1.5 w-1.5 rounded-full bg-yellow-400/90" />
                                      {rel ?? "recentemente"}
                                    </span>
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* Últimos capítulos (lista simples, mantém) */}
        <section className="space-y-3">
          <div>
            <h2 className="text-xl font-semibold">Últimos capítulos</h2>
            <p className="muted text-sm">Uploads recentes em qualquer obra.</p>
          </div>

          {data.latestChapters.length === 0 ? (
            <div className="card p-5">
              <p className="text-sm text-white/70">Nenhum capítulo cadastrado ainda.</p>
            </div>
          ) : (
            <div className="card p-4">
              <ul className="space-y-2">
                {data.latestChapters.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:bg-black/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{c.work.title}</div>
                        <div className="text-sm text-white/80 truncate">
                          {formatChapterLabel(c.number, c.title)}
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="chip">
                            {c.kind}
                            {c.kind === "IMAGES" && c.readMode ? ` • ${c.readMode}` : ""}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Link className="btn-secondary" href={`/works/${c.work.slug}`}>
                          Obra
                        </Link>
                        <Link className="btn-primary" href={`/read/${c.id}`}>
                          Ler
                        </Link>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <footer className="text-xs text-white/50">
          MVP • Próximo: polir páginas (Obras / Página da Obra / Reader) e melhorar experiência de leitura.
        </footer>
      </div>
    </main>
  );
}