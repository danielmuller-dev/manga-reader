import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export type Role = "USER" | "SCAN" | "ADMIN";

export async function getSessionUser() {
  const c = await cookies();
  const userId = c.get("userId")?.value;

  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true },
  });

  return user;
}

export async function requireRoles(roles: Role[]) {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false as const, status: 401 as const, user: null };
  }
  const role = user.role as Role;
  if (!roles.includes(role)) {
    return { ok: false as const, status: 403 as const, user };
  }
  return { ok: true as const, status: 200 as const, user };
}