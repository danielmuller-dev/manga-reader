import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/scanlators";
import { NextRequest } from "next/server";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; linkId: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return Response.json({ error: auth.error }, { status: 401 });

  const { id, linkId } = await params;

  const link = await prisma.workScanlator.findFirst({
    where: { id: linkId, scanlatorId: id },
    select: { id: true },
  });

  if (!link) return Response.json({ error: "Vínculo não encontrado." }, { status: 404 });

  await prisma.workScanlator.delete({ where: { id: linkId } });
  return Response.json({ ok: true });
}