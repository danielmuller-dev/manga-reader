import { prisma } from "../../../../lib/prisma";

export async function GET() {
  // Query simples só pra testar conexão
  const result = await prisma.$queryRaw`SELECT 1 as ok`;
  return Response.json({ db: "ok", result });
}