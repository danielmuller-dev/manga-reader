"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";

type Role = "USER" | "SCAN" | "ADMIN";

type User = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
};

type ScanlatorRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    members: number;
    works: number;
    chapters: number;
  };
};

type GetScanlatorsResponse = { scanlators: ScanlatorRow[] } | { error: string };

type CreateScanlatorBody = {
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
};

type CreateScanlatorResponse =
  | { scanlator: { id: string; name: string; slug: string; createdAt: string; updatedAt: string } }
  | { error: string };

type MemberRole = "OWNER" | "EDITOR" | "UPLOADER";

type ScanlatorMemberRow = {
  id: string;
  role: MemberRole;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: Role;
  };
};

type GetMembersResponse =
  | { scanlator: { id: string; name: string; slug: string }; members: ScanlatorMemberRow[] }
  | { error: string };

type AddMemberBody = {
  email: string;
  role: MemberRole;
};

type AddMemberResponse = { member: ScanlatorMemberRow } | { error: string };

type RemoveMemberBody = { userId: string } | { email: string };

type RemoveMemberResponse = { ok: true } | { error: string };

function slugify(input: string): string {
  const s = input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return s;
}

function toEmail(value: string): string | null {
  const s = value.trim().toLowerCase();
  return s.length ? s : null;
}

function roleLabel(r: MemberRole): string {
  if (r === "OWNER") return "Owner";
  if (r === "UPLOADER") return "Uploader";
  return "Editor";
}

export default function AdminScanlatorsClient({ me }: { me: User }) {
  const [loading, setLoading] = useState<boolean>(false);
  const [creating, setCreating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const [scanlators, setScanlators] = useState<ScanlatorRow[]>([]);
  const [filter, setFilter] = useState<string>("");

  const [name, setName] = useState<string>("");
  const [slug, setSlug] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [logoUrl, setLogoUrl] = useState<string>("");

  // ===== Membros =====
  const [openId, setOpenId] = useState<string | null>(null);

  const [membersByScanlator, setMembersByScanlator] = useState<Record<string, ScanlatorMemberRow[]>>(
    {}
  );
  const [membersLoadingByScanlator, setMembersLoadingByScanlator] = useState<Record<string, boolean>>(
    {}
  );
  const [membersErrorByScanlator, setMembersErrorByScanlator] = useState<Record<string, string | null>>(
    {}
  );

  const [addEmailByScanlator, setAddEmailByScanlator] = useState<Record<string, string>>({});
  const [addRoleByScanlator, setAddRoleByScanlator] = useState<Record<string, MemberRole>>({});
  const [addLoadingByScanlator, setAddLoadingByScanlator] = useState<Record<string, boolean>>({});

  const [removeLoadingByMemberId, setRemoveLoadingByMemberId] = useState<Record<string, boolean>>(
    {}
  );

  async function loadScanlators() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/scanlators", { method: "GET" });
      const data = (await res.json()) as GetScanlatorsResponse;

      if (!res.ok) {
        const msg = "error" in data ? data.error : "Erro ao buscar scanlators.";
        setError(msg);
        setScanlators([]);
        return;
      }

      if (!("scanlators" in data)) {
        setError("Resposta inválida do servidor.");
        setScanlators([]);
        return;
      }

      setScanlators(data.scanlators);
    } catch {
      setError("Falha de rede ao buscar scanlators.");
      setScanlators([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadMembers(scanlatorId: string) {
    setMembersLoadingByScanlator((prev) => ({ ...prev, [scanlatorId]: true }));
    setMembersErrorByScanlator((prev) => ({ ...prev, [scanlatorId]: null }));

    try {
      const res = await fetch(`/api/admin/scanlators/${scanlatorId}/members`, { method: "GET" });
      const data = (await res.json()) as GetMembersResponse;

      if (!res.ok) {
        const msg = "error" in data ? data.error : "Erro ao buscar membros.";
        setMembersErrorByScanlator((prev) => ({ ...prev, [scanlatorId]: msg }));
        setMembersByScanlator((prev) => ({ ...prev, [scanlatorId]: [] }));
        return;
      }

      if (!("members" in data)) {
        setMembersErrorByScanlator((prev) => ({ ...prev, [scanlatorId]: "Resposta inválida do servidor." }));
        setMembersByScanlator((prev) => ({ ...prev, [scanlatorId]: [] }));
        return;
      }

      setMembersByScanlator((prev) => ({ ...prev, [scanlatorId]: data.members }));
    } catch {
      setMembersErrorByScanlator((prev) => ({ ...prev, [scanlatorId]: "Falha de rede ao buscar membros." }));
      setMembersByScanlator((prev) => ({ ...prev, [scanlatorId]: [] }));
    } finally {
      setMembersLoadingByScanlator((prev) => ({ ...prev, [scanlatorId]: false }));
    }
  }

  async function addMember(scanlatorId: string, e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setMembersErrorByScanlator((prev) => ({ ...prev, [scanlatorId]: null }));
    setOkMsg(null);

    const rawEmail = addEmailByScanlator[scanlatorId] ?? "";
    const email = toEmail(rawEmail);
    if (!email) {
      setMembersErrorByScanlator((prev) => ({ ...prev, [scanlatorId]: "Email é obrigatório." }));
      return;
    }

    const role: MemberRole = addRoleByScanlator[scanlatorId] ?? "EDITOR";

    const body: AddMemberBody = { email, role };

    setAddLoadingByScanlator((prev) => ({ ...prev, [scanlatorId]: true }));
    try {
      const res = await fetch(`/api/admin/scanlators/${scanlatorId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = (await res.json()) as AddMemberResponse;

      if (!res.ok) {
        const msg = "error" in data ? data.error : "Erro ao adicionar membro.";
        setMembersErrorByScanlator((prev) => ({ ...prev, [scanlatorId]: msg }));
        return;
      }

      if (!("member" in data)) {
        setMembersErrorByScanlator((prev) => ({ ...prev, [scanlatorId]: "Resposta inválida do servidor." }));
        return;
      }

      setOkMsg(`Membro adicionado: ${data.member.user.email} (${roleLabel(data.member.role)})`);

      setAddEmailByScanlator((prev) => ({ ...prev, [scanlatorId]: "" }));
      setAddRoleByScanlator((prev) => ({ ...prev, [scanlatorId]: "EDITOR" }));

      await loadMembers(scanlatorId);
      await loadScanlators(); // atualiza contadores
    } catch {
      setMembersErrorByScanlator((prev) => ({ ...prev, [scanlatorId]: "Falha de rede ao adicionar membro." }));
    } finally {
      setAddLoadingByScanlator((prev) => ({ ...prev, [scanlatorId]: false }));
    }
  }

  async function removeMember(scanlatorId: string, member: ScanlatorMemberRow) {
    setMembersErrorByScanlator((prev) => ({ ...prev, [scanlatorId]: null }));
    setOkMsg(null);

    setRemoveLoadingByMemberId((prev) => ({ ...prev, [member.id]: true }));

    const body: RemoveMemberBody = { userId: member.user.id };

    try {
      const res = await fetch(`/api/admin/scanlators/${scanlatorId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = (await res.json()) as RemoveMemberResponse;

      if (!res.ok) {
        const msg = "error" in data ? data.error : "Erro ao remover membro.";
        setMembersErrorByScanlator((prev) => ({ ...prev, [scanlatorId]: msg }));
        return;
      }

      if (!("ok" in data)) {
        setMembersErrorByScanlator((prev) => ({ ...prev, [scanlatorId]: "Resposta inválida do servidor." }));
        return;
      }

      setOkMsg(`Membro removido: ${member.user.email}`);

      await loadMembers(scanlatorId);
      await loadScanlators(); // atualiza contadores
    } catch {
      setMembersErrorByScanlator((prev) => ({ ...prev, [scanlatorId]: "Falha de rede ao remover membro." }));
    } finally {
      setRemoveLoadingByMemberId((prev) => ({ ...prev, [member.id]: false }));
    }
  }

  useEffect(() => {
    void loadScanlators();
  }, []);

  // auto slug: só preenche automaticamente se o usuário ainda não digitou um slug
  useEffect(() => {
    const auto = slugify(name);
    setSlug((prev) => (prev.trim().length ? prev : auto));
  }, [name]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return scanlators;

    return scanlators.filter((s) => {
      const hay = `${s.name} ${s.slug} ${s.id}`.toLowerCase();
      return hay.includes(q);
    });
  }, [filter, scanlators]);

  async function createScanlator(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setOkMsg(null);

    const cleanName = name.trim();
    const cleanSlug = slugify(slug);

    if (!cleanName) {
      setError("Nome é obrigatório.");
      return;
    }

    if (!cleanSlug) {
      setError("Slug é obrigatório.");
      return;
    }

    const body: CreateScanlatorBody = {
      name: cleanName,
      slug: cleanSlug,
      description: description.trim().length ? description.trim() : null,
      logoUrl: logoUrl.trim().length ? logoUrl.trim() : null,
    };

    setCreating(true);
    try {
      const res = await fetch("/api/admin/scanlators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = (await res.json()) as CreateScanlatorResponse;

      if (!res.ok) {
        const msg = "error" in data ? data.error : "Erro ao criar scanlator.";
        setError(msg);
        return;
      }

      if (!("scanlator" in data)) {
        setError("Resposta inválida do servidor ao criar.");
        return;
      }

      setOkMsg(`Scanlator criada: ${data.scanlator.name} (${data.scanlator.slug})`);

      setName("");
      setSlug("");
      setDescription("");
      setLogoUrl("");

      await loadScanlators();
    } catch {
      setError("Falha de rede ao criar scanlator.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 text-gray-900">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Admin • Scanlators</h1>
            <p className="text-sm text-gray-600 mt-1">
              Logado como {me.name ?? me.email} ({me.role})
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/admin"
              className="rounded-md border bg-white px-3 py-2 text-sm hover:bg-gray-50"
            >
              Voltar
            </Link>
          </div>
        </div>

        <section className="rounded-lg border bg-white p-4 space-y-4">
          <div>
            <div className="text-sm font-semibold">Criar scanlator</div>
            <p className="text-sm text-gray-600 mt-1">
              Preencha os dados básicos. O slug precisa ser único.
            </p>
          </div>

          <form onSubmit={createScanlator} className="grid gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium">Nome</label>
                <input
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: MinhaScan"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Slug</label>
                <input
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="Ex: minha-scan"
                  required
                />
                <div className="mt-1 text-xs text-gray-500">
                  URL ficará: <span className="font-mono">/scanlators/{slugify(slug || name)}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium">Descrição (opcional)</label>
              <textarea
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Sobre a scan..."
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Logo URL (opcional)</label>
              <input
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            {error ? <div className="text-sm text-red-600">{error}</div> : null}
            {okMsg ? <div className="text-sm text-emerald-700">{okMsg}</div> : null}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={creating}
                className="rounded-md bg-black px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-60"
              >
                {creating ? "Criando..." : "Criar scanlator"}
              </button>

              <button
                type="button"
                onClick={() => void loadScanlators()}
                disabled={loading}
                className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
              >
                {loading ? "Carregando..." : "Recarregar lista"}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-lg border bg-white p-4 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-semibold">Scanlators existentes</div>
              <p className="text-sm text-gray-600 mt-1">Total: {scanlators.length}</p>
            </div>

            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filtrar por nome/slug/id…"
              className="w-full sm:w-[320px] rounded-md border px-3 py-2 text-sm"
            />
          </div>

          {loading ? <div className="text-sm text-gray-600">Carregando…</div> : null}

          {!loading && filtered.length === 0 ? (
            <div className="text-sm text-gray-600">Nenhuma scanlator encontrada.</div>
          ) : null}

          {!loading && filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 pr-4">Nome</th>
                    <th className="py-2 pr-4">Slug</th>
                    <th className="py-2 pr-4">Membros</th>
                    <th className="py-2 pr-4">Obras</th>
                    <th className="py-2 pr-4">Capítulos</th>
                    <th className="py-2 pr-4">Link</th>
                    <th className="py-2 pr-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => {
                    const isOpen = openId === s.id;
                    const members = membersByScanlator[s.id] ?? [];
                    const mLoading = membersLoadingByScanlator[s.id] ?? false;
                    const mError = membersErrorByScanlator[s.id] ?? null;

                    const addEmail = addEmailByScanlator[s.id] ?? "";
                    const addRole = addRoleByScanlator[s.id] ?? "EDITOR";
                    const addLoading = addLoadingByScanlator[s.id] ?? false;

                    return (
                      <>
                        <tr key={s.id} className="border-b">
                          <td className="py-2 pr-4">
                            <div className="font-medium">{s.name}</div>
                            <div className="text-xs text-gray-500">{s.id}</div>
                          </td>
                          <td className="py-2 pr-4 font-mono">{s.slug}</td>
                          <td className="py-2 pr-4">{s._count.members}</td>
                          <td className="py-2 pr-4">{s._count.works}</td>
                          <td className="py-2 pr-4">{s._count.chapters}</td>
                          <td className="py-2 pr-4">
                            <Link className="underline" href={`/scanlators/${s.slug}`}>
                              Abrir
                            </Link>
                          </td>
                          <td className="py-2 pr-4">
                            <button
                              type="button"
                              className="rounded-md border bg-white px-3 py-1.5 text-xs hover:bg-gray-50"
                              onClick={() => {
                                setOkMsg(null);
                                setMembersErrorByScanlator((prev) => ({ ...prev, [s.id]: null }));

                                setOpenId((prev) => (prev === s.id ? null : s.id));

                                const alreadyLoaded = (membersByScanlator[s.id] ?? null) !== null;
                                const hasData = Array.isArray(membersByScanlator[s.id]);
                                if (!isOpen && (!hasData || membersByScanlator[s.id] === undefined)) {
                                  void loadMembers(s.id);
                                }
                                if (!isOpen && alreadyLoaded && membersByScanlator[s.id] === undefined) {
                                  void loadMembers(s.id);
                                }
                              }}
                            >
                              {isOpen ? "Fechar membros" : "Gerenciar membros"}
                            </button>
                          </td>
                        </tr>

                        {isOpen ? (
                          <tr key={`${s.id}-members`} className="border-b bg-gray-50/50">
                            <td colSpan={7} className="py-3 pr-4">
                              <div className="grid gap-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <div className="text-sm font-semibold">Membros • {s.name}</div>
                                    <div className="text-xs text-gray-600">
                                      Adicione por email e defina a role dentro da scanlator.
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => void loadMembers(s.id)}
                                    disabled={mLoading}
                                    className="rounded-md border bg-white px-3 py-1.5 text-xs hover:bg-gray-50 disabled:opacity-60"
                                  >
                                    {mLoading ? "Atualizando..." : "Recarregar membros"}
                                  </button>
                                </div>

                                <form
                                  onSubmit={(e) => void addMember(s.id, e)}
                                  className="grid gap-2 sm:grid-cols-[1fr_180px_auto]"
                                >
                                  <div>
                                    <label className="block text-xs font-medium">Email do usuário</label>
                                    <input
                                      className="mt-1 w-full rounded-md border px-3 py-2 text-sm bg-white"
                                      value={addEmail}
                                      onChange={(e) =>
                                        setAddEmailByScanlator((prev) => ({
                                          ...prev,
                                          [s.id]: e.target.value,
                                        }))
                                      }
                                      placeholder="email@dominio.com"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-xs font-medium">Role</label>
                                    <select
                                      className="mt-1 w-full rounded-md border px-3 py-2 text-sm bg-white"
                                      value={addRole}
                                      onChange={(e) => {
                                        const v = e.target.value as MemberRole;
                                        setAddRoleByScanlator((prev) => ({ ...prev, [s.id]: v }));
                                      }}
                                    >
                                      <option value="OWNER">OWNER</option>
                                      <option value="EDITOR">EDITOR</option>
                                      <option value="UPLOADER">UPLOADER</option>
                                    </select>
                                  </div>

                                  <div className="flex items-end">
                                    <button
                                      type="submit"
                                      disabled={addLoading}
                                      className="w-full sm:w-auto rounded-md bg-black px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-60"
                                    >
                                      {addLoading ? "Adicionando..." : "Adicionar"}
                                    </button>
                                  </div>
                                </form>

                                {mError ? <div className="text-sm text-red-600">{mError}</div> : null}
                                {okMsg ? <div className="text-sm text-emerald-700">{okMsg}</div> : null}

                                {mLoading ? (
                                  <div className="text-sm text-gray-600">Carregando membros…</div>
                                ) : null}

                                {!mLoading && members.length === 0 ? (
                                  <div className="text-sm text-gray-600">Nenhum membro cadastrado ainda.</div>
                                ) : null}

                                {!mLoading && members.length > 0 ? (
                                  <div className="overflow-x-auto rounded-md border bg-white">
                                    <table className="min-w-full text-sm">
                                      <thead>
                                        <tr className="text-left border-b">
                                          <th className="py-2 px-3">Usuário</th>
                                          <th className="py-2 px-3">Role (scanlator)</th>
                                          <th className="py-2 px-3">Criado em</th>
                                          <th className="py-2 px-3">Ações</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {members.map((m) => {
                                          const removing = removeLoadingByMemberId[m.id] ?? false;
                                          return (
                                            <tr key={m.id} className="border-b last:border-b-0">
                                              <td className="py-2 px-3">
                                                <div className="font-medium">{m.user.name ?? m.user.email}</div>
                                                <div className="text-xs text-gray-500">
                                                  {m.user.email} • userRole: {m.user.role}
                                                </div>
                                              </td>
                                              <td className="py-2 px-3 font-mono">{m.role}</td>
                                              <td className="py-2 px-3 text-xs text-gray-600">
                                                {new Date(m.createdAt).toLocaleString("pt-BR")}
                                              </td>
                                              <td className="py-2 px-3">
                                                <button
                                                  type="button"
                                                  disabled={removing}
                                                  onClick={() => void removeMember(s.id, m)}
                                                  className="rounded-md border px-3 py-1.5 text-xs hover:bg-gray-50 disabled:opacity-60"
                                                >
                                                  {removing ? "Removendo..." : "Remover"}
                                                </button>
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}