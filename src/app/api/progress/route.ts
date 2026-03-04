import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { ProgressMode } from "@prisma/client";

async function getUserId() {
  const store = await cookies();
  return store.get("userId")?.value || null;
}

export async function GET(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return Response.json({ progress: null });

    const url = new URL(req.url);
    const workId = url.searchParams.get("workId");
    if (!workId) return Response.json({ error: "workId é obrigatório." }, { status: 400 });

    const progress = await prisma.readingProgress.findUnique({
      where: { userId_workId: { userId, workId } },
      select: {
        workId: true,
        chapterId: true,
        mode: true,
        pageIndex: true,
        scrollY: true,
        updatedAt: true,
      },
    });

    return Response.json({ progress: progress ?? null });
  } catch (err) {
    console.error("Erro em GET /api/progress:", err);
    return Response.json({ error: "Erro interno. Veja o terminal." }, { status: 500 });
  }
}

type SaveBody = {
  workId: string;
  chapterId: string;
  mode: ProgressMode;
  pageIndex?: number | null;
  scrollY?: number | null;
};

export async function POST(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return Response.json({ error: "Não autenticado." }, { status: 401 });

    const body = (await req.json().catch(() => ({}))) as Partial<SaveBody>;

    const workId = String(body.workId || "");
    const chapterId = String(body.chapterId || "");
    const mode = body.mode;

    if (!workId || !chapterId || !mode) {
      return Response.json({ error: "workId, chapterId e mode são obrigatórios." }, { status: 400 });
    }

    if (!Object.values(ProgressMode).includes(mode)) {
      return Response.json({ error: "mode inválido." }, { status: 400 });
    }

    const progress = await prisma.readingProgress.upsert({
      where: { userId_workId: { userId, workId } },
      create: {
        userId,
        workId,
        chapterId,
        mode,
        pageIndex: body.pageIndex ?? null,
        scrollY: body.scrollY ?? null,
      },
      update: {
        chapterId,
        mode,
        pageIndex: body.pageIndex ?? null,
        scrollY: body.scrollY ?? null,
      },
      select: { workId: true, chapterId: true, mode: true, pageIndex: true, scrollY: true, updatedAt: true },
    });

    return Response.json({ progress }, { status: 200 });
  } catch (err) {
    console.error("Erro em POST /api/progress:", err);
    return Response.json({ error: "Erro interno. Veja o terminal." }, { status: 500 });
  }
}