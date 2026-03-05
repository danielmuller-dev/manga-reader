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

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

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

function userInitials(label: string) {
  const s = label.trim();
  if (!s) return "U";
  const left = s.split("@")[0] || "u";
  const a = left[0]?.toUpperCase() ?? "U";
  const b = left[1]?.toUpperCase() ?? "";
  return `${a}${b}`;
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
        setMembersErrorByScanlator((prev) => ({
          ...prev,
          [scanlatorId]: "Resposta inválida do servidor.",
        }));
        setMembersByScanlator((prev) => ({ ...prev, [scanlatorId]: [] }));
        return;
      }

      setMembersByScanlator((prev) => ({ ...prev, [scanlatorId]: data.members }));
    } catch {
      setMembersErrorByScanlator((prev) => ({
        ...prev,
        [scanlatorId]: "Falha de rede ao buscar membros.",
      }));
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
        setMembersErrorByScanlator((prev) => ({
          ...prev,
          [scanlatorId]: "Resposta inválida do servidor.",
        }));
        return;
      }

      setOkMsg(`Membro adicionado: ${data.member.user.email} (${roleLabel(data.member.role)})`);

      setAddEmailByScanlator((prev) => ({ ...prev, [scanlatorId]: "" }));
      setAddRoleByScanlator((prev) => ({ ...prev, [scanlatorId]: "EDITOR" }));

      await loadMembers(scanlatorId);
      await loadScanlators(); // atualiza contadores
    } catch {
      setMembersErrorByScanlator((prev) => ({
        ...prev,
        [scanlatorId]: "Falha de rede ao adicionar membro.",
      }));
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
        setMembersErrorByScanlator((prev) => ({
          ...prev,
          [scanlatorId]: "Resposta inválida do servidor.",
        }));
        return;
      }

      setOkMsg(`Membro removido: ${member.user.email}`);

      await loadMembers(scanlatorId);
      await loadScanlators(); // atualiza contadores
    } catch {
      setMembersErrorByScanlator((prev) => ({
        ...prev,
        [scanlatorId]: "Falha de rede ao remover membro.",
      }));
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

  const topMsgClass = useMemo(() => {
    if (error) return "border-red-500/30 bg-red-500/10 text-red-200";
    if (okMsg) return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
    return null;
  }, [error, okMsg]);

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
          <div>
            <h1 className="text-2xl font-semibold">Admin • Scanlators</h1>
            <p className="muted mt-1 text-sm">
              Logado como{" "}
              <span className="font-medium text-white/90">{me.name ?? me.email}</span>{" "}
              <span className="text-white/50">({me.role})</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link className="btn-secondary" href="/admin">
              Voltar
            </Link>
            <Link className="btn-secondary" href="/scanlators">
              Ver Scanlators
            </Link>
          </div>
        </header>

        {/* Global messages */}
        {topMsgClass ? (
          <div className={cx("rounded-2xl border p-4 text-sm", topMsgClass)}>
            {error ?? okMsg}
          </div>
        ) : null}

        {/* Create */}
        <section className="card p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-white/90">Criar scanlator</div>
              <p className="muted mt-1 text-sm">
                Preencha os dados básicos. O slug precisa ser único.
              </p>
            </div>
            <span className="chip">Create</span>
          </div>

          <form onSubmit={(e) => void createScanlator(e)} className="grid gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-white/80">Nome</label>
                <input
                  className={cx(
                    "mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm",
                    "text-white placeholder:text-white/40 outline-none",
                    "focus:ring-2 focus:ring-white/20"
                  )}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: MinhaScan"
                  required
                  disabled={creating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80">Slug</label>
                <input
                  className={cx(
                    "mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm",
                    "text-white placeholder:text-white/40 outline-none",
                    "focus:ring-2 focus:ring-white/20"
                  )}
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="Ex: minha-scan"
                  required
                  disabled={creating}
                />
                <div className="mt-1 text-xs text-white/50">
                  URL ficará:{" "}
                  <span className="font-mono text-white/70">
                    /scanlators/{slugify(slug || name)}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80">Descrição (opcional)</label>
              <textarea
                className={cx(
                  "mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm",
                  "text-white placeholder:text-white/40 outline-none",
                  "focus:ring-2 focus:ring-white/20"
                )}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Sobre a scan..."
                rows={3}
                disabled={creating}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80">Logo URL (opcional)</label>
              <input
                className={cx(
                  "mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm",
                  "text-white placeholder:text-white/40 outline-none",
                  "focus:ring-2 focus:ring-white/20"
                )}
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://..."
                disabled={creating}
              />
              <p className="muted mt-2 text-xs">
                Futuro: aqui entra Vercel Blob (upload de logo e capas), mantendo URLs estáveis.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button type="submit" disabled={creating} className={cx("btn-primary", creating && "opacity-70")}>
                {creating ? "Criando..." : "Criar scanlator"}
              </button>

              <button
                type="button"
                onClick={() => void loadScanlators()}
                disabled={loading}
                className={cx("btn-secondary", loading && "opacity-70")}
              >
                {loading ? "Carregando..." : "Recarregar lista"}
              </button>
            </div>
          </form>
        </section>

        {/* List */}
        <section className="card p-5 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-semibold text-white/90">Scanlators existentes</div>
              <p className="muted mt-1 text-sm">Total: {scanlators.length}</p>
            </div>

            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filtrar por nome/slug/id…"
              className={cx(
                "w-full sm:w-[360px] rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm",
                "text-white placeholder:text-white/40 outline-none",
                "focus:ring-2 focus:ring-white/20"
              )}
            />
          </div>

          {loading ? <div className="muted text-sm">Carregando…</div> : null}

          {!loading && filtered.length === 0 ? (
            <div className="muted text-sm">Nenhuma scanlator encontrada.</div>
          ) : null}

          {!loading && filtered.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-white/10">
              <table className="min-w-full text-sm">
                <thead className="bg-white/5">
                  <tr className="text-left text-white/80">
                    <th className="py-3 px-4">Nome</th>
                    <th className="py-3 px-4">Slug</th>
                    <th className="py-3 px-4">Membros</th>
                    <th className="py-3 px-4">Obras</th>
                    <th className="py-3 px-4">Capítulos</th>
                    <th className="py-3 px-4">Link</th>
                    <th className="py-3 px-4">Ações</th>
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
                        <tr key={s.id} className="border-t border-white/10">
                          <td className="py-3 px-4">
                            <div className="flex items-start gap-3">
                              <div className="h-10 w-10 rounded-xl border border-white/10 bg-white/5 overflow-hidden flex items-center justify-center text-xs text-white/70 shrink-0">
                                {s.logoUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={s.logoUrl}
                                    alt={s.name}
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                    decoding="async"
                                  />
                                ) : (
                                  <span>{userInitials(s.name)}</span>
                                )}
                              </div>

                              <div className="min-w-0">
                                <div className="font-medium text-white/90 truncate">{s.name}</div>
                                <div className="text-xs text-white/50 truncate">{s.id}</div>
                                {s.description ? (
                                  <div className="mt-1 text-xs text-white/60 line-clamp-2">
                                    {s.description}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4 font-mono text-white/80">{s.slug}</td>
                          <td className="py-3 px-4 text-white/80">{s._count.members}</td>
                          <td className="py-3 px-4 text-white/80">{s._count.works}</td>
                          <td className="py-3 px-4 text-white/80">{s._count.chapters}</td>

                          <td className="py-3 px-4">
                            <Link className="btn-secondary" href={`/scanlators/${s.slug}`}>
                              Abrir
                            </Link>
                          </td>

                          <td className="py-3 px-4">
                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={() => {
                                setOkMsg(null);
                                setMembersErrorByScanlator((prev) => ({ ...prev, [s.id]: null }));
                                setOpenId((prev) => (prev === s.id ? null : s.id));

                                const hasData = Array.isArray(membersByScanlator[s.id]);
                                if (!isOpen && (!hasData || membersByScanlator[s.id] === undefined)) {
                                  void loadMembers(s.id);
                                }
                              }}
                            >
                              {isOpen ? "Fechar membros" : "Gerenciar membros"}
                            </button>
                          </td>
                        </tr>

                        {isOpen ? (
                          <tr key={`${s.id}-members`} className="border-t border-white/10 bg-white/5">
                            <td colSpan={7} className="p-4">
                              <div className="grid gap-4">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                  <div>
                                    <div className="text-sm font-semibold text-white/90">
                                      Membros • {s.name}
                                    </div>
                                    <div className="muted mt-1 text-xs">
                                      Adicione por email e defina a role dentro da scanlator.
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => void loadMembers(s.id)}
                                    disabled={mLoading}
                                    className={cx("btn-secondary", mLoading && "opacity-70")}
                                  >
                                    {mLoading ? "Atualizando..." : "Recarregar membros"}
                                  </button>
                                </div>

                                <form
                                  onSubmit={(e) => void addMember(s.id, e)}
                                  className="grid gap-2 sm:grid-cols-[1fr_220px_auto]"
                                >
                                  <div>
                                    <label className="block text-xs font-medium text-white/80">
                                      Email do usuário
                                    </label>
                                    <input
                                      className={cx(
                                        "mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm",
                                        "text-white placeholder:text-white/40 outline-none",
                                        "focus:ring-2 focus:ring-white/20"
                                      )}
                                      value={addEmail}
                                      onChange={(e) =>
                                        setAddEmailByScanlator((prev) => ({
                                          ...prev,
                                          [s.id]: e.target.value,
                                        }))
                                      }
                                      placeholder="email@dominio.com"
                                      disabled={addLoading}
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-xs font-medium text-white/80">Role</label>
                                    <select
                                      className={cx(
                                        "mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm",
                                        "text-white outline-none",
                                        "focus:ring-2 focus:ring-white/20"
                                      )}
                                      value={addRole}
                                      onChange={(e) => {
                                        const v = e.target.value as MemberRole;
                                        setAddRoleByScanlator((prev) => ({ ...prev, [s.id]: v }));
                                      }}
                                      disabled={addLoading}
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
                                      className={cx("btn-primary", addLoading && "opacity-70")}
                                    >
                                      {addLoading ? "Adicionando..." : "Adicionar"}
                                    </button>
                                  </div>
                                </form>

                                {mError ? (
                                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                                    {mError}
                                  </div>
                                ) : null}

                                {okMsg ? (
                                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                                    {okMsg}
                                  </div>
                                ) : null}

                                {mLoading ? <div className="muted text-sm">Carregando membros…</div> : null}

                                {!mLoading && members.length === 0 ? (
                                  <div className="muted text-sm">Nenhum membro cadastrado ainda.</div>
                                ) : null}

                                {!mLoading && members.length > 0 ? (
                                  <div className="overflow-x-auto rounded-2xl border border-white/10">
                                    <table className="min-w-full text-sm">
                                      <thead className="bg-white/5">
                                        <tr className="text-left text-white/80">
                                          <th className="py-3 px-4">Usuário</th>
                                          <th className="py-3 px-4">Role (scanlator)</th>
                                          <th className="py-3 px-4">Criado em</th>
                                          <th className="py-3 px-4">Ações</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {members.map((m) => {
                                          const removing = removeLoadingByMemberId[m.id] ?? false;
                                          const label = m.user.name ?? m.user.email;
                                          return (
                                            <tr key={m.id} className="border-t border-white/10">
                                              <td className="py-3 px-4">
                                                <div className="flex items-start gap-3">
                                                  <div className="h-9 w-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-xs text-white/70 shrink-0">
                                                    {userInitials(m.user.email)}
                                                  </div>
                                                  <div className="min-w-0">
                                                    <div className="font-medium text-white/90 truncate">
                                                      {label}
                                                    </div>
                                                    <div className="text-xs text-white/50 truncate">
                                                      {m.user.email} • userRole: {m.user.role}
                                                    </div>
                                                  </div>
                                                </div>
                                              </td>

                                              <td className="py-3 px-4">
                                                <span className="chip">{roleLabel(m.role)}</span>
                                              </td>

                                              <td className="py-3 px-4 text-xs text-white/60">
                                                {new Date(m.createdAt).toLocaleString("pt-BR")}
                                              </td>

                                              <td className="py-3 px-4">
                                                <button
                                                  type="button"
                                                  disabled={removing}
                                                  onClick={() => void removeMember(s.id, m)}
                                                  className={cx("btn-secondary", removing && "opacity-70")}
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

        <div className="card p-4">
          <p className="text-xs text-white/70">
            Dica: mantenha pelo menos 1 <span className="font-medium text-white/85">OWNER</span> por
            equipe. Para uploads de capítulos, use{" "}
            <span className="font-medium text-white/85">UPLOADER</span>.
          </p>
        </div>
      </div>
    </main>
  );
}