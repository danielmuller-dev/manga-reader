import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

type UserRole = "USER" | "SCAN" | "ADMIN";

type Body = { email: string; password: string; nickname: string };

function normalizeNickname(n: string) {
  return n.trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function POST(req: Request) {
  try {
    const raw: unknown = await req.json().catch(() => ({}));
    const body: Record<string, unknown> = isRecord(raw) ? raw : {};

    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const nickname = normalizeNickname(String(body.nickname ?? ""));

    if (!email || !password || !nickname) {
      return Response.json(
        { error: "NickName, email e senha são obrigatórios." },
        { status: 400 }
      );
    }

    if (nickname.length < 3 || nickname.length > 20) {
      return Response.json(
        { error: "NickName deve ter entre 3 e 20 caracteres." },
        { status: 400 }
      );
    }

    // Deixa o nickname “limpo” e fácil de identificar
    if (!/^[a-zA-Z0-9._-]+$/.test(nickname)) {
      return Response.json(
        { error: "NickName só pode ter letras, números, ponto (.), _ e -." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return Response.json(
        { error: "Senha deve ter pelo menos 6 caracteres." },
        { status: 400 }
      );
    }

    const exists = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (exists) {
      return Response.json(
        { error: "Este email já está cadastrado." },
        { status: 409 }
      );
    }

    // (Recomendado) impedir nickname duplicado
    const nickExists = await prisma.user.findFirst({
      where: { name: nickname },
      select: { id: true },
    });
    if (nickExists) {
      return Response.json(
        { error: "Este NickName já está em uso." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const role: UserRole = "USER";

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
        name: nickname, // ✅ NickName salvo no campo name
      },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    return Response.json({ user }, { status: 201 });
  } catch (err) {
    console.error("Erro em POST /api/register:", err);
    return Response.json(
      { error: "Erro interno. Veja o terminal." },
      { status: 500 }
    );
  }
}