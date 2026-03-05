"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Role = "USER" | "SCAN" | "ADMIN";

type User = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
};

type AdminUserRow = {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
  _count: {
    favorites: number;
    readingProgresses: number;
  };
};

type GetUsersResponse = { users: AdminUserRow[] } | { error: string };

type PostUpdateRoleBody = {
  userId: string;
  role: Role;
};

type PostUpdateRoleResponse =
  | { user: { id: string; email: string; role: Role; updatedAt: string } }
  | { error: string };

function isRole(value: string): value is Role {
  return value === "USER" || value === "SCAN" || value === "ADMIN";
}

function roleLabel(role: Role) {
  if (role === "ADMIN") return "ADMIN";
  if (role === "SCAN") return "SCAN";
  return "USER";
}

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function initialsFromEmail(email: string) {
  const s = email.trim();
  if (!s) return "U";
  const left = s.split("@")[0] || "u";
  const a = left[0]?.toUpperCase() ?? "U";
  const b = left[1]?.toUpperCase() ?? "";
  return `${a}${b}`;
}

export default function AdminClient({ me }: { me: User }) {
  const [loading, setLoading] = useState<boolean>(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [filter, setFilter] = useState<string>("");

  const [draftRoles, setDraftRoles] = useState<Record<string, Role>>({});

  async function loadUsers() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/users", { method: "GET" });
      const data = (await res.json()) as GetUsersResponse;

      if (!res.ok) {
        const msg = "error" in data ? data.error : "Erro ao buscar usuários.";
        setError(msg);
        setUsers([]);
        setDraftRoles({});
        return;
      }

      if (!("users" in data)) {
        setError("Resposta inválida do servidor.");
        setUsers([]);
        setDraftRoles({});
        return;
      }

      setUsers(data.users);

      const initialDraft: Record<string, Role> = {};
      for (const u of data.users) {
        initialDraft[u.id] = u.role;
      }
      setDraftRoles(initialDraft);
    } catch {
      setError("Falha de rede ao buscar usuários.");
      setUsers([]);
      setDraftRoles({});
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return users;

    return users.filter((u) => {
      const hay = `${u.email} ${u.id}`.toLowerCase();
      return hay.includes(q);
    });
  }, [filter, users]);

  const meLabel = useMemo(() => {
    const name = (me.name ?? "").trim();
    return name ? name : me.email;
  }, [me.email, me.name]);

  function setDraftRole(userId: string, role: Role) {
    setDraftRoles((prev) => ({ ...prev, [userId]: role }));
  }

  async function saveRole(userId: string) {
    const role = draftRoles[userId];
    if (!role) return;

    setSavingId(userId);
    setError(null);

    const body: PostUpdateRoleBody = { userId, role };

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = (await res.json()) as PostUpdateRoleResponse;

      if (!res.ok) {
        const msg = "error" in data ? data.error : "Erro ao atualizar role.";
        setError(msg);
        return;
      }

      if (!("user" in data)) {
        setError("Resposta inválida do servidor ao salvar.");
        return;
      }

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, role: data.user.role, updatedAt: data.user.updatedAt }
            : u
        )
      );

      setDraftRoles((prev) => ({ ...prev, [userId]: data.user.role }));
    } catch {
      setError("Falha de rede ao salvar role.");
    } finally {
      setSavingId(null);
    }
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
        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">Painel Admin</h1>
            <p className="muted text-sm">
              Bem-vindo <span className="font-medium text-white/90">{meLabel}</span>{" "}
              <span className="text-white/50">({roleLabel(me.role)})</span>
            </p>
          </div>

          <nav className="flex flex-wrap items-center gap-2">
            <Link className="btn-secondary" href="/">
              Home
            </Link>
            <Link className="btn-secondary" href="/works">
              Obras
            </Link>
            <Link className="btn-secondary" href="/scanlators">
              Scanlators
            </Link>
          </nav>
        </header>

        {/* Cards principais */}
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/admin/works"
            className="card card-hover p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-white/90">Gerenciar Obras</div>
                <div className="muted mt-1 text-sm">
                  Visualizar todas as obras e gerenciar tags.
                </div>
              </div>
              <span className="chip">Works</span>
            </div>
          </Link>

          <Link
            href="/admin/tags"
            className="card card-hover p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-white/90">Gerenciar Tags</div>
                <div className="muted mt-1 text-sm">Criar e organizar os gêneros das obras.</div>
              </div>
              <span className="chip">Tags</span>
            </div>
          </Link>

          <Link
            href="/admin/scanlators"
            className="card card-hover p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-white/90">Gerenciar Scanlators</div>
                <div className="muted mt-1 text-sm">Criar e administrar equipes de tradução.</div>
              </div>
              <span className="chip">Teams</span>
            </div>
          </Link>
        </section>

        {/* Gerenciar usuários */}
        <section className="card p-5 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-sm font-semibold text-white/90">Gerenciar usuários</div>
              <p className="muted mt-1 text-sm">Alterar permissões sem abrir o banco.</p>
            </div>

            <button
              type="button"
              onClick={() => void loadUsers()}
              disabled={loading}
              className="btn-secondary"
              title="Recarregar lista de usuários"
            >
              {loading ? "Carregando..." : "Recarregar"}
            </button>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filtrar por email ou id…"
              className={cx(
                "w-full sm:flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm",
                "text-white placeholder:text-white/40 outline-none",
                "focus:ring-2 focus:ring-white/20"
              )}
            />

            <div className="flex items-center gap-2">
              <span className="chip">{filteredUsers.length}</span>
              <span className="text-xs text-white/60">resultados</span>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {!loading && filteredUsers.length === 0 && (
            <div className="muted text-sm">Nenhum usuário encontrado.</div>
          )}

          {!loading && filteredUsers.length > 0 && (
            <div className="overflow-x-auto rounded-2xl border border-white/10">
              <table className="min-w-full text-sm">
                <thead className="bg-white/5">
                  <tr className="text-left text-white/80">
                    <th className="py-3 px-4">Usuário</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Favoritos</th>
                    <th className="py-3 px-4">Progresso</th>
                    <th className="py-3 px-4">Ação</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map((u) => {
                    const draft = draftRoles[u.id] ?? u.role;
                    const changed = draft !== u.role;
                    const isSaving = savingId === u.id;

                    return (
                      <tr key={u.id} className="border-t border-white/10">
                        <td className="py-3 px-4">
                          <div className="flex items-start gap-3">
                            <div className="h-9 w-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-xs text-white/80 shrink-0">
                              {initialsFromEmail(u.email)}
                            </div>

                            <div className="min-w-0">
                              <div className="font-medium text-white/90 truncate">{u.email}</div>
                              <div className="text-xs text-white/50 truncate">{u.id}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <select
                            value={draft}
                            onChange={(e) => {
                              const v = e.target.value;
                              if (isRole(v)) setDraftRole(u.id, v);
                            }}
                            className={cx(
                              "rounded-xl border border-white/10 bg-white/5 px-2 py-2 text-sm",
                              "text-white outline-none",
                              "focus:ring-2 focus:ring-white/20"
                            )}
                          >
                            <option value="USER">USER</option>
                            <option value="SCAN">SCAN</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>

                          {changed ? <div className="mt-2 text-xs text-white/60">Alterado</div> : null}
                        </td>

                        <td className="py-3 px-4 text-white/80">{u._count.favorites}</td>
                        <td className="py-3 px-4 text-white/80">{u._count.readingProgresses}</td>

                        <td className="py-3 px-4">
                          <button
                            type="button"
                            className={cx("btn-secondary", (!changed || isSaving) && "opacity-60")}
                            disabled={!changed || isSaving}
                            onClick={() => void saveRole(u.id)}
                          >
                            {isSaving ? "Salvando..." : "Salvar"}
                          </button>

                          <div className="text-xs text-white/50 mt-2">
                            Atualizado: {new Date(u.updatedAt).toLocaleString()}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="card p-4">
          <p className="text-xs text-white/70">
            Segurança: mantenha o papel <span className="font-medium text-white/85">ADMIN</span>{" "}
            restrito e evite promover contas que você não controla.
          </p>
        </div>
      </div>
    </main>
  );
}