import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

type Params = { slug: string };

async function getParams(ctx: { params: Params | Promise<Params> }) {
  return await Promise.resolve(ctx.params);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s.length ? s : null;
}

type Action = "link" | "unlink";

function parseAction(value: unknown): Action | null {
  return value === "link" || value === "unlink" ? value : null;
}

async function getScanlatorIdBySlug(slug: string): Promise<string | null> {
  const scanlator = await prisma.scanlator.findUnique({
    where: { slug },
    select: { id: true },
  });
  return scanlator?.id ?? null;
}

// ✅ ADMIN: lista obras + ids já vinculados
export async function GET(_req: Request, ctx: { params: Params | Promise<Params> }) {
  const auth = await requireRole(["ADMIN"]);
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.user ? 403 : 401 });
  }

  const { slug } = await getParams(ctx);

  const scanlatorId = await getScanlatorIdBySlug(slug);
  if (!scanlatorId) {
    return Response.json({ error: "Scanlator não encontrado." }, { status: 404 });
  }

  const [linked, works] = await Promise.all([
    prisma.workScanlator.findMany({
      where: { scanlatorId },
      select: { workId: true },
    }),
    prisma.work.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        type: true,
        coverUrl: true,
      },
    }),
  ]);

  const linkedWorkIds = linked.map((r) => r.workId);

  return Response.json({ works, linkedWorkIds });
}

// ✅ ADMIN: vincular/desvincular
export async function POST(req: Request, ctx: { params: Params | Promise<Params> }) {
  const auth = await requireRole(["ADMIN"]);
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.user ? 403 : 401 });
  }

  const { slug } = await getParams(ctx);

  const scanlatorId = await getScanlatorIdBySlug(slug);
  if (!scanlatorId) {
    return Response.json({ error: "Scanlator não encontrado." }, { status: 404 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido." }, { status: 400 });
  }

  const obj: Record<string, unknown> = isRecord(raw) ? raw : {};
  const workId = readString(obj.workId);
  const action = parseAction(obj.action);

  if (!workId) return Response.json({ error: "workId é obrigatório." }, { status: 400 });
  if (!action) return Response.json({ error: "action inválida (link/unlink)." }, { status: 400 });

  const work = await prisma.work.findUnique({
    where: { id: workId },
    select: { id: true },
  });
  if (!work) return Response.json({ error: "Obra não encontrada." }, { status: 404 });

  if (action === "link") {
    await prisma.workScanlator.upsert({
      where: { workId_scanlatorId: { workId, scanlatorId } },
      update: {},
      create: { workId, scanlatorId },
    });
    return Response.json({ ok: true, action: "link" as const });
  }

  await prisma.workScanlator.deleteMany({
    where: { workId, scanlatorId },
  });

  return Response.json({ ok: true, action: "unlink" as const });
}