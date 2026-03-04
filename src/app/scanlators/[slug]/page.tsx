import Link from "next/link";
import { requireScanlatorAccessBySlug } from "@/lib/scanlators";
import { prisma } from "@/lib/prisma";
import ScanlatorDashboardClient from "./ScanlatorDashboardClient";

export default async function ScanlatorDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const auth = await requireScanlatorAccessBySlug(slug);

  if (!auth.ok) {
    const message =
      auth.user === null
        ? "Você precisa estar logado."
        : auth.error || "Sem permissão para acessar.";

    return (
      <main className="min-h-screen bg-gray-50 p-6 text-gray-900">
        <div className="max-w-4xl mx-auto space-y-3">
          <h1 className="text-2xl font-semibold">Scanlator</h1>
          <p className="text-red-600">{message}</p>

          <div className="flex gap-3">
            <Link className="underline" href="/">
              Home
            </Link>
            <Link className="underline" href="/scanlators">
              Scanlators
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const scanlator = await prisma.scanlator.findUnique({
    where: { id: auth.scanlator.id },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      logoUrl: true,
      createdAt: true,
      works: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          createdAt: true,
          work: {
            select: {
              id: true,
              slug: true,
              title: true,
              coverUrl: true,
              type: true,
            },
          },
        },
      },
      chapters: {
        orderBy: { createdAt: "desc" },
        take: 30,
        select: {
          id: true,
          number: true,
          title: true,
          kind: true,
          createdAt: true,
          work: { select: { id: true, slug: true, title: true } },
        },
      },
      _count: { select: { members: true, works: true, chapters: true } },
    },
  });

  if (!scanlator) {
    return (
      <main className="min-h-screen bg-gray-50 p-6 text-gray-900">
        <div className="max-w-4xl mx-auto space-y-3">
          <h1 className="text-2xl font-semibold">Scanlator</h1>
          <p className="text-red-600">Scanlator não encontrado.</p>
          <Link className="underline" href="/scanlators">
            Voltar
          </Link>
        </div>
      </main>
    );
  }

  return <ScanlatorDashboardClient me={auth.user} scanlator={scanlator} />;
}