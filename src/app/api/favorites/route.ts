import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

async function getUserId() {
  const store = await cookies();
  return store.get("userId")?.value || null;
}

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) return Response.json({ favorites: [] });

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        work: {
          select: { id: true, slug: true, title: true, type: true, coverUrl: true },
        },
      },
    });

    return Response.json({ favorites });
  } catch (err) {
    console.error("Erro em GET /api/favorites:", err);
    return Response.json({ error: "Erro interno. Veja o terminal." }, { status: 500 });
  }
}