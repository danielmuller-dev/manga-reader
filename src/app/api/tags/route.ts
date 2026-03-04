import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/auth-server";

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

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function GET() {
  const tags = await prisma.tag.findMany({
    select: { id: true, slug: true, name: true },
    orderBy: { name: "asc" },
  });
  return json({ items: tags });
}

export async function POST(req: Request) {
  const auth = await requireRoles(["ADMIN", "SCAN"]);
  if (!auth.ok) return json({ error: "Unauthorized" }, { status: auth.status });

  const body = (await req.json().catch(() => null)) as { name?: unknown } | null;
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (name.length < 2) {
    return json({ error: "Nome da tag inválido" }, { status: 400 });
  }

  const slug = slugify(name);
  if (!slug) return json({ error: "Slug inválido" }, { status: 400 });

  try {
    const tag = await prisma.tag.create({
      data: { name, slug },
      select: { id: true, slug: true, name: true },
    });
    return json({ tag });
  } catch (e) {
    // Pode ser unique constraint (name/slug)
    return json({ error: "Tag já existe" }, { status: 409 });
  }
}