import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/auth-server";

type WorkTypeValue = "MANGA" | "MANHWA" | "MANHUA" | "WEBTOON" | "NOVEL";

type WorkRow = {
  id: string;
  title: string;
  slug: string;
  type: WorkTypeValue;
  _count: { chapters: number };
};

function typeLabel(t: WorkTypeValue) {
  if (t === "MANGA") return "Mangá";
  if (t === "MANHWA") return "Manhwa";
  if (t === "MANHUA") return "Manhua";
  if (t === "WEBTOON") return "Webtoon";
  return "Novel";
}

export default async function AdminWorksPage() {
  const auth = await requireRoles(["ADMIN", "SCAN"]);
  if (!auth.ok) {
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
          <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold">Obras</h1>
              <p className="muted mt-1 text-sm">Área administrativa.</p>
            </div>

            <div className="flex items-center gap-2">
              <Link className="btn-secondary" href="/admin">
                Admin
              </Link>
              <Link className="btn-secondary" href="/works">
                Obras (Site)
              </Link>
            </div>
          </header>

          <div className="card p-6">
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              Acesso negado.
            </div>
          </div>
        </div>
      </main>
    );
  }

  const works: WorkRow[] = await prisma.work.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      type: true,
      _count: { select: { chapters: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

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
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold">Obras (Admin)</h1>
            <p className="muted mt-1 text-sm">Gerencie tags e navegue para a obra.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link className="btn-secondary" href="/admin">
              Painel Admin
            </Link>
            <Link className="btn-secondary" href="/admin/tags">
              Gerenciar Tags
            </Link>
          </div>
        </header>

        <section className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/5">
                <tr className="text-left text-white/80">
                  <th className="p-3">Título</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Capítulos</th>
                  <th className="p-3">Ações</th>
                </tr>
              </thead>

              <tbody>
                {works.map((w) => (
                  <tr key={w.id} className="border-t border-white/10">
                    <td className="p-3">
                      <div className="font-medium text-white/90">{w.title}</div>
                      <div className="text-xs text-white/50">ID: {w.id}</div>
                    </td>

                    <td className="p-3 text-white/80">
                      <span className="chip">{typeLabel(w.type)}</span>
                    </td>

                    <td className="p-3 text-white/80">{w._count.chapters}</td>

                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        <Link className="btn-secondary" href={`/admin/works/${w.id}/tags`}>
                          Tags
                        </Link>
                        <Link className="btn-secondary" href={`/works/${w.slug}`}>
                          Ver obra
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}

                {works.length === 0 ? (
                  <tr>
                    <td className="p-4 text-white/70" colSpan={4}>
                      Nenhuma obra cadastrada.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <div className="card p-4">
          <p className="text-xs text-white/70">
            Dica: use <span className="font-medium text-white/85">Tags</span> para organizar gêneros
            e melhorar busca/descoberta.
          </p>
        </div>
      </div>
    </main>
  );
}