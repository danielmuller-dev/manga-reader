import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

async function getUserId() {
  const store = await cookies();
  return store.get("userId")?.value || null;
}

type Body = { workId: string };

export async function POST(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return Response.json({ error: "Não autenticado." }, { status: 401 });

    const body = (await req.json().catch(() => ({}))) as Partial<Body>;
    const workId = String(body.workId || "");
    if (!workId) return Response.json({ error: "workId é obrigatório." }, { status: 400 });

    const existing = await prisma.favorite.findUnique({
      where: { userId_workId: { userId, workId } },
      select: { id: true },
    });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return Response.json({ isFavorite: false });
    }

    await prisma.favorite.create({
      data: { userId, workId },
      select: { id: true },
    });

    return Response.json({ isFavorite: true });
  } catch (err) {
    console.error("Erro em POST /api/favorites/toggle:", err);
    return Response.json({ error: "Erro interno. Veja o terminal." }, { status: 500 });
  }
}