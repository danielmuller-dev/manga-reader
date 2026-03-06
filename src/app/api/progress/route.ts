import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

type ProgressModeValue = "SCROLL" | "PAGINATED";

async function getUserId() {
  const store = await cookies();
  return store.get("userId")?.value || null;
}

function toMode(value: unknown): ProgressModeValue | null {
  if (typeof value !== "string") return null;
  const v = value.trim().toUpperCase();
  if (v === "SCROLL" || v === "PAGINATED") return v;
  return null;
}

type SaveBody = {
  workId?: unknown;
  chapterId?: unknown;
  mode?: unknown;
  pageIndex?: unknown;
  scrollY?: unknown;
};

function toId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const s = value.trim();
  return s.length ? s : null;
}

function toNullableInt(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.trunc(value);
}

function clampNonNegativeInt(n: number | null): number | null {
  if (n === null) return null;
  if (!Number.isFinite(n)) return null;
  const v = Math.trunc(n);
  if (v < 0) return 0;
  return v;
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) return Response.json({ progress: null });

    const url = new URL(req.url);
    const workId = url.searchParams.get("workId");
    if (!workId) {
      return Response.json({ error: "workId é obrigatório." }, { status: 400 });
    }

    const progress = await prisma.readingProgress.findUnique({
      where: { userId_workId: { userId, workId } },
      select: {
        workId: true,
        chapterId: true,
        mode: true,
        pageIndex: true,
        scrollY: true,
        updatedAt: true,
        chapter: {
          select: {
            number: true,
            title: true,
          },
        },
      },
    });

    return Response.json({ progress: progress ?? null });
  } catch (err) {
    console.error("Erro em GET /api/progress:", err);
    return Response.json({ error: "Erro interno." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) return Response.json({ error: "Não autenticado." }, { status: 401 });

    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      return Response.json({ error: "JSON inválido." }, { status: 400 });
    }

    const body = raw as SaveBody;

    const workId = toId(body.workId);
    const chapterId = toId(body.chapterId);
    const mode = toMode(body.mode);

    if (!workId || !chapterId || !mode) {
      return Response.json(
        { error: "workId, chapterId e mode são obrigatórios." },
        { status: 400 }
      );
    }

    // Sanitiza valores
    const rawPageIndex = clampNonNegativeInt(toNullableInt(body.pageIndex));
    const rawScrollY = clampNonNegativeInt(toNullableInt(body.scrollY));

    // Normaliza para evitar guardar ambos quando o modo muda
    const pageIndex = mode === "PAGINATED" ? rawPageIndex : null;
    const scrollY = mode === "SCROLL" ? rawScrollY : null;

    const progress = await prisma.readingProgress.upsert({
      where: { userId_workId: { userId, workId } },
      create: {
        userId,
        workId,
        chapterId,
        mode,
        pageIndex,
        scrollY,
      },
      update: {
        chapterId,
        mode,
        pageIndex,
        scrollY,
      },
      select: {
        workId: true,
        chapterId: true,
        mode: true,
        pageIndex: true,
        scrollY: true,
        updatedAt: true,
        chapter: {
          select: {
            number: true,
            title: true,
          },
        },
      },
    });

    return Response.json({ progress }, { status: 200 });
  } catch (err) {
    console.error("Erro em POST /api/progress:", err);
    return Response.json({ error: "Erro interno." }, { status: 500 });
  }
}