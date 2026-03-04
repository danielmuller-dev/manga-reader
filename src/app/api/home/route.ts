import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

async function getUserId() {
  const store = await cookies();
  return store.get("userId")?.value || null;
}

export async function GET() {
  try {
    const userId = await getUserId();

    const latestWorks = await prisma.work.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        slug: true,
        title: true,
        type: true,
        coverUrl: true,
        createdAt: true,
      },
    });

    const latestChapters = await prisma.chapter.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        number: true,
        title: true,
        kind: true,
        readMode: true,
        createdAt: true,
        work: { select: { slug: true, title: true } },
      },
    });

    const progress = userId
      ? await prisma.readingProgress.findMany({
          where: { userId },
          orderBy: { updatedAt: "desc" },
          take: 6,
          select: {
            mode: true,
            pageIndex: true,
            scrollY: true,
            updatedAt: true,
            chapterId: true,
            work: { select: { slug: true, title: true, coverUrl: true, type: true } },
            chapter: { select: { number: true, title: true } },
          },
        })
      : [];

    const favorites = userId
      ? await prisma.favorite.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 12,
          select: {
            work: { select: { id: true, slug: true, title: true, type: true, coverUrl: true } },
          },
        })
      : [];

    return Response.json({
      latestWorks,
      latestChapters,
      progress,
      favorites: favorites.map((f) => f.work),
    });
  } catch (err) {
    console.error("Erro em GET /api/home:", err);
    return Response.json({ error: "Erro interno. Veja o terminal." }, { status: 500 });
  }
}