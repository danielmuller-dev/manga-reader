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

type HomeResponse = {
  favorites: HomeWork[];
  error?: string;
};

export default function FavoritesClient() {
  const [favorites, setFavorites] = useState<HomeWork[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/home", { cache: "no-store" })
      .then(async (r) => {
        const d = (await r.json()) as HomeResponse;
        if (!r.ok) throw new Error(d.error || "Erro ao carregar favoritos.");
        return d;
      })
      .then((d) => setFavorites(d.favorites || []))
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : String(e)));
  }, []);

  if (err) {
    return (
      <main className="min-h-screen bg-gray-50 p-6 text-gray-900">
        <div className="max-w-5xl mx-auto space-y-3">
          <h1 className="text-2xl font-semibold">Favoritos</h1>
          <p className="text-red-600">{err}</p>
          <Link className="underline" href="/works">
            Ir para Obras
          </Link>
        </div>
      </main>
    );
  }

  if (!favorites) {
    return (
      <main className="min-h-screen bg-gray-50 p-6 text-gray-900">
        <div className="max-w-5xl mx-auto space-y-3">
          <h1 className="text-2xl font-semibold">Favoritos</h1>
          <p>Carregando...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 text-gray-900">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Favoritos</h1>
            <p className="text-sm opacity-70">Suas obras favoritadas.</p>
          </div>

          <nav className="flex items-center gap-3">
            <Link className="underline" href="/works">
              Obras
            </Link>
          </nav>
        </header>

        {favorites.length === 0 ? (
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-sm opacity-70">Você ainda não favoritou nenhuma obra.</p>
            <div className="mt-3">
              <Link
                className="inline-flex rounded-md bg-black text-white px-3 py-2 hover:opacity-90 text-sm"
                href="/works"
              >
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
      </div>
    </main>
  );
}