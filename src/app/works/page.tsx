"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Work = {
  id: string;
  slug: string;
  title: string;
  type: string;
  coverUrl: string | null;
};

export default function WorksPage() {
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/works")
      .then((r) => r.json())
      .then((d) => setWorks(d.works || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 p-6 text-gray-900">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Obras</h1>
          <Link className="underline" href="/works/new">Nova obra</Link>
        </div>

        {loading && <p>Carregando...</p>}

        {!loading && works.length === 0 && (
          <p>Nenhuma obra cadastrada ainda. Clique em “Nova obra”.</p>
        )}

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
                      <img
                        src={w.coverUrl}
                        alt={w.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs opacity-60">Sem capa</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm opacity-70">{w.type}</div>
                    <div className="text-lg font-semibold">{w.title}</div>
                    <div className="text-sm opacity-70">/{w.slug}</div>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}