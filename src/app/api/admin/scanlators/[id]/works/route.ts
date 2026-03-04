import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/scanlators";
import { NextRequest } from "next/server";

type Body = { workId?: unknown };

function toId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const s = value.trim();
  return s.length ? s : null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return Response.json({ error: auth.error }, { status: 401 });

  const { id } = await params;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido." }, { status: 400 });
  }

  const body = raw as Body;
  const workId = toId(body.workId);
  if (!workId) return Response.json({ error: "workId é obrigatório." }, { status: 400 });

  const work = await prisma.work.findUnique({ where: { id: workId }, select: { id: true } });
  if (!work) return Response.json({ error: "Obra não encontrada." }, { status: 404 });

  try {
    const link = await prisma.workScanlator.create({
      data: { scanlatorId: id, workId },
      select: {
        id: true,
        createdAt: true,
        work: { select: { id: true, slug: true, title: true, coverUrl: true, type: true } },
      },
    });

    return Response.json({ link }, { status: 201 });
  } catch {
    return Response.json({ error: "Essa obra já está vinculada a este scanlator." }, { status: 409 });
  }
}