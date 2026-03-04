"use client";

import Link from "next/link";

type Me = {
  id: string;
  email: string;
  name: string | null;
  role: "USER" | "SCAN" | "ADMIN";
};

type ScanlatorDashboard = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  createdAt: string | Date;
  _count: { members: number; works: number; chapters: number };
  works: {
    id: string;
    createdAt: string | Date;
    work: { id: string; slug: string; title: string; coverUrl: string | null; type: string };
  }[];
  chapters: {
    id: string;
    number: number | null;
    title: string | null;
    kind: "IMAGES" | "TEXT";
    createdAt: string | Date;
    work: { id: string; slug: string; title: string };
  }[];
};

export default function ScanlatorDashboardClient({
  me,
  scanlator,
}: {
  me: Me;
  scanlator: ScanlatorDashboard;
}) {
  return (
    <main className="min-h-screen bg-gray-50 p-6 text-gray-900">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-14 w-14 rounded bg-gray-100 flex items-center justify-center overflow-hidden">
              {scanlator.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={scanlator.logoUrl} alt={scanlator.name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs text-gray-500">LOGO</span>
              )}
            </div>

            <div>
              <h1 className="text-2xl font-semibold">{scanlator.name}</h1>
              <p className="text-sm text-gray-600">/{scanlator.slug}</p>
              {scanlator.description ? (
                <p className="mt-2 text-sm text-gray-700 max-w-2xl">{scanlator.description}</p>
              ) : (
                <p className="mt-2 text-sm text-gray-500">Sem descrição.</p>
              )}

              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded bg-white border px-2 py-1">Membros: {scanlator._count.members}</span>
                <span className="rounded bg-white border px-2 py-1">Obras: {scanlator._count.works}</span>
                <span className="rounded bg-white border px-2 py-1">Capítulos: {scanlator._count.chapters}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 items-end">
            <Link className="underline text-sm" href="/scanlators">
              Voltar
            </Link>

            <div className="flex gap-2">
              <Link
                href={`/scanlators/${scanlator.slug}/upload`}
                className="rounded-md bg-gray-900 px-3 py-2 text-sm text-white hover:bg-gray-800"
              >
                Enviar capítulo
              </Link>

              {me.role === "ADMIN" ? (
                <Link
                  href={`/admin`}
                  className="rounded-md border bg-white px-3 py-2 text-sm hover:bg-gray-50"
                >
                  Admin
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border bg-white p-4">
            <h2 className="font-semibold">Obras vinculadas</h2>
            <p className="text-sm text-gray-600">O upload deve ser feito para uma obra vinculada.</p>

            <div className="mt-3 space-y-2">
              {scanlator.works.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Nenhuma obra vinculada. (Admin precisa vincular em /admin)
                </p>
              ) : (
                scanlator.works.map((w) => (
                  <Link
                    key={w.id}
                    href={`/works/${w.work.slug}`}
                    className="block rounded border px-3 py-2 hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{w.work.title}</div>
                        <div className="text-xs text-gray-600">/{w.work.slug}</div>
                      </div>
                      <span className="text-xs rounded bg-gray-100 px-2 py-1">{w.work.type}</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="rounded-lg border bg-white p-4">
            <h2 className="font-semibold">Últimos capítulos enviados</h2>
            <p className="text-sm text-gray-600">Listagem rápida (últimos 30).</p>

            <div className="mt-3 space-y-2">
              {scanlator.chapters.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhum capítulo enviado ainda.</p>
              ) : (
                scanlator.chapters.map((c) => (
                  <div key={c.id} className="rounded border px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium truncate">
                          {c.work.title} — {c.number ?? "?"} {c.title ? `(${c.title})` : ""}
                        </div>
                        <div className="text-xs text-gray-600">{c.kind}</div>
                      </div>
                      <Link className="underline text-sm" href={`/read/${c.id}`}>
                        Ler
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-3">
              <Link className="underline text-sm" href={`/scanlators/${scanlator.slug}/chapters`}>
                Gerenciar capítulos
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}