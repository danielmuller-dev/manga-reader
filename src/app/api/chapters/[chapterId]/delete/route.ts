import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { NextRequest } from "next/server";

type Params = { chapterId: string };

async function getParams(ctx: { params: Params | Promise<Params> }) {
  return await Promise.resolve(ctx.params);
}

function authStatus(auth: { user: { id: string } | null }) {
  return auth.user === null ? 401 : 403;
}

export async function POST(_req: NextRequest, ctx: { params: Params | Promise<Params> }) {
  const auth = await requireRole(["ADMIN"]);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: authStatus(auth) });

  try {
    const { chapterId } = await getParams(ctx);

    await prisma.$transaction([
      prisma.chapterPage.deleteMany({ where: { chapterId } }),
      prisma.chapterText.deleteMany({ where: { chapterId } }),
      prisma.readingProgress.deleteMany({ where: { chapterId } }),
      prisma.chapter.delete({ where: { id: chapterId } }),
    ]);

    return Response.json({ ok: true });
  } catch (err) {
    console.error("Erro ao deletar capítulo:", err);
    return Response.json(
      { error: "Erro interno ao deletar capítulo. Veja o terminal." },
      { status: 500 }
    );
  }
}