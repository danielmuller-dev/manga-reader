import { prisma } from "@/lib/prisma";
import { requireScanlatorAccessBySlug } from "@/lib/scanlators";
import { NextRequest } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const auth = await requireScanlatorAccessBySlug(slug);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: 401 });

  const scanlator = await prisma.scanlator.findUnique({
    where: { slug },
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
              _count: { select: { chapters: true } },
            },
          },
        },
      },
      chapters: {
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          workId: true,
          number: true,
          title: true,
          kind: true,
          readMode: true,
          createdAt: true,
          uploadedBy: { select: { id: true, email: true, name: true } },
          work: { select: { id: true, slug: true, title: true } },
        },
      },
      _count: { select: { members: true, works: true, chapters: true } },
    },
  });

  if (!scanlator) return Response.json({ error: "Scanlator não encontrado." }, { status: 404 });
  return Response.json({ scanlator });
}