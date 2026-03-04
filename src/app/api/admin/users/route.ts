import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { NextRequest } from "next/server";

function authStatus(auth: { user: { id: string } | null }) {
  // não logado -> 401, logado sem permissão -> 403
  return auth.user === null ? 401 : 403;
}

type PostBody = {
  userId?: unknown;
  role?: unknown;
};

function toId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const s = value.trim();
  return s.length ? s : null;
}

function toUserRole(value: unknown): UserRole | null {
  if (typeof value !== "string") return null;
  const v = value.trim().toUpperCase();
  return Object.values(UserRole).includes(v as UserRole) ? (v as UserRole) : null;
}

export async function GET(_req: NextRequest) {
  const auth = await requireRole(["ADMIN"]);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: authStatus(auth) });

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            favorites: true,
            readingProgresses: true,
          },
        },
      },
    });

    return Response.json({ users });
  } catch (err) {
    console.error("Erro em GET /api/admin/users:", err);
    return Response.json({ error: "Erro interno. Veja o terminal." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(["ADMIN"]);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: authStatus(auth) });

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido." }, { status: 400 });
  }

  const body = raw as PostBody;
  const userId = toId(body.userId);
  const role = toUserRole(body.role);

  if (!userId || !role) {
    return Response.json({ error: "userId e role são obrigatórios." }, { status: 400 });
  }

  // evita o admin se “remover” do próprio admin sem querer
  if (auth.user.id === userId && role !== UserRole.ADMIN) {
    return Response.json({ error: "Você não pode remover seu próprio ADMIN." }, { status: 400 });
  }

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, email: true, role: true, updatedAt: true },
    });

    return Response.json({ user });
  } catch (err) {
    console.error("Erro em POST /api/admin/users:", err);
    return Response.json({ error: "Erro interno. Veja o terminal." }, { status: 500 });
  }
}