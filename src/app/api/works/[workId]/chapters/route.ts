import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { ChapterKind, ReadMode } from "@prisma/client";
import { NextRequest } from "next/server";

type Params = { workId: string };

async function getParams(ctx: { params: Params | Promise<Params> }) {
  return await Promise.resolve(ctx.params);
}

function authStatus(auth: { user: { id: string } | null }) {
  return auth.user === null ? 401 : 403;
}

export async function GET(_req: NextRequest, ctx: { params: Params | Promise<Params> }) {
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
    },
  });

  return Response.json({ chapters });
}

type CreateBody = {
  number?: number | null;
  title?: string | null;
  kind?: ChapterKind;
  readMode?: ReadMode | null;
  textContent?: string | null;
  pages?: string[] | null;
};

export async function POST(req: NextRequest, ctx: { params: Params | Promise<Params> }) {
  const auth = await requireRole(["SCAN", "ADMIN"]);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: authStatus(auth) });

  let bodyRaw: unknown;
  try {
    bodyRaw = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido." }, { status: 400 });
  }

  const body = bodyRaw as CreateBody;

  try {
    const { workId } = await getParams(ctx);

    const kind = body.kind;
    if (!kind || !Object.values(ChapterKind).includes(kind)) {
      return Response.json({ error: "kind inválido." }, { status: 400 });
    }

    if (kind === "IMAGES") {
      const pages = Array.isArray(body.pages) ? body.pages.map(String).filter(Boolean) : [];
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
        return Response.json({ error: "Envie textContent com o texto do capítulo." }, { status: 400 });
      }
    }

    const chapter = await prisma.chapter.create({
      data: {
        workId,
        number: body.number ?? null,
        title: body.title ?? null,
        kind,
        readMode: kind === "IMAGES" ? (body.readMode ?? ReadMode.SCROLL) : null,

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
    return Response.json({ error: "Erro interno ao criar capítulo. Veja o terminal." }, { status: 500 });
  }
}