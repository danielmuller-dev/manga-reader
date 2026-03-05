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

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function initials(label: string) {
  const s = label.trim();
  if (!s) return "SC";
  const parts = s.split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0]?.toUpperCase() ?? "S";
  const b = parts[1]?.[0]?.toUpperCase() ?? parts[0]?.[1]?.toUpperCase() ?? "C";
  return `${a}${b}`;
}

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
  const [adminModalOpen, setAdminModalOpen] = useState<boolean>(false);
  const [adminLoading, setAdminLoading] = useState<boolean>(false);
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

  const topMsgClass = useMemo(() => {
    if (!adminErr) return null;
    return "border-red-500/30 bg-red-500/10 text-red-200";
  }, [adminErr]);

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
        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center overflow-hidden shadow-sm">
              {scanlator.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={scanlator.logoUrl}
                  alt={scanlator.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <span className="text-xs text-white/70">{initials(scanlator.name)}</span>
              )}
            </div>

            <div className="min-w-0">
              <h1 className="text-2xl font-semibold text-white/95">{scanlator.name}</h1>
              <p className="muted text-sm">/{scanlator.slug}</p>

              {scanlator.description ? (
                <p className="mt-2 text-sm text-white/80 max-w-2xl">{scanlator.description}</p>
              ) : (
                <p className="mt-2 text-sm text-white/60">Sem descrição.</p>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="chip">Membros: {scanlator._count.members}</span>
                <span className="chip">Obras: {scanlator._count.works}</span>
                <span className="chip">Capítulos: {scanlator._count.chapters}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Link className="btn-secondary" href="/scanlators">
              Voltar
            </Link>

            {firstLinkedWorkSlug ? (
              <Link
                href={`/works/${encodeURIComponent(firstLinkedWorkSlug)}/chapters/new`}
                className="btn-primary"
                title="Enviar capítulo para a obra vinculada"
              >
                Enviar capítulo
              </Link>
            ) : (
              <button
                type="button"
                className="btn-primary opacity-50 cursor-not-allowed"
                disabled
                title="Vincule uma obra primeiro para enviar capítulos."
              >
                Enviar capítulo
              </button>
            )}

            {isAdmin ? (
              <Link href="/admin" className="btn-secondary">
                Admin
              </Link>
            ) : null}
          </div>
        </header>

        {topMsgClass ? (
          <div className={cx("rounded-2xl border p-4 text-sm", topMsgClass)}>{adminErr}</div>
        ) : null}

        <section className="grid gap-4 lg:grid-cols-2">
          {/* Obras vinculadas */}
          <div className="card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-white/90">Obras vinculadas</h2>
                <p className="muted mt-1 text-sm">O upload deve ser feito para uma obra vinculada.</p>
              </div>

              {isAdmin ? (
                <button type="button" onClick={() => void openAdminModal()} className="btn-primary">
                  Vincular obra
                </button>
              ) : null}
            </div>

            <div className="mt-4 space-y-2">
              {scanlator.works.length === 0 ? (
                <p className="muted text-sm">
                  Nenhuma obra vinculada ainda.{isAdmin ? " Clique em “Vincular obra”." : ""}
                </p>
              ) : (
                scanlator.works.map((w) => (
                  <div key={w.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <Link href={`/works/${w.work.slug}`} className="min-w-0 flex-1 hover:underline">
                        <div className="font-medium text-white/90 truncate">{w.work.title}</div>
                        <div className="text-xs text-white/50">/{w.work.slug}</div>
                      </Link>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="chip">{w.work.type}</span>

                        {isAdmin ? (
                          <button
                            type="button"
                            onClick={() => void unlinkWork(w.work.id)}
                            disabled={adminLoading}
                            className="btn-ghost text-xs"
                            title="Desvincular"
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

          {/* Últimos capítulos */}
          <div className="card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-white/90">Últimos capítulos enviados</h2>
                <p className="muted mt-1 text-sm">Listagem rápida (últimos 30).</p>
              </div>

              <Link className="btn-secondary" href={`/scanlators/${scanlator.slug}/chapters`}>
                Gerenciar
              </Link>
            </div>

            <div className="mt-4 space-y-2">
              {scanlator.chapters.length === 0 ? (
                <p className="muted text-sm">Nenhum capítulo enviado ainda.</p>
              ) : (
                scanlator.chapters.map((c) => (
                  <div key={c.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium text-white/90 truncate">
                          {c.work.title} — {c.number ?? "?"} {c.title ? `(${c.title})` : ""}
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="chip">{c.kind}</span>
                          <span className="text-xs text-white/50">
                            {new Date(c.createdAt).toLocaleString("pt-BR")}
                          </span>
                        </div>
                      </div>

                      <Link className="btn-secondary" href={`/read/${c.id}`}>
                        Ler
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Modal Admin */}
        {isAdmin && adminModalOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-2xl card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold text-white/95">Vincular obra</div>
                  <div className="muted mt-1 text-sm">
                    Selecione uma obra para vincular a{" "}
                    <span className="font-medium text-white/90">{scanlator.name}</span>.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setAdminModalOpen(false)}
                  className="btn-ghost text-sm"
                  disabled={adminLoading}
                >
                  Fechar
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar por título/slug/tipo..."
                  className={cx(
                    "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm",
                    "text-white placeholder:text-white/40 outline-none",
                    "focus:ring-2 focus:ring-white/20"
                  )}
                  disabled={adminLoading}
                />

                <div className="rounded-2xl border border-white/10 max-h-72 overflow-auto bg-white/5">
                  {adminLoading ? (
                    <div className="p-4 text-sm text-white/70">Carregando...</div>
                  ) : filteredWorks.length === 0 ? (
                    <div className="p-4 text-sm text-white/70">Nenhuma obra encontrada.</div>
                  ) : (
                    <ul className="divide-y divide-white/10">
                      {filteredWorks.map((w) => {
                        const alreadyLinked = (
                          linkedWorkIds.length ? linkedWorkIds : linkedIdsFromServer
                        ).includes(w.id);

                        const selected = selectedWorkId === w.id;

                        return (
                          <li key={w.id} className="p-3 flex items-center justify-between gap-3">
                            <button
                              type="button"
                              className={cx(
                                "min-w-0 flex-1 text-left rounded-xl border px-3 py-2",
                                alreadyLinked
                                  ? "border-white/10 bg-white/5 opacity-70 cursor-not-allowed"
                                  : selected
                                  ? "border-white/25 bg-white/10"
                                  : "border-white/10 bg-transparent hover:bg-white/5"
                              )}
                              onClick={() => setSelectedWorkId(w.id)}
                              disabled={alreadyLinked || adminLoading}
                              title={alreadyLinked ? "Já vinculada" : "Selecionar"}
                            >
                              <div className="font-medium text-white/90 truncate">
                                {w.title}{" "}
                                {alreadyLinked ? (
                                  <span className="ml-2 text-xs rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-white/70">
                                    já vinculada
                                  </span>
                                ) : null}
                              </div>
                              <div className="text-xs text-white/50 truncate">/{w.slug}</div>
                            </button>

                            <span className="chip">{w.type}</span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-xs text-white/60">
                    Selecionada:{" "}
                    <span className="font-medium text-white/85">
                      {selectedWorkId ? selectedWorkId : "nenhuma"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedWorkId("")}
                      disabled={adminLoading || !selectedWorkId}
                      className={cx("btn-secondary", (!selectedWorkId || adminLoading) && "opacity-60")}
                    >
                      Limpar
                    </button>

                    <button
                      type="button"
                      onClick={() => void linkSelectedWork()}
                      disabled={adminLoading || !selectedWorkId}
                      className={cx(
                        "btn-primary",
                        (adminLoading || !selectedWorkId) && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {adminLoading ? "Aguarde..." : "Vincular"}
                    </button>
                  </div>
                </div>

                {adminErr ? (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                    {adminErr}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}