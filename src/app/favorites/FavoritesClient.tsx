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

type HomeResponse = {
  favorites: HomeWork[];
  error?: string;
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function typeLabel(type: string) {
  const t = type.trim().toLowerCase();
  if (t === "manga") return "Mangá";
  if (t === "manhwa") return "Manhwa";
  if (t === "manhua") return "Manhua";
  if (t === "webtoon") return "Webtoon";
  if (t === "novel") return "Novel";
  return type;
}

export default function FavoritesClient() {
  const [favorites, setFavorites] = useState<HomeWork[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/home", { cache: "no-store" })
      .then(async (r) => {
        const d = (await r.json()) as HomeResponse;
        if (!r.ok) throw new Error(d.error || "Erro ao carregar favoritos.");
        return d;
      })
      .then((d) => {
        if (cancelled) return;
        setFavorites(d.favorites || []);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setErr(e instanceof Error ? e.message : String(e));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const countLabel = useMemo(() => {
    const n = favorites?.length ?? 0;
    if (n === 0) return "0 obras";
    if (n === 1) return "1 obra";
    return `${n} obras`;
  }, [favorites]);

  if (err) {
    return (
      <main className="min-h-screen text-white">
        {/* Background */}
        <div className="fixed inset-0 -z-10 bg-gradient-to-b from-black via-zinc-950 to-black" />
        <div className="fixed inset-0 -z-10 opacity-40">
          <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-56 left-10 h-[520px] w-[520px] rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-40 right-10 h-[520px] w-[520px] rounded-full bg-white/5 blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto px-4 py-10 space-y-4">
          <div className="card p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold">Favoritos</h1>
                <p className="muted mt-1">Algo deu errado ao carregar seus favoritos.</p>
              </div>
              <Link className="btn-secondary" href="/works">
                Ver obras
              </Link>
            </div>

            <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              {err}
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!favorites) {
    return (
      <main className="min-h-screen text-white">
        {/* Background */}
        <div className="fixed inset-0 -z-10 bg-gradient-to-b from-black via-zinc-950 to-black" />
        <div className="fixed inset-0 -z-10 opacity-40">
          <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-56 left-10 h-[520px] w-[520px] rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-40 right-10 h-[520px] w-[520px] rounded-full bg-white/5 blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto px-4 py-10 space-y-6">
          <header className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Favoritos</h1>
              <p className="muted mt-1">Suas obras favoritadas.</p>
            </div>

            <nav className="flex items-center gap-2">
              <Link className="btn-secondary" href="/works">
                Obras
              </Link>
            </nav>
          </header>

          <div className="card p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-sm font-medium">Carregando...</div>
                <div className="muted text-sm">Buscando sua lista de favoritos.</div>
              </div>
              <div className="h-2 w-28 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full w-1/2 bg-white/30 animate-pulse" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 opacity-70">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="card p-2">
                <div className="w-full aspect-[3/4] rounded-xl bg-white/5 border border-white/10 animate-pulse" />
                <div className="mt-3 space-y-2">
                  <div className="h-3 w-12 rounded bg-white/10 animate-pulse" />
                  <div className="h-4 w-full rounded bg-white/10 animate-pulse" />
                  <div className="h-4 w-3/4 rounded bg-white/10 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen text-white">
      {/* Background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-black via-zinc-950 to-black" />
      <div className="fixed inset-0 -z-10 opacity-40">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-56 left-10 h-[520px] w-[520px] rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-40 right-10 h-[520px] w-[520px] rounded-full bg-white/5 blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10 space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Favoritos</h1>
            <p className="muted mt-1">Suas obras favoritadas • {countLabel}</p>
          </div>

          <nav className="flex items-center gap-2">
            <Link className="btn-secondary" href="/works">
              Explorar obras
            </Link>
          </nav>
        </header>

        {favorites.length === 0 ? (
          <div className="card p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-sm font-semibold">Nada por aqui ainda</div>
                <p className="muted mt-1 text-sm">
                  Você ainda não favoritou nenhuma obra. Explore o catálogo e favorite as que você
                  quer acompanhar.
                </p>
              </div>
              <Link className="btn-primary" href="/works">
                Ver obras
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {favorites.map((w) => (
              <Link
                key={w.id}
                href={`/works/${w.slug}`}
                className={cx(
                  "card card-hover p-2 group",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                )}
              >
                <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden border border-white/10 bg-black/30">
                  {w.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={w.coverUrl}
                      alt={w.title}
                      className={cx(
                        "w-full h-full object-cover",
                        "transition-transform duration-300 group-hover:scale-[1.03]"
                      )}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-xs text-white/60">Sem capa</span>
                    </div>
                  )}

                  {/* top gradient for readability */}
                  <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/60 to-transparent" />

                  {/* Type badge */}
                  <div className="absolute top-2 left-2">
                    <span className="chip">{typeLabel(w.type)}</span>
                  </div>
                </div>

                <div className="mt-3 space-y-1">
                  <div className="text-sm font-semibold leading-tight line-clamp-2 text-white/90">
                    {w.title}
                  </div>
                  <div className="text-xs text-white/60">Abrir detalhes</div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="card p-4">
          <p className="text-xs text-white/70">
            Dica: na página da obra você pode alternar favorito e continuar leitura com o progresso
            salvo automaticamente.
          </p>
        </div>
      </div>
    </main>
  );
}