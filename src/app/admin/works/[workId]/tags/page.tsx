import TagManagerClient from "@/components/TagManagerClient";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import Link from "next/link";

export default async function AdminWorkTagsPage({
  params,
}: {
  params: Promise<{ workId: string }>;
}) {
  const auth = await requireRole(["ADMIN"]);

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

        <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Tags da Obra</h1>
              <p className="muted mt-1 text-sm">Área administrativa.</p>
            </div>

            <div className="flex items-center gap-2">
              <Link className="btn-secondary" href="/">
                Home
              </Link>
              <Link className="btn-secondary" href="/admin">
                Admin
              </Link>
            </div>
          </header>

          <div className="card p-6">
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              {auth.user === null
                ? "Você precisa estar logado."
                : "Sem permissão para acessar esta página."}
            </div>
          </div>
        </div>
      </main>
    );
  }

  const { workId } = await params;

  if (!workId) {
    return (
      <main className="min-h-screen text-white">
        {/* Background */}
        <div className="fixed inset-0 -z-10 bg-gradient-to-b from-black via-zinc-950 to-black" />
        <div className="fixed inset-0 -z-10 opacity-40">
          <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-56 left-10 h-[520px] w-[520px] rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-40 right-10 h-[520px] w-[520px] rounded-full bg-white/5 blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
          <header>
            <h1 className="text-2xl font-semibold">Tags da Obra</h1>
          </header>

          <div className="card p-6">
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              workId inválido.
            </div>

            <div className="mt-4">
              <Link className="btn-secondary" href="/admin/works">
                Voltar
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const work = await prisma.work.findUnique({
    where: { id: workId },
    select: { id: true, title: true, slug: true },
  });

  if (!work) {
    return (
      <main className="min-h-screen text-white">
        {/* Background */}
        <div className="fixed inset-0 -z-10 bg-gradient-to-b from-black via-zinc-950 to-black" />
        <div className="fixed inset-0 -z-10 opacity-40">
          <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-56 left-10 h-[520px] w-[520px] rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-40 right-10 h-[520px] w-[520px] rounded-full bg-white/5 blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
          <header>
            <h1 className="text-2xl font-semibold">Tags da Obra</h1>
          </header>

          <div className="card p-6">
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              Obra não encontrada.
            </div>

            <div className="mt-4">
              <Link className="btn-secondary" href="/admin/works">
                Voltar
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
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

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Tags da Obra</h1>
            <p className="muted mt-1 text-sm">
              Obra: <span className="font-medium text-white/90">{work.title}</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link className="btn-secondary" href="/admin/works">
              Voltar
            </Link>
            <Link className="btn-secondary" href={`/works/${work.slug}`}>
              Ver obra
            </Link>
          </div>
        </header>

        <section className="card p-6">
          <TagManagerClient workId={work.id} />
        </section>
      </div>
    </main>
  );
}