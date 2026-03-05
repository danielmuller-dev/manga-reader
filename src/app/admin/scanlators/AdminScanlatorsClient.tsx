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

  async function createScanlator(e: React.FormEvent<HTMLFormElement>) {
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
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}