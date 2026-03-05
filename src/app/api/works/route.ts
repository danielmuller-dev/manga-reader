import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { NextRequest } from "next/server";

type CreateBody = {
  slug?: unknown;
  title?: unknown;
  description?: unknown;
  coverUrl?: unknown;
  type?: unknown;
};

type WorkType = "MANGA" | "MANHWA" | "MANHUA" | "WEBTOON" | "NOVEL";

const WORK_TYPES: readonly WorkType[] = ["MANGA", "MANHWA", "MANHUA", "WEBTOON", "NOVEL"] as const;

function authStatus(auth: { user: { id: string } | null }) {
  return auth.user === null ? 401 : 403;
}

function toTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const s = value.trim();
  return s.length ? s : null;
}

function toNullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return null;
  return value;
}

function toWorkType(value: unknown): WorkType | null {
  if (typeof value !== "string") return null;
  const v = value.trim().toUpperCase();
  return (WORK_TYPES as readonly string[]).includes(v) ? (v as WorkType) : null;
}

export async function GET(_req: NextRequest) {
  const works = await prisma.work.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      type: true,
      coverUrl: true,
      createdAt: true,
    },
  });

  return Response.json({ works });
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(["SCAN", "ADMIN"]);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: authStatus(auth) });

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido." }, { status: 400 });
  }

  const body: CreateBody = (typeof raw === "object" && raw !== null ? (raw as CreateBody) : {});

  const slug = toTrimmedString(body.slug);
  const title = toTrimmedString(body.title);
  const description = toNullableString(body.description);
  const coverUrl = toNullableString(body.coverUrl);
  const type = toWorkType(body.type);

  if (!slug || !title || !type) {
    return Response.json({ error: "slug, title e type são obrigatórios." }, { status: 400 });
  }

  try {
    const exists = await prisma.work.findUnique({ where: { slug }, select: { id: true } });
    if (exists) return Response.json({ error: "Esse slug já existe." }, { status: 409 });

    const work = await prisma.work.create({
      data: { slug, title, description, coverUrl, type },
      select: { id: true, slug: true, title: true, type: true },
    });

    return Response.json({ work }, { status: 201 });
  } catch (err) {
    console.error("Erro em POST /api/works:", err);
    return Response.json({ error: "Erro interno. Veja o terminal." }, { status: 500 });
  }
}