import { prisma } from "@/lib/prisma";
import { requireScanOrAdmin } from "@/lib/scanlators";

export async function GET() {
  const auth = await requireScanOrAdmin();
  if (!auth.ok) return Response.json({ error: auth.error }, { status: 401 });

  if (auth.user.role === "ADMIN") {
    const scanlators = await prisma.scanlator.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, slug: true, logoUrl: true },
    });
    return Response.json({ scanlators });
  }

  const memberships = await prisma.scanlatorMember.findMany({
    where: { userId: auth.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      role: true,
      scanlator: { select: { id: true, name: true, slug: true, logoUrl: true } },
    },
  });

  const scanlators = memberships.map((m) => ({
    ...m.scanlator,
    memberRole: m.role,
  }));

  return Response.json({ scanlators });
}