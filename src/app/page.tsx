"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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
  latestWorks: HomeWork[];
  latestChapters: HomeChapter[];
  progress: HomeProgress[];
  favorites: HomeWork[];
  error?: string;
};

function formatChapterLabel(n: number | null, t: string | null) {
  const base = n != null ? `Cap. ${n}` : "Capítulo";
  return t ? `${base} — ${t}` : base;
}

function surfaceCoverFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center text-xs text-white/50">
      Sem capa
    </div>
  );
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

          {data.favorites.length === 0 ? (
            <div className="card p-5">
              <p className="text-sm text-white/70">
                Você ainda não favoritou nenhuma obra.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {data.favorites.map((w) => (
                <Link
                  key={w.id}
                  href={`/works/${w.slug}`}
                  className="card card-hover p-2"
                >
                  <div className="w-full aspect-[3/4] overflow-hidden rounded-xl border border-white/10 bg-black/30">
                    {w.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={w.coverUrl}
                        alt={w.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      surfaceCoverFallback()
                    )}
                  </div>

                  <div className="mt-2 px-1">
                    <div className="text-xs text-white/60">{w.type}</div>
                    <div className="text-sm font-semibold leading-tight line-clamp-2">
                      {w.title}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Continuar lendo */}
        <section className="space-y-3">
          <div>
            <h2 className="text-xl font-semibold">Continuar lendo</h2>
            <p className="muted text-sm">Retome exatamente de onde você parou.</p>
          </div>

          {data.progress.length === 0 ? (
            <div className="card p-5">
              <p className="text-sm text-white/70">
                Nenhum progresso ainda. Abra um capítulo e role a página (scroll) ou mude de página (paginado) para salvar automaticamente.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.progress.map((p) => {
                const qs =
                  p.mode === "PAGINATED"
                    ? `?p=${p.pageIndex ?? 0}`
                    : `?s=${p.scrollY ?? 0}`;

                const where =
                  p.mode === "PAGINATED"
                    ? `Página ${((p.pageIndex ?? 0) + 1).toString()}`
                    : `Scroll ${p.scrollY ?? 0}px`;

                return (
                  <Link
                    key={`${p.work.slug}-${p.chapterId}`}
                    href={`/read/${p.chapterId}${qs}`}
                    className="card card-hover p-4"
                  >
                    <div className="flex gap-3">
                      <div className="w-16 h-24 overflow-hidden rounded-xl border border-white/10 bg-black/30">
                        {p.work.coverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.work.coverUrl}
                            alt={p.work.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          surfaceCoverFallback()
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-white/60">{p.work.type}</div>
                        <div className="font-semibold truncate">{p.work.title}</div>
                        <div className="text-sm text-white/80 truncate">
                          {formatChapterLabel(p.chapter.number, p.chapter.title)}
                        </div>
                        <div className="mt-1 inline-flex items-center gap-2">
                          <span className="chip">{where}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Últimas obras */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Últimas obras</h2>
              <p className="muted text-sm">Novidades recém cadastradas.</p>
            </div>

            <Link className="btn-ghost" href="/works">
              Ver todas →
            </Link>
          </div>

          {data.latestWorks.length === 0 ? (
            <div className="card p-5">
              <p className="text-sm text-white/70">Nenhuma obra cadastrada ainda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {data.latestWorks.map((w) => (
                <Link
                  key={w.id}
                  href={`/works/${w.slug}`}
                  className="card card-hover p-2"
                >
                  <div className="w-full aspect-[3/4] overflow-hidden rounded-xl border border-white/10 bg-black/30">
                    {w.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={w.coverUrl}
                        alt={w.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      surfaceCoverFallback()
                    )}
                  </div>

                  <div className="mt-2 px-1">
                    <div className="text-xs text-white/60">{w.type}</div>
                    <div className="text-sm font-semibold leading-tight line-clamp-2">
                      {w.title}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Últimos capítulos */}
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