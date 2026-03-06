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

export async function GET(_req: NextRequest) {
  try {
    const userId = await getUserId();

    // Mantém (caso você use em outro lugar / futuro)
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

    // Últimos capítulos globais (lista simples)
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

    // ✅ NOVO: Últimas atualizações agrupadas por obra
    // (pega bastante capítulos recentes e agrupa no server)
    const recentForUpdates = await prisma.chapter.findMany({
      orderBy: { createdAt: "desc" },
      take: 80,
      select: {
        id: true,
        number: true,
        title: true,
        createdAt: true,
        workId: true,
        work: {
          select: {
            id: true,
            slug: true,
            title: true,
            type: true,
            coverUrl: true,
          },
        },
      },
    });

    const grouped = new Map<
      string,
      {
        work: { id: string; slug: string; title: string; type: string; coverUrl: string | null };
        chapters: Array<{ id: string; number: number | null; title: string | null; createdAt: string }>;
      }
    >();

    for (const ch of recentForUpdates) {
      const key = ch.workId;

      const existing = grouped.get(key);
      if (!existing) {
        grouped.set(key, {
          work: {
            id: ch.work.id,
            slug: ch.work.slug,
            title: ch.work.title,
            type: ch.work.type,
            coverUrl: ch.work.coverUrl,
          },
          chapters: [
            {
              id: ch.id,
              number: ch.number,
              title: ch.title,
              createdAt: ch.createdAt.toISOString(),
            },
          ],
        });
      } else {
        // limita 2 capítulos por obra
        if (existing.chapters.length < 2) {
          existing.chapters.push({
            id: ch.id,
            number: ch.number,
            title: ch.title,
            createdAt: ch.createdAt.toISOString(),
          });
        }
      }

      // limita a quantidade de obras exibidas
      if (grouped.size >= 12) break;
    }

    const latestUpdates = Array.from(grouped.values());

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
      latestUpdates, // ✅ novo payload
      progress,
      favorites: favorites.map((f) => f.work),
    });
  } catch (err) {
    console.error("Erro em GET /api/home:", err);
    return Response.json({ error: "Erro interno. Veja o terminal." }, { status: 500 });
  }
}