import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

async function getUserId() {
  const store = await cookies();
  return store.get("userId")?.value || null;
}

type FavoriteRow = {
  work: {
    id: string;
    slug: string;
    title: string;
    type: "MANGA" | "MANHWA" | "MANHUA" | "WEBTOON" | "NOVEL";
    coverUrl: string | null;
  };
};

type NextChapter = { id: string; number: number | null; title: string | null } | null;

async function findNextChapter(args: {
  workId: string;
  currentNumber: number | null;
  scanlatorId: string | null;
}): Promise<NextChapter> {
  const { workId, currentNumber, scanlatorId } = args;

  // Sem número → não dá pra calcular próximo por ordem numérica
  if (currentNumber == null) return null;

  // 1) tenta próximo da mesma scanlator
  if (scanlatorId) {
    const nextSameScan = await prisma.chapter.findFirst({
      where: {
        workId,
        scanlatorId,
        number: { gt: currentNumber },
      },
      orderBy: [{ number: "asc" }, { createdAt: "asc" }],
      select: { id: true, number: true, title: true },
    });

    if (nextSameScan) return nextSameScan;
  }

  // 2) fallback: próximo de qualquer scanlator
  const nextAny = await prisma.chapter.findFirst({
    where: {
      workId,
      number: { gt: currentNumber },
    },
    orderBy: [{ number: "asc" }, { createdAt: "asc" }],
    select: { id: true, number: true, title: true },
  });

  return nextAny ?? null;
}

export async function GET(_req: NextRequest) {
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

    const progressBase = userId
      ? await prisma.readingProgress.findMany({
          where: { userId },
          orderBy: { updatedAt: "desc" },
          take: 12,
          select: {
            mode: true,
            pageIndex: true,
            scrollY: true,
            updatedAt: true,
            chapterId: true,
            work: {
              select: {
                id: true, // ✅ precisamos pra buscar próximo
                slug: true,
                title: true,
                coverUrl: true,
                type: true,
              },
            },
            chapter: {
              select: {
                id: true,
                number: true,
                title: true,
                kind: true,
                readMode: true,
                scanlatorId: true, // ✅ pra tentar “próximo da mesma scan”
                _count: { select: { pages: true } },
              },
            },
          },
        })
      : [];

    // Enriquecer com nextChapter (sem quebrar tipagem)
    const progress = await Promise.all(
      progressBase.map(async (p) => {
        const nextChapter = await findNextChapter({
          workId: p.work.id,
          currentNumber: p.chapter.number,
          scanlatorId: p.chapter.scanlatorId,
        });

        return {
          ...p,
          nextChapter,
        };
      })
    );

    const favorites: FavoriteRow[] = userId
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