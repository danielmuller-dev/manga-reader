import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { NextRequest } from "next/server";

type Params = { workId: string };

async function getParams(ctx: { params: Params | Promise<Params> }) {
  return await Promise.resolve(ctx.params);
}

function authStatus(auth: { user: { id: string } | null }) {
  return auth.user === null ? 401 : 403;
}

type ScanlatorItem = { id: string; slug: string; name: string };

async function getAllowedScanlatorsForWork(opts: {
  userId: string;
  workId: string;
}): Promise<ScanlatorItem[]> {
  const rows = await prisma.workScanlator.findMany({
    where: {
      workId: opts.workId,
      scanlator: {
        members: {
          some: { userId: opts.userId },
        },
      },
    },
    select: {
      scanlator: { select: { id: true, slug: true, name: true } },
    },
  });

  return rows.map((r) => r.scanlator);
}

async function getLinkedScanlatorsForWork(workId: string): Promise<ScanlatorItem[]> {
  const rows = await prisma.workScanlator.findMany({
    where: { workId },
    select: {
      scanlator: { select: { id: true, slug: true, name: true } },
    },
  });

  return rows.map((r) => r.scanlator);
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Params | Promise<Params> }
) {
  const auth = await requireRole(["SCAN", "ADMIN"]);
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: authStatus(auth) });
  }

  const { workId } = await getParams(ctx);

  const workExists = await prisma.work.findUnique({
    where: { id: workId },
    select: { id: true },
  });

  if (!workExists) {
    return Response.json({ error: "Obra não encontrada." }, { status: 404 });
  }

  const scanlators =
    auth.user.role === "ADMIN"
      ? await getLinkedScanlatorsForWork(workId)
      : await getAllowedScanlatorsForWork({ userId: auth.user.id, workId });

  scanlators.sort((a, b) => a.name.localeCompare(b.name));

  return Response.json({ scanlators });
}