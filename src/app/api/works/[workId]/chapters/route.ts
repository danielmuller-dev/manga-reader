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

type ChapterKind = "IMAGES" | "TEXT";
type ReadMode = "SCROLL" | "PAGINATED";

type CreateBody = {
  number?: number | null;
  title?: string | null;
  kind?: ChapterKind;
  readMode?: ReadMode | null;
  textContent?: string | null;
  pages?: string[] | null;

  // ✅ quando for SCAN, pode escolher qual scan está postando
  scanlatorId?: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseKind(value: unknown): ChapterKind | null {
  return value === "IMAGES" || value === "TEXT" ? value : null;
}

function parseReadMode(value: unknown): ReadMode | null {
  return value === "SCROLL" || value === "PAGINATED" ? value : null;
}

function readNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function readNullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value);
  return s === "" ? null : s;
}

function readStringArray(value: unknown): string[] | null {
  if (value === null) return null;
  if (!Array.isArray(value)) return null;
  const arr = value
    .map((v) => String(v))
    .map((s) => s.trim())
    .filter(Boolean);
  return arr;
}

async function getAllowedScanlatorsForWork(opts: {
  userId: string;
  workId: string;
}): Promise<{ id: string; slug: string; name: string }[]> {
  // Scanlators onde o user é membro e que estão vinculadas à obra
  const rows = await prisma.workScanlator.findMany({
    where: {
      workId: opts.workId,
      scanlator: {
        members: {
          some: {
            userId: opts.userId,
          },
        },
      },
    },
    select: {
      scanlator: {
        select: { id: true, slug: true, name: true },
      },
    },
  });

  return rows.map((r) => r.scanlator);
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Params | Promise<Params> }
) {
  const { workId } = await getParams(ctx);

  const chapters = await prisma.chapter.findMany({
    where: { workId },
    orderBy: [{ number: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      number: true,
      title: true,
      kind: true,
      readMode: true,
      createdAt: true,

      // ✅ novo: scanlator que postou (p/ multi-scan)
      scanlator: {
        select: { id: true, slug: true, name: true },
      },

      // ✅ opcional (pode ser útil pra admin/auditoria)
      uploadedBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return Response.json({ chapters });
}

export async function POST(
  req: NextRequest,
  ctx: { params: Params | Promise<Params> }
) {
  const auth = await requireRole(["SCAN", "ADMIN"]);
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: authStatus(auth) });
  }

  const { workId } = await getParams(ctx);

  let bodyRaw: unknown;
  try {
    bodyRaw = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido." }, { status: 400 });
  }

  const bodyObj: Record<string, unknown> = isRecord(bodyRaw) ? bodyRaw : {};

  const body: CreateBody = {
    number: readNullableNumber(bodyObj.number),
    title: readNullableString(bodyObj.title),
    kind: parseKind(bodyObj.kind) ?? undefined,
    readMode: parseReadMode(bodyObj.readMode),
    textContent: readNullableString(bodyObj.textContent),
    pages: readStringArray(bodyObj.pages),
    scanlatorId: readNullableString(bodyObj.scanlatorId),
  };

  try {
    const kind = body.kind;
    if (!kind) {
      return Response.json({ error: "kind inválido." }, { status: 400 });
    }

    if (kind === "IMAGES") {
      const pages = Array.isArray(body.pages) ? body.pages : [];
      if (pages.length === 0) {
        return Response.json(
          { error: "Envie pages (array de URLs) com pelo menos 1 item." },
          { status: 400 }
        );
      }
    }

    if (kind === "TEXT") {
      const text = String(body.textContent ?? "").trim();
      if (!text) {
        return Response.json(
          { error: "Envie textContent com o texto do capítulo." },
          { status: 400 }
        );
      }
    }

    // ✅ Permissão por obra:
    // - ADMIN: pode sempre
    // - SCAN: precisa ser membro de alguma scanlator vinculada à obra
    let scanlatorIdToSet: string | null = null;

    if (auth.user.role === "SCAN") {
      const allowed = await getAllowedScanlatorsForWork({
        userId: auth.user.id,
        workId,
      });

      if (allowed.length === 0) {
        return Response.json(
          {
            error:
              "Sem permissão: sua conta SCAN não pertence a nenhuma scanlator vinculada a esta obra.",
          },
          { status: 403 }
        );
      }

      if (body.scanlatorId) {
        const ok = allowed.some((s) => s.id === body.scanlatorId);
        if (!ok) {
          return Response.json(
            {
              error:
                "scanlatorId inválido: você não é membro dessa scanlator para esta obra.",
            },
            { status: 403 }
          );
        }
        scanlatorIdToSet = body.scanlatorId;
      } else {
        // fallback: pega a primeira vinculada
        scanlatorIdToSet = allowed[0].id;
      }
    } else {
      // ADMIN pode setar ou deixar null
      scanlatorIdToSet = body.scanlatorId ?? null;
    }

    const chapter = await prisma.chapter.create({
      data: {
        workId,
        number: body.number ?? null,
        title: body.title ?? null,
        kind,
        readMode: kind === "IMAGES" ? (body.readMode ?? "SCROLL") : null,

        // ✅ auditoria
        uploadedById: auth.user.id,
        scanlatorId: scanlatorIdToSet,

        text:
          kind === "TEXT"
            ? { create: { content: String(body.textContent ?? "") } }
            : undefined,

        pages:
          kind === "IMAGES" && Array.isArray(body.pages)
            ? {
                create: body.pages.map((url, idx) => ({
                  index: idx,
                  imageUrl: String(url),
                })),
              }
            : undefined,
      },
      select: { id: true, kind: true },
    });

    return Response.json({ chapter }, { status: 201 });
  } catch (err) {
    console.error("Erro ao criar capítulo:", err);
    return Response.json(
      { error: "Erro interno ao criar capítulo. Veja o terminal." },
      { status: 500 }
    );
  }
}