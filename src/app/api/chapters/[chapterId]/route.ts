import { prisma } from "@/lib/prisma";

type Params = { chapterId: string };

async function getParams(ctx: { params: Params | Promise<Params> }) {
  return await Promise.resolve(ctx.params);
}

export async function GET(
  _req: Request,
  ctx: { params: Params | Promise<Params> }
) {
  try {
    const { chapterId } = await getParams(ctx);

    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: {
        id: true,
        number: true,
        title: true,
        kind: true,
        readMode: true,

        // ✅ novo: scanlator que postou o capítulo
        scanlator: {
          select: { id: true, slug: true, name: true },
        },

        // ✅ opcional: auditoria (útil para admin e futuro controle de deleção)
        uploadedBy: {
          select: { id: true, name: true, email: true },
        },

        work: { select: { id: true, slug: true, title: true } },
        pages: {
          orderBy: { index: "asc" },
          select: { index: true, imageUrl: true },
        },
        text: { select: { content: true } },
      },
    });

    if (!chapter) {
      return Response.json(
        { error: "Capítulo não encontrado." },
        { status: 404 }
      );
    }

    return Response.json({ chapter });
  } catch (err) {
    console.error("Erro em GET /api/chapters/[chapterId]:", err);
    return Response.json(
      { error: "Erro interno ao carregar capítulo. Veja o terminal." },
      { status: 500 }
    );
  }
}