import { prisma } from "@/lib/prisma";
import Link from "next/link";
import NewChapterForm from "./NewChapterForm";
import { requireRole } from "@/lib/auth";

export default async function NewChapterPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const auth = await requireRole(["ADMIN", "SCAN"]);

  if (!auth.ok) {
    const message =
      auth.user === null
        ? "Você precisa estar logado."
        : "Sem permissão para acessar esta página.";

    return (
      <main className="min-h-screen text-white">
        {/* Background */}
        <div className="fixed inset-0 -z-10 bg-gradient-to-b from-black via-zinc-950 to-black" />
        <div className="fixed inset-0 -z-10 opacity-40">
          <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-56 left-10 h-[520px] w-[520px] rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-40 right-10 h-[520px] w-[520px] rounded-full bg-white/5 blur-3xl" />
        </div>

        <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Novo capítulo</h1>
              <p className="muted mt-1 text-sm">Área restrita para SCAN/ADMIN.</p>
            </div>

            <div className="flex gap-2">
              <Link className="btn-secondary" href="/">
                Home
              </Link>
              <Link className="btn-secondary" href="/works">
                Obras
              </Link>
            </div>
          </header>

          <div className="card p-6">
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              {message}
            </div>
          </div>
        </div>
      </main>
    );
  }

  const { slug } = await params;

  const work = await prisma.work.findUnique({
    where: { slug },
    select: { id: true, slug: true, title: true },
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

        <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
          <header className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold">Novo capítulo</h1>
              <p className="muted mt-1 text-sm">Obra não encontrada.</p>
            </div>

            <Link className="btn-secondary" href="/works">
              Voltar
            </Link>
          </header>

          <div className="card p-6">
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              Obra não encontrada.
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

      <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
        <header className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Novo capítulo</h1>
            <p className="muted mt-1 text-sm">Envie um capítulo para a obra selecionada.</p>
          </div>

          <Link className="btn-secondary" href={`/works/${work.slug}`}>
            Voltar
          </Link>
        </header>

        <div className="card p-5">
          <div className="text-xs text-white/60">Obra</div>
          <div className="mt-1 text-lg font-semibold text-white/90">{work.title}</div>
          <div className="mt-1 text-sm text-white/50">/{work.slug}</div>
        </div>

        <NewChapterForm workId={work.id} workSlug={work.slug} />
      </div>
    </main>
  );
}