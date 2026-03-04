import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function json(data: unknown, init?: ResponseInit) {
  return new NextResponse(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...(init?.headers ?? {}),
    },
  });
}

function clampInt(value: string | null, def: number, min: number, max: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return def;
  const i = Math.trunc(n);
  return Math.max(min, Math.min(max, i));
}

const WorkTypes = ["MANGA", "MANHWA", "MANHUA", "WEBTOON", "NOVEL"] as const;
type WorkType = (typeof WorkTypes)[number];

const Sorts = ["TITLE_ASC", "RECENT", "CHAPTERS_DESC"] as const;
type Sort = (typeof Sorts)[number];

function parseWorkType(value: string | null): WorkType | null {
  if (!value) return null;
  const v = value.toUpperCase();
  return (WorkTypes as readonly string[]).includes(v) ? (v as WorkType) : null;
}

function parseSort(value: string | null): Sort {
  if (!value) return "TITLE_ASC";
  const v = value.toUpperCase();
  return (Sorts as readonly string[]).includes(v) ? (v as Sort) : "TITLE_ASC";
}

function sanitizeTagSlug(value: string | null) {
  const s = (value ?? "").trim().toLowerCase();
  if (!s) return "";
  // slug padrão: letras/números/hífen
  return s.replace(/[^a-z0-9-]/g, "").slice(0, 60);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const q = (searchParams.get("q") ?? "").trim();
    const tag = sanitizeTagSlug(searchParams.get("tag"));

    const page = clampInt(searchParams.get("page"), 1, 1, 10000);
    const take = clampInt(searchParams.get("take"), 12, 1, 50);
    const skip = (page - 1) * take;

    const type = parseWorkType(searchParams.get("type"));
    const sort = parseSort(searchParams.get("sort"));

    const shouldSearchByText = q.length >= 2;
    const shouldSearchByTag = tag.length >= 2;

    // Se não tem texto suficiente e nem tag, não busca
    if (!shouldSearchByText && !shouldSearchByTag) {
      return json({ items: [], total: 0, page, take });
    }

    const safeQ = q.slice(0, 80);

    const where = {
      ...(shouldSearchByText
        ? { title: { contains: safeQ, mode: "insensitive" as const } }
        : {}),
      ...(type ? { type } : {}),
      ...(shouldSearchByTag
        ? {
            tags: {
              some: {
                tag: { slug: tag },
              },
            },
          }
        : {}),
    };

    const orderBy =
      sort === "RECENT"
        ? [{ updatedAt: "desc" as const }]
        : sort === "CHAPTERS_DESC"
          ? [{ chapters: { _count: "desc" as const } }, { title: "asc" as const }]
          : [{ title: "asc" as const }];

    const [total, items] = await Promise.all([
      prisma.work.count({ where }),
      prisma.work.findMany({
        where,
        select: {
          id: true,
          slug: true,
          title: true,
          coverUrl: true,
          description: true,
          type: true,
          _count: { select: { chapters: true } },
        },
        orderBy,
        skip,
        take,
      }),
    ]);

    return json({ items, total, page, take });
  } catch (err) {
    console.error("GET /api/works/search error:", err);
    return json({ error: "Internal error" }, { status: 500 });
  }
}