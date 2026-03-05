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
    <main className="min-h-screen bg-gray-50 p-6 text-gray-900">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Painel Admin</h1>
          <p className="text-sm text-gray-600 mt-1">
            Bem-vindo {me.name ?? me.email} ({roleLabel(me.role)})
          </p>
        </div>

        {/* Cards principais */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/admin/works"
            className="rounded-lg border bg-white p-4 hover:bg-gray-50"
          >
            <div className="text-sm font-semibold">Gerenciar Obras</div>
            <div className="mt-1 text-sm text-gray-600">
              Visualizar todas as obras e gerenciar tags.
            </div>
          </Link>

          <Link
            href="/admin/tags"
            className="rounded-lg border bg-white p-4 hover:bg-gray-50"
          >
            <div className="text-sm font-semibold">Gerenciar Tags</div>
            <div className="mt-1 text-sm text-gray-600">
              Criar e organizar os gêneros das obras.
            </div>
          </Link>

          <Link
            href="/admin/scanlators"
            className="rounded-lg border bg-white p-4 hover:bg-gray-50"
          >
            <div className="text-sm font-semibold">Gerenciar Scanlators</div>
            <div className="mt-1 text-sm text-gray-600">
              Criar e administrar as equipes de tradução.
            </div>
          </Link>
        </div>

        {/* Atalhos */}
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm font-semibold">Atalhos</div>

          <div className="flex flex-wrap gap-2 mt-3">
            <Link
              href="/"
              className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
            >
              Home
            </Link>

            <Link
              href="/works"
              className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
            >
              Ver Obras
            </Link>

            <Link
              href="/scanlators"
              className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
            >
              Ver Scanlators
            </Link>
          </div>
        </div>

        {/* Gerenciar usuários */}
        <section className="rounded-lg border bg-white p-4 space-y-4">
          <div>
            <div className="text-sm font-semibold">Gerenciar usuários</div>
            <p className="text-sm text-gray-600 mt-1">
              Alterar permissões sem abrir o banco.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filtrar por email ou id…"
              className="w-full sm:flex-1 rounded-md border px-3 py-2 text-sm"
            />

            <button
              type="button"
              onClick={() => void loadUsers()}
              disabled={loading}
              className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
            >
              {loading ? "Carregando..." : "Recarregar"}
            </button>
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          {!loading && filteredUsers.length === 0 && (
            <div className="text-sm text-gray-600">Nenhum usuário encontrado.</div>
          )}

          {!loading && filteredUsers.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">Role</th>
                    <th className="py-2 pr-4">Favoritos</th>
                    <th className="py-2 pr-4">Progresso</th>
                    <th className="py-2 pr-4">Ação</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map((u) => {
                    const draft = draftRoles[u.id] ?? u.role;
                    const changed = draft !== u.role;
                    const isSaving = savingId === u.id;

                    return (
                      <tr key={u.id} className="border-b">
                        <td className="py-2 pr-4">
                          <div className="font-medium">{u.email}</div>
                          <div className="text-xs text-gray-500">{u.id}</div>
                        </td>

                        <td className="py-2 pr-4">
                          <select
                            value={draft}
                            onChange={(e) => {
                              const v = e.target.value;
                              if (isRole(v)) setDraftRole(u.id, v);
                            }}
                            className="rounded-md border px-2 py-1 text-sm"
                          >
                            <option value="USER">USER</option>
                            <option value="SCAN">SCAN</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        </td>

                        <td className="py-2 pr-4">{u._count.favorites}</td>
                        <td className="py-2 pr-4">{u._count.readingProgresses}</td>

                        <td className="py-2 pr-4">
                          <button
                            type="button"
                            className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
                            disabled={!changed || isSaving}
                            onClick={() => void saveRole(u.id)}
                          >
                            {isSaving ? "Salvando..." : "Salvar"}
                          </button>

                          <div className="text-xs text-gray-500 mt-1">
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
      </div>
    </main>
  );
}