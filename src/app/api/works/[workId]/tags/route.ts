import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

function json(data: unknown, init?: ResponseInit) {
  return new NextResponse(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...(init?.headers ?? {}),
    },
  });
}

type TagItem = { id: string; slug: string; name: string };
type Row = { tag: TagItem };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function readTagId(req: Request): Promise<string> {
  const raw: unknown = await req.json().catch(() => null);
  if (!isRecord(raw)) return "";
  const tagId = raw.tagId;
  return typeof tagId === "string" ? tagId : "";
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ workId: string }> }
) {
  const { workId } = await params;

  const rows: Row[] = await prisma.workTag.findMany({
    where: { workId },
    select: {
      tag: { select: { id: true, slug: true, name: true } },
    },
    orderBy: { tag: { name: "asc" } },
  });

  return json({ items: rows.map((r) => r.tag) });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ workId: string }> }
) {
  const auth = await requireRoles(["ADMIN", "SCAN"]);
  if (!auth.ok) return json({ error: "Unauthorized" }, { status: auth.status });

  const { workId } = await params;

  const tagId = await readTagId(req);
  if (!tagId) return json({ error: "tagId é obrigatório" }, { status: 400 });

  // valida work e tag existirem
  const [work, tag] = await Promise.all([
    prisma.work.findUnique({ where: { id: workId }, select: { id: true } }),
    prisma.tag.findUnique({ where: { id: tagId }, select: { id: true } }),
  ]);

  if (!work) return json({ error: "Obra não encontrada" }, { status: 404 });
  if (!tag) return json({ error: "Tag não encontrada" }, { status: 404 });

  try {
    await prisma.workTag.create({
      data: { workId, tagId },
    });
  } catch {
    // já existe
  }

  const rows: Row[] = await prisma.workTag.findMany({
    where: { workId },
    select: { tag: { select: { id: true, slug: true, name: true } } },
    orderBy: { tag: { name: "asc" } },
  });

  return json({ items: rows.map((r) => r.tag) });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ workId: string }> }
) {
  const auth = await requireRoles(["ADMIN", "SCAN"]);
  if (!auth.ok) return json({ error: "Unauthorized" }, { status: auth.status });

  const { workId } = await params;

  const tagId = await readTagId(req);
  if (!tagId) return json({ error: "tagId é obrigatório" }, { status: 400 });

  await prisma.workTag.deleteMany({
    where: { workId, tagId },
  });

  const rows: Row[] = await prisma.workTag.findMany({
    where: { workId },
    select: { tag: { select: { id: true, slug: true, name: true } } },
    orderBy: { tag: { name: "asc" } },
  });

  return json({ items: rows.map((r) => r.tag) });
}