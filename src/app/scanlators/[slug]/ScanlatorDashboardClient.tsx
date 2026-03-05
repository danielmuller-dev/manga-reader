"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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
    work: {
      id: string;
      slug: string;
      title: string;
      coverUrl: string | null;
      type: string;
    };
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

type WorkOption = {
  id: string;
  slug: string;
  title: string;
  type: string;
  coverUrl: string | null;
};

type AdminWorksResponse = {
  works: WorkOption[];
  linkedWorkIds: string[];
  error?: string;
};

type ActionResponse = { ok?: boolean; action?: "link" | "unlink"; error?: string };

export default function ScanlatorDashboardClient({
  me,
  scanlator,
}: {
  me: Me;
  scanlator: ScanlatorDashboard;
}) {
  const router = useRouter();
  const isAdmin = me.role === "ADMIN";

  // Admin UI state
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminErr, setAdminErr] = useState<string | null>(null);

  const [allWorks, setAllWorks] = useState<WorkOption[]>([]);
  const [linkedWorkIds, setLinkedWorkIds] = useState<string[]>([]);
  const [query, setQuery] = useState<string>("");
  const [selectedWorkId, setSelectedWorkId] = useState<string>("");

  const linkedIdsFromServer = useMemo(() => {
    return scanlator.works.map((w) => w.work.id);
  }, [scanlator.works]);

  const worksApiBase = useMemo(() => {
    // ✅ API agora é por slug
    return `/api/scanlators/${encodeURIComponent(scanlator.slug)}/works`;
  }, [scanlator.slug]);

  const firstLinkedWorkSlug = scanlator.works.length > 0 ? scanlator.works[0].work.slug : null;

  async function openAdminModal() {
    if (!isAdmin) return;

    setAdminModalOpen(true);
    setAdminErr(null);
    setAdminLoading(true);
    setQuery("");
    setSelectedWorkId("");

    try {
      const res = await fetch(worksApiBase, { method: "GET" });

      const data = (await res.json().catch(() => null)) as AdminWorksResponse | null;

      if (!res.ok) {
        setAdminErr(data?.error || "Erro ao carregar lista de obras.");
        return;
      }

      setAllWorks(Array.isArray(data?.works) ? data.works : []);
      setLinkedWorkIds(
        Array.isArray(data?.linkedWorkIds) ? data.linkedWorkIds : linkedIdsFromServer
      );
    } catch (e: unknown) {
      setAdminErr(e instanceof Error ? e.message : String(e));
    } finally {
      setAdminLoading(false);
    }
  }

  async function linkSelectedWork() {
    if (!isAdmin) return;
    if (!selectedWorkId) {
      setAdminErr("Selecione uma obra para vincular.");
      return;
    }

    setAdminErr(null);
    setAdminLoading(true);

    try {
      const res = await fetch(worksApiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "link", workId: selectedWorkId }),
      });

      const data = (await res.json().catch(() => ({}))) as ActionResponse;

      if (!res.ok) {
        setAdminErr(data.error || "Erro ao vincular obra.");
        return;
      }

      setLinkedWorkIds((prev) => (prev.includes(selectedWorkId) ? prev : [...prev, selectedWorkId]));
      setSelectedWorkId("");
      router.refresh();
    } catch (e: unknown) {
      setAdminErr(e instanceof Error ? e.message : String(e));
    } finally {
      setAdminLoading(false);
    }
  }

  async function unlinkWork(workId: string) {
    if (!isAdmin) return;

    const ok = confirm("Desvincular esta obra da scanlator?");
    if (!ok) return;

    setAdminErr(null);
    setAdminLoading(true);

    try {
      const res = await fetch(worksApiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unlink", workId }),
      });

      const data = (await res.json().catch(() => ({}))) as ActionResponse;

      if (!res.ok) {
        setAdminErr(data.error || "Erro ao desvincular obra.");
        return;
      }

      setLinkedWorkIds((prev) => prev.filter((id) => id !== workId));
      router.refresh();
    } catch (e: unknown) {
      setAdminErr(e instanceof Error ? e.message : String(e));
    } finally {
      setAdminLoading(false);
    }
  }

  const filteredWorks = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = allWorks;

    if (!q) return base.slice(0, 50);

    return base
      .filter((w) => {
        const t = `${w.title} ${w.slug} ${w.type}`.toLowerCase();
        return t.includes(q);
      })
      .slice(0, 50);
  }, [allWorks, query]);

  return (
    <main className="min-h-screen bg-gray-50 p-6 text-gray-900">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-14 w-14 rounded bg-gray-100 flex items-center justify-center overflow-hidden">
              {scanlator.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={scanlator.logoUrl}
                  alt={scanlator.name}
                  className="h-full w-full object-cover"
                />
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
                <span className="rounded bg-white border px-2 py-1">
                  Membros: {scanlator._count.members}
                </span>
                <span className="rounded bg-white border px-2 py-1">
                  Obras: {scanlator._count.works}
                </span>
                <span className="rounded bg-white border px-2 py-1">
                  Capítulos: {scanlator._count.chapters}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 items-end">
            <Link className="underline text-sm" href="/scanlators">
              Voltar
            </Link>

            <div className="flex gap-2">
              {firstLinkedWorkSlug ? (
                <Link
                  href={`/works/${encodeURIComponent(firstLinkedWorkSlug)}/chapters/new`}
                  className="rounded-md bg-gray-900 px-3 py-2 text-sm text-white hover:bg-gray-800"
                >
                  Enviar capítulo
                </Link>
              ) : (
                <button
                  type="button"
                  className="rounded-md bg-gray-900 px-3 py-2 text-sm text-white opacity-50 cursor-not-allowed"
                  disabled
                  title="Vincule uma obra primeiro para enviar capítulos."
                >
                  Enviar capítulo
                </button>
              )}

              {isAdmin ? (
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

        {adminErr ? (
          <div className="rounded-md border bg-white p-3 text-sm text-red-700">{adminErr}</div>
        ) : null}

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">Obras vinculadas</h2>
                <p className="text-sm text-gray-600">O upload deve ser feito para uma obra vinculada.</p>
              </div>

              {isAdmin ? (
                <button
                  type="button"
                  onClick={openAdminModal}
                  className="rounded-md bg-black px-3 py-2 text-sm text-white hover:opacity-90"
                >
                  Vincular obra
                </button>
              ) : null}
            </div>

            <div className="mt-3 space-y-2">
              {scanlator.works.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Nenhuma obra vinculada ainda.
                  {isAdmin ? " Clique em “Vincular obra”." : ""}
                </p>
              ) : (
                scanlator.works.map((w) => (
                  <div key={w.id} className="rounded border px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                      <Link href={`/works/${w.work.slug}`} className="min-w-0 flex-1 hover:underline">
                        <div className="font-medium truncate">{w.work.title}</div>
                        <div className="text-xs text-gray-600">/{w.work.slug}</div>
                      </Link>

                      <div className="flex items-center gap-2">
                        <span className="text-xs rounded bg-gray-100 px-2 py-1">{w.work.type}</span>

                        {isAdmin ? (
                          <button
                            type="button"
                            onClick={() => unlinkWork(w.work.id)}
                            disabled={adminLoading}
                            className="text-xs underline disabled:opacity-60"
                          >
                            desvincular
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
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

        {/* Modal Admin */}
        {isAdmin && adminModalOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-xl rounded-xl bg-white p-4 shadow-lg">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold">Vincular obra</div>
                  <div className="text-sm text-gray-600">
                    Selecione uma obra para vincular a <b>{scanlator.name}</b>.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setAdminModalOpen(false)}
                  className="text-sm underline"
                  disabled={adminLoading}
                >
                  Fechar
                </button>
              </div>

              <div className="mt-3 space-y-3">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar por título/slug/tipo..."
                  className="w-full rounded-md border p-2 text-sm"
                  disabled={adminLoading}
                />

                <div className="rounded-md border max-h-72 overflow-auto">
                  {adminLoading ? (
                    <div className="p-3 text-sm text-gray-600">Carregando...</div>
                  ) : filteredWorks.length === 0 ? (
                    <div className="p-3 text-sm text-gray-600">Nenhuma obra encontrada.</div>
                  ) : (
                    <ul className="divide-y">
                      {filteredWorks.map((w) => {
                        const alreadyLinked = (
                          linkedWorkIds.length ? linkedWorkIds : linkedIdsFromServer
                        ).includes(w.id);

                        return (
                          <li key={w.id} className="p-3 flex items-center justify-between gap-3">
                            <button
                              type="button"
                              className="min-w-0 flex-1 text-left"
                              onClick={() => setSelectedWorkId(w.id)}
                              disabled={alreadyLinked}
                              title={alreadyLinked ? "Já vinculada" : "Selecionar"}
                            >
                              <div className="font-medium truncate">
                                {w.title}{" "}
                                {alreadyLinked ? (
                                  <span className="ml-2 text-xs rounded bg-gray-100 px-2 py-0.5 text-gray-700">
                                    já vinculada
                                  </span>
                                ) : null}
                              </div>
                              <div className="text-xs text-gray-600 truncate">/{w.slug}</div>
                            </button>

                            <span className="text-xs rounded bg-gray-100 px-2 py-1">{w.type}</span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs text-gray-600">
                    Selecionada:{" "}
                    <span className="font-medium">{selectedWorkId ? selectedWorkId : "nenhuma"}</span>
                  </div>

                  <button
                    type="button"
                    onClick={linkSelectedWork}
                    disabled={adminLoading || !selectedWorkId}
                    className="rounded-md bg-black px-3 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Vincular
                  </button>
                </div>

                {adminErr ? <div className="text-sm text-red-700">{adminErr}</div> : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}