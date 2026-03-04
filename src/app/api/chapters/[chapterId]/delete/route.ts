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

async function canScanManageWork(userId: string, workId: string): Promise<boolean> {
  const row = await prisma.workScanlator.findFirst({
    where: {
      workId,
      scanlator: {
        members: {
          some: { userId },
        },
      },
    },
    select: { id: true },
  });

  return !!row;
}

export async function POST(
  _req: NextRequest,
  ctx: { params: Params | Promise<Params> }
) {
  const auth = await requireRole(["ADMIN", "SCAN"]);
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: authStatus(auth) });
  }

  try {
    const { chapterId } = await getParams(ctx);

    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: { id: true, workId: true },
    });

    if (!chapter) {
      return Response.json({ error: "Capítulo não encontrado." }, { status: 404 });
    }

    // ✅ Permissão:
    // - ADMIN pode sempre
    // - SCAN só pode se for membro de scanlator vinculada à obra do capítulo
    if (auth.user.role === "SCAN") {
      const ok = await canScanManageWork(auth.user.id, chapter.workId);
      if (!ok) {
        return Response.json(
          { error: "Sem permissão para deletar capítulos desta obra." },
          { status: 403 }
        );
      }
    }

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