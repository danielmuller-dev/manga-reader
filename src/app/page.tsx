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

export default function HomePage() {
  const [data, setData] = useState<HomeResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/home")
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
      <main className="min-h-screen bg-gray-50 p-6 text-gray-900">
        <div className="max-w-5xl mx-auto space-y-3">
          <h1 className="text-2xl font-semibold">Home</h1>
          <p className="text-red-600">{err}</p>
          <Link className="underline" href="/works">
            Ir para Obras
          </Link>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-gray-50 p-6 text-gray-900">
        <div className="max-w-5xl mx-auto space-y-3">
          <h1 className="text-2xl font-semibold">Home</h1>
          <p>Carregando...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 text-gray-900">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">Manga Reader</h1>
            <p className="text-sm opacity-70">Leitura em PT-BR • Mangá / Manhwa / Manhua / Webtoon / Novel</p>
          </div>

          <nav className="flex items-center gap-3">
            <Link className="underline" href="/works">
              Obras
            </Link>
            <Link className="underline" href="/works/new">
              Nova obra
            </Link>
          </nav>
        </header>

        {/* Favoritos */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Meus favoritos</h2>
            <Link className="underline" href="/works">
              Ver obras
            </Link>
          </div>

          {data.favorites.length === 0 ? (
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <p className="text-sm opacity-70">Você ainda não favoritou nenhuma obra.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {data.favorites.map((w) => (
                <Link
                  key={w.id}
                  href={`/works/${w.slug}`}
                  className="rounded-xl border bg-white p-2 shadow-sm hover:bg-gray-50"
                >
                  <div className="w-full aspect-[3/4] bg-gray-100 rounded-md overflow-hidden flex items-center justify-center">
                    {w.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={w.coverUrl} alt={w.title} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs opacity-60">Sem capa</span>
                    )}
                  </div>
                  <div className="mt-2">
                    <div className="text-xs opacity-70">{w.type}</div>
                    <div className="text-sm font-medium leading-tight line-clamp-2">{w.title}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Continuar lendo */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Continuar lendo</h2>

          {data.progress.length === 0 ? (
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <p className="text-sm opacity-70">
                Nenhum progresso ainda. Abra um capítulo e role a página ou mude de página para salvar automaticamente.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.progress.map((p) => {
                const qs =
                  p.mode === "PAGINATED"
                    ? `?p=${p.pageIndex ?? 0}`
                    : `?s=${p.scrollY ?? 0}`;

                return (
                  <Link
                    key={`${p.work.slug}-${p.chapterId}`}
                    href={`/read/${p.chapterId}${qs}`}
                    className="rounded-xl border bg-white p-4 shadow-sm hover:bg-gray-50"
                  >
                    <div className="flex gap-3">
                      <div className="w-16 h-24 bg-gray-100 rounded-md overflow-hidden flex items-center justify-center">
                        {p.work.coverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.work.coverUrl} alt={p.work.title} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs opacity-60">Sem capa</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="text-xs opacity-70">{p.work.type}</div>
                        <div className="font-semibold truncate">{p.work.title}</div>
                        <div className="text-sm opacity-80 truncate">
                          {formatChapterLabel(p.chapter.number, p.chapter.title)}
                        </div>
                        <div className="text-xs opacity-70 mt-1">
                          {p.mode === "PAGINATED"
                            ? `Página ${((p.pageIndex ?? 0) + 1).toString()}`
                            : `Scroll ${p.scrollY ?? 0}px`}
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
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Últimas obras</h2>
            <Link className="underline" href="/works">
              Ver todas
            </Link>
          </div>

          {data.latestWorks.length === 0 ? (
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <p className="text-sm opacity-70">Nenhuma obra cadastrada ainda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {data.latestWorks.map((w) => (
                <Link
                  key={w.id}
                  href={`/works/${w.slug}`}
                  className="rounded-xl border bg-white p-2 shadow-sm hover:bg-gray-50"
                >
                  <div className="w-full aspect-[3/4] bg-gray-100 rounded-md overflow-hidden flex items-center justify-center">
                    {w.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={w.coverUrl} alt={w.title} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs opacity-60">Sem capa</span>
                    )}
                  </div>
                  <div className="mt-2">
                    <div className="text-xs opacity-70">{w.type}</div>
                    <div className="text-sm font-medium leading-tight line-clamp-2">{w.title}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Últimos capítulos */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Últimos capítulos</h2>

          {data.latestChapters.length === 0 ? (
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <p className="text-sm opacity-70">Nenhum capítulo cadastrado ainda.</p>
            </div>
          ) : (
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <ul className="space-y-2">
                {data.latestChapters.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 border rounded-lg p-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{c.work.title}</div>
                      <div className="text-sm opacity-80 truncate">{formatChapterLabel(c.number, c.title)}</div>
                      <div className="text-xs opacity-70">
                        {c.kind}
                        {c.kind === "IMAGES" && c.readMode ? ` • ${c.readMode}` : ""}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link className="underline" href={`/works/${c.work.slug}`}>
                        Obra
                      </Link>
                      <Link className="rounded-md bg-black text-white px-3 py-2 hover:opacity-90" href={`/read/${c.id}`}>
                        Ler
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <footer className="text-xs opacity-60">
          MVP • Próximo: permissões (SCAN/ADMIN) e painel de scans.
        </footer>
      </div>
    </main>
  );
}