import "server-only";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

// ✅ AJUSTE AQUI: nome do cookie real
const SESSION_COOKIE_NAME = "session";

/**
 * Estratégia padrão:
 * - cookie guarda um "sessionToken" (string aleatória) OU um "userId"
 * - buscamos no banco e retornamos user + role
 *
 * Se seu cookie for JWT, você vai trocar a parte do "token" por decode JWT.
 */
export async function getCurrentUser() {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  // ✅ OPÇÃO 1 (recomendada): token é um sessionToken salvo numa tabela Session
  // Exemplo: prisma.session.findUnique({ where: { token }, include: { user: true } })
  //
  // ✅ OPÇÃO 2: token é o userId direto (menos seguro, mas funciona)
  // Abaixo vou assumir OPÇÃO 2 pra você já rodar HOJE:
  const userId = token;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true, // ou roles relation, depende do seu schema
    },
  });

  return user;
}