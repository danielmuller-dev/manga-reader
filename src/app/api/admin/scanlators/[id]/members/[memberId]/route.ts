import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/scanlators";
import { NextRequest } from "next/server";

type Body = { role?: unknown };

function toMemberRole(value: unknown): "OWNER" | "EDITOR" | null {
  if (typeof value !== "string") return null;
  const v = value.trim().toUpperCase();
  if (v === "OWNER" || v === "EDITOR") return v;
  return null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return Response.json({ error: auth.error }, { status: 401 });

  const { id, memberId } = await params;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido." }, { status: 400 });
  }

  const body = raw as Body;
  const role = toMemberRole(body.role);
  if (!role) return Response.json({ error: "Role inválida (OWNER/EDITOR)." }, { status: 400 });

  const member = await prisma.scanlatorMember.findFirst({
    where: { id: memberId, scanlatorId: id },
    select: { id: true },
  });

  if (!member) return Response.json({ error: "Membro não encontrado." }, { status: 404 });

  const updated = await prisma.scanlatorMember.update({
    where: { id: memberId },
    data: { role },
    select: {
      id: true,
      role: true,
      createdAt: true,
      user: { select: { id: true, email: true, name: true, role: true } },
    },
  });

  return Response.json({ member: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return Response.json({ error: auth.error }, { status: 401 });

  const { id, memberId } = await params;

  const member = await prisma.scanlatorMember.findFirst({
    where: { id: memberId, scanlatorId: id },
    select: { id: true },
  });

  if (!member) return Response.json({ error: "Membro não encontrado." }, { status: 404 });

  await prisma.scanlatorMember.delete({ where: { id: memberId } });
  return Response.json({ ok: true });
}