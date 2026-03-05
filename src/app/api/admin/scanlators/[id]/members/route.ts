import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/scanlators";
import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";

type MemberRole = "OWNER" | "EDITOR" | "UPLOADER";

type CreateBody = {
  email?: unknown;
  role?: unknown;
};

type DeleteBody = {
  email?: unknown;
  userId?: unknown;
};

function toTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const s = value.trim();
  return s.length ? s : null;
}

function toEmail(value: unknown): string | null {
  const s = toTrimmedString(value);
  if (!s) return null;
  return s.toLowerCase();
}

function toId(value: unknown): string | null {
  return toTrimmedString(value);
}

function toMemberRole(value: unknown): MemberRole {
  if (typeof value !== "string") return "EDITOR";
  const v = value.trim().toUpperCase();
  if (v === "OWNER") return "OWNER";
  if (v === "UPLOADER") return "UPLOADER";
  return "EDITOR";
}

async function ensureScanlatorExists(scanlatorId: string) {
  const scanlator = await prisma.scanlator.findUnique({
    where: { id: scanlatorId },
    select: { id: true, name: true, slug: true },
  });
  return scanlator;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return Response.json({ error: auth.error }, { status: 401 });

  const { id } = await params;

  const scanlator = await ensureScanlatorExists(id);
  if (!scanlator)
    return Response.json({ error: "Scanlator não encontrado." }, { status: 404 });

  const members = await prisma.scanlatorMember.findMany({
    where: { scanlatorId: id },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      role: true,
      createdAt: true,
      user: { select: { id: true, email: true, name: true, role: true } },
    },
  });

  return Response.json({ scanlator, members }, { status: 200 });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return Response.json({ error: auth.error }, { status: 401 });

  const { id } = await params;

  const scanlator = await ensureScanlatorExists(id);
  if (!scanlator)
    return Response.json({ error: "Scanlator não encontrado." }, { status: 404 });

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido." }, { status: 400 });
  }

  const body = raw as CreateBody;

  const email = toEmail(body.email);
  if (!email)
    return Response.json({ error: "Email é obrigatório." }, { status: 400 });

  const role = toMemberRole(body.role);

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, role: true },
  });

  if (!user)
    return Response.json({ error: "Usuário não encontrado." }, { status: 404 });

  try {
    const member = await prisma.scanlatorMember.create({
      data: { scanlatorId: id, userId: user.id, role },
      select: {
        id: true,
        role: true,
        createdAt: true,
        user: { select: { id: true, email: true, name: true, role: true } },
      },
    });

    return Response.json({ member }, { status: 201 });
  } catch (err: unknown) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return Response.json(
        { error: "Usuário já é membro deste scanlator." },
        { status: 409 }
      );
    }

    return Response.json(
      { error: "Erro ao adicionar membro." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return Response.json({ error: auth.error }, { status: 401 });

  const { id } = await params;

  const scanlator = await ensureScanlatorExists(id);
  if (!scanlator)
    return Response.json({ error: "Scanlator não encontrado." }, { status: 404 });

  let raw: unknown = null;
  try {
    // Permitimos DELETE sem body, mas se tiver body, validamos.
    raw = await req.json();
  } catch {
    raw = null;
  }

  const body = (raw ?? {}) as DeleteBody;

  const email = toEmail(body.email);
  const userId = toId(body.userId);

  if (!email && !userId) {
    return Response.json(
      { error: "Informe email ou userId para remover o membro." },
      { status: 400 }
    );
  }

  let targetUserId: string | null = userId ?? null;

  if (!targetUserId && email) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user)
      return Response.json({ error: "Usuário não encontrado." }, { status: 404 });

    targetUserId = user.id;
  }

  if (!targetUserId) {
    return Response.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const existing = await prisma.scanlatorMember.findUnique({
    where: { scanlatorId_userId: { scanlatorId: id, userId: targetUserId } },
    select: { id: true },
  });

  if (!existing) {
    return Response.json(
      { error: "Usuário não é membro deste scanlator." },
      { status: 404 }
    );
  }

  await prisma.scanlatorMember.delete({
    where: { id: existing.id },
  });

  return Response.json({ ok: true }, { status: 200 });
}