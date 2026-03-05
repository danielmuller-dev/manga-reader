"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Role = "USER" | "SCAN" | "ADMIN";

type MeResponse =
  | { user: { id: string; email: string; name: string | null; role: Role } }
  | { user: null };

type Work = {
  id: string;
  slug: string;
  title: string;
  type: string;
  coverUrl: string | null;
};

type WorksResponse = { works: Work[] } | { error?: string };

function coverFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center text-xs text-white/50">
      Sem capa
    </div>
  );
}

export default function WorksPage() {
  // null = carregando
  const [works, setWorks] = useState<Work[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [me, setMe] = useState<MeResponse>({ user: null });

  const canCreate = useMemo(() => {
    if (me.user === null) return false;
    return me.user.role === "ADMIN" || me.user.role === "SCAN";
  }, [me]);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/me", { cache: "no-store" })
      .then(async (r) => {
        const d = (await r.json()) as MeResponse;
        if (!r.ok) throw new Error("Falha ao carregar usuário.");
        return d;
      })
      .then((d) => {
        if (cancelled) return;
        setMe(d);
      })
      .catch(() => {
        if (cancelled) return;
        setMe({ user: null });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    // não setamos state aqui (pra evitar o warning do seu setup)
    fetch("/api/works", { cache: "no-store" })
      .then(async (r) => {
        const d = (await r.json()) as WorksResponse;

        if (!r.ok) {
          const msg = "error" in d && d.error ? d.error : "Erro ao carregar obras.";
          throw new Error(msg);
        }

        return d;
      })
      .then((d) => {
        if (cancelled) return;

        if ("works" in d && Array.isArray(d.works)) setWorks(d.works);
        else setWorks([]);

        setErr(null);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setWorks([]);
        setErr(e instanceof Error ? e.message : String(e));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const loading = works === null;

  return (
    <main className="min-h-screen">
      <div className="space-y-5">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-3xl font-semibold tracking-tight">Obras</h1>
            <p className="muted text-sm">
              Lista de mangás/manhwas/webtoons cadastrados.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link className="btn-secondary" href="/">
              Home
            </Link>

            {canCreate ? (
              <Link className="btn-primary" href="/works/new">
                Nova obra
              </Link>
            ) : null}
          </div>
        </header>

        {err ? (
          <div className="card p-4">
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {err}
            </div>
          </div>
        ) : null}

        {loading ? (
          <div className="card p-4">
            <p className="text-sm text-white/70">Carregando...</p>
          </div>
        ) : null}

        {!loading && works.length === 0 ? (
          <div className="card p-5">
            <p className="text-sm text-white/70">Nenhuma obra cadastrada ainda.</p>
            {canCreate ? (
              <div className="mt-4">
                <Link className="btn-primary" href="/works/new">
                  Criar primeira obra
                </Link>
              </div>
            ) : null}
          </div>
        ) : null}

        {!loading && works.length > 0 ? (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {works.map((w) => (
              <li key={w.id}>
                <Link href={`/works/${w.slug}`} className="card card-hover block p-4">
                  <div className="flex gap-4">
                    <div className="w-20 h-28 overflow-hidden rounded-xl border border-white/10 bg-black/30">
                      {w.coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={w.coverUrl}
                          alt={w.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        coverFallback()
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="chip">{w.type}</span>
                        <span className="text-xs text-white/50 truncate">/{w.slug}</span>
                      </div>

                      <div className="mt-2 text-lg font-semibold truncate">{w.title}</div>

                      <div className="mt-2 text-sm text-white/70">Abrir detalhes →</div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </main>
  );
}