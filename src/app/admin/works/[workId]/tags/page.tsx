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
      <main className="min-h-screen bg-gray-50 p-6 text-gray-900">
        <div className="max-w-3xl mx-auto space-y-3">
          <h1 className="text-2xl font-semibold">Tags da Obra</h1>
          <p className="text-red-600">
            {auth.user === null
              ? "Você precisa estar logado."
              : "Sem permissão para acessar esta página."}
          </p>
          <div className="flex gap-3">
            <Link className="underline" href="/">
              Home
            </Link>
            <Link className="underline" href="/admin">
              Admin
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const { workId } = await params;

  if (!workId) {
    return (
      <main className="min-h-screen bg-gray-50 p-6 text-gray-900">
        <div className="max-w-3xl mx-auto space-y-3">
          <h1 className="text-2xl font-semibold">Tags da Obra</h1>
          <p className="text-red-600">workId inválido.</p>
          <Link className="underline" href="/admin/works">
            Voltar
          </Link>
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
      <main className="min-h-screen bg-gray-50 p-6 text-gray-900">
        <div className="max-w-3xl mx-auto space-y-3">
          <h1 className="text-2xl font-semibold">Tags da Obra</h1>
          <p className="text-red-600">Obra não encontrada.</p>
          <Link className="underline" href="/admin/works">
            Voltar
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 text-gray-900">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Tags da Obra</h1>
            <p className="mt-2 text-sm text-gray-600">
              Obra: <b>{work.title}</b>
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
              href="/admin/works"
            >
              Voltar
            </Link>
            <Link
              className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
              href={`/works/${work.slug}`}
            >
              Ver obra
            </Link>
          </div>
        </div>

        <TagManagerClient workId={work.id} />
      </div>
    </main>
  );
}