import { prisma } from "@/lib/prisma";
import { requireAdmin, makeSlug } from "@/lib/scanlators";

type CreateScanlatorBody = {
  name?: unknown;
  slug?: unknown;
  description?: unknown;
  logoUrl?: unknown;
};

function authStatus(auth: { user: { id: string } | null }) {
  return auth.user === null ? 401 : 403;
}

function toTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const s = value.trim();
  return s.length ? s : null;
}

function toNullableTrimmedString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return null;
  const s = value.trim();
  return s.length ? s : null;
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: authStatus(auth) });
  }

  try {
    const scanlators = await prisma.scanlator.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logoUrl: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { members: true, works: true, chapters: true } },
      },
    });

    return Response.json({ scanlators });
  } catch (err) {
    console.error("Erro em GET /api/admin/scanlators:", err);
    return Response.json({ error: "Erro interno. Veja o terminal." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: authStatus(auth) });
  }

  let bodyUnknown: unknown;
  try {
    bodyUnknown = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido." }, { status: 400 });
  }

  const body = bodyUnknown as CreateScanlatorBody;

  const name = toTrimmedString(body.name);
  if (!name) {
    return Response.json({ error: "Nome é obrigatório." }, { status: 400 });
  }

  const slugInput = toTrimmedString(body.slug) ?? name;

  let slug: string;
  try {
    slug = makeSlug(slugInput);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Slug inválido.";
    return Response.json({ error: msg }, { status: 400 });
  }

  const description = toNullableTrimmedString(body.description);
  const logoUrl = toNullableTrimmedString(body.logoUrl);

  try {
    const created = await prisma.scanlator.create({
      data: { name, slug, description, logoUrl },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logoUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return Response.json({ scanlator: created }, { status: 201 });
  } catch (err) {
    console.error("Erro em POST /api/admin/scanlators:", err);
    return Response.json(
      { error: "Não foi possível criar. Verifique se slug/nome já existem." },
      { status: 409 }
    );
  }
}