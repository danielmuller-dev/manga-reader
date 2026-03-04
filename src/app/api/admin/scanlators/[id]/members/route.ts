import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/scanlators";
import { NextRequest } from "next/server";

type Body = {
  email?: unknown;
  role?: unknown;
};

function toEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const s = value.trim().toLowerCase();
  return s.length ? s : null;
}

function toMemberRole(value: unknown): "OWNER" | "EDITOR" {
  if (typeof value !== "string") return "EDITOR";
  const v = value.trim().toUpperCase();
  return v === "OWNER" ? "OWNER" : "EDITOR";
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

  const email = toEmail(body.email);
  if (!email) return Response.json({ error: "Email é obrigatório." }, { status: 400 });

  const role = toMemberRole(body.role);

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, role: true },
  });

  if (!user) return Response.json({ error: "Usuário não encontrado." }, { status: 404 });

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
  } catch {
    return Response.json({ error: "Usuário já é membro deste scanlator." }, { status: 409 });
  }
}