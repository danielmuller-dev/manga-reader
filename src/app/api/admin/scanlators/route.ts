import { prisma } from "@/lib/prisma";
import { requireAdmin, makeSlug } from "@/lib/scanlators";

type CreateScanlatorBody = {
  name?: unknown;
  slug?: unknown;
  description?: unknown;
  logoUrl?: unknown;
};

function toTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const s = value.trim();
  return s.length ? s : null;
}

function toNullableString(value: unknown): string | null {
  if (value === null) return null;
  if (value === undefined) return null;
  if (typeof value !== "string") return null;
  return value;
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return Response.json({ error: auth.error }, { status: 401 });

  const scanlators = await prisma.scanlator.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      logoUrl: true,
      createdAt: true,
      _count: { select: { members: true, works: true, chapters: true } },
    },
  });

  return Response.json({ scanlators });
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return Response.json({ error: auth.error }, { status: 401 });

  let bodyUnknown: unknown;
  try {
    bodyUnknown = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido." }, { status: 400 });
  }

  const body = bodyUnknown as CreateScanlatorBody;

  const name = toTrimmedString(body.name);
  if (!name) return Response.json({ error: "Nome é obrigatório." }, { status: 400 });

  const slugInput = toTrimmedString(body.slug) ?? name;

  let slug: string;
  try {
    slug = makeSlug(slugInput);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Slug inválido.";
    return Response.json({ error: msg }, { status: 400 });
  }

  const description = toNullableString(body.description);
  const logoUrl = toNullableString(body.logoUrl);

  try {
    const created = await prisma.scanlator.create({
      data: { name, slug, description, logoUrl },
      select: { id: true, name: true, slug: true, description: true, logoUrl: true, createdAt: true },
    });

    return Response.json({ scanlator: created }, { status: 201 });
  } catch {
    return Response.json(
      { error: "Não foi possível criar. Verifique se slug/nome já existem." },
      { status: 409 }
    );
  }
}