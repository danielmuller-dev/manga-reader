import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const email = String(body.email || "").toLowerCase().trim();
  const password = String(body.password || "");

  if (!email || !password) {
    return Response.json(
      { error: "Preencha email e senha." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return Response.json(
      { error: "Email ou senha inválidos." },
      { status: 401 }
    );
  }

  const ok = await bcrypt.compare(password, user.passwordHash);

  if (!ok) {
    return Response.json(
      { error: "Email ou senha inválidos." },
      { status: 401 }
    );
  }

  const cookieStore = await cookies();

  cookieStore.set("userId", user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });

  return Response.json({ ok: true });
}