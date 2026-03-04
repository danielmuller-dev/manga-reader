import "server-only";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export type Role = "USER" | "SCAN" | "ADMIN";

const USER_ID_COOKIE_NAME = "userId";

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const userId = (await cookies()).get(USER_ID_COOKIE_NAME)?.value;
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as Role,
  };
}

export async function requireRole(roles: Role[]) {
  const user = await getSessionUser();

  if (!user) {
    return { ok: false as const, error: "Você precisa estar logado.", user: null };
  }

  if (!roles.includes(user.role)) {
    return { ok: false as const, error: "Sem permissão para acessar.", user };
  }

  return { ok: true as const, user };
}