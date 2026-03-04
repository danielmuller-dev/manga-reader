import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

type Params = { chapterId: string };

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<Params> }
) {
  const { chapterId } = await params;

  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    select: {
      id: true,
      workId: true,
      work: { select: { slug: true, title: true } },
    },
  });

  if (!chapter) {
    return Response.json({ error: "Capítulo não encontrado." }, { status: 404 });
  }

  const all: { id: string }[] = await prisma.chapter.findMany({
    where: { workId: chapter.workId },
    orderBy: [{ number: "desc" }, { createdAt: "desc" }],
    select: { id: true },
  });

  const idx = all.findIndex((c) => c.id === chapterId);

  const prevId = idx >= 0 && idx < all.length - 1 ? all[idx + 1].id : null;
  const nextId = idx > 0 ? all[idx - 1].id : null;

  return Response.json({
    work: chapter.work,
    prevChapterId: prevId,
    nextChapterId: nextId,
  });
}