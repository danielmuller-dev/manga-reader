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
      <main className="min-h-screen bg-gray-50 p-6 text-gray-900">
        <div className="max-w-2xl mx-auto space-y-4">
          <h1 className="text-2xl font-semibold">Novo capítulo</h1>
          <p className="text-red-600">{message}</p>

          <div className="flex gap-3">
            <Link className="underline" href="/">
              Home
            </Link>
            <Link className="underline" href="/works">
              Obras
            </Link>
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
      <main className="min-h-screen bg-gray-50 p-6 text-gray-900">
        <div className="max-w-2xl mx-auto space-y-4">
          <p>Obra não encontrada.</p>
          <Link className="underline" href="/works">
            Voltar
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 text-gray-900">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Novo capítulo</h1>
          <Link className="underline" href={`/works/${work.slug}`}>
            Voltar
          </Link>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-sm opacity-70">Obra</div>
          <div className="font-semibold">{work.title}</div>
          <div className="text-sm opacity-70">/{work.slug}</div>
        </div>

        <NewChapterForm workId={work.id} workSlug={work.slug} />
      </div>
    </main>
  );
}