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

export default function WorksPage() {
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [err, setErr] = useState<string | null>(null);

  const [me, setMe] = useState<MeResponse>({ user: null });

  const canCreate = useMemo(() => {
    if (me.user === null) return false;
    return me.user.role === "ADMIN" || me.user.role === "SCAN";
  }, [me]);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/me")
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

    fetch("/api/works")
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
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 p-6 text-gray-900">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Obras</h1>
            <p className="text-sm text-gray-600">Lista de mangás/manhwas/webtoons cadastrados.</p>
          </div>

          <div className="flex items-center gap-3">
            <Link className="underline" href="/">
              Home
            </Link>

            {canCreate ? (
              <Link className="underline" href="/works/new">
                Nova obra
              </Link>
            ) : null}
          </div>
        </div>

        {err ? <p className="text-red-600 text-sm">{err}</p> : null}

        {loading ? <p>Carregando...</p> : null}

        {!loading && works.length === 0 ? (
          <p className="text-sm text-gray-700">Nenhuma obra cadastrada ainda.</p>
        ) : null}

        {!loading && works.length > 0 ? (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {works.map((w) => (
              <li key={w.id}>
                <Link
                  href={`/works/${w.slug}`}
                  className="block rounded-xl border bg-white p-4 shadow-sm hover:shadow transition"
                >
                  <div className="flex gap-4">
                    <div className="w-20 h-28 bg-gray-100 rounded-md overflow-hidden flex items-center justify-center">
                      {w.coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={w.coverUrl} alt={w.title} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs opacity-60">Sem capa</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-sm opacity-70">{w.type}</div>
                      <div className="text-lg font-semibold truncate">{w.title}</div>
                      <div className="text-sm opacity-70 truncate">/{w.slug}</div>
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