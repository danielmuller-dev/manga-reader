import { prisma } from "@/lib/prisma";
import { requireAdmin, makeSlug } from "@/lib/scanlators";
import { NextRequest } from "next/server";

type PatchScanlatorBody = {
  name?: unknown;
  slug?: unknown;
  description?: unknown; // pode ser null
  logoUrl?: unknown; // pode ser null
};

function toTrimmedStringOrNull(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const s = value.trim();
  return s.length ? s : null;
}

function getOptionalString(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string") return undefined;
  return value;
}

function getNullableString(value: unknown): string | null | undefined {
  // undefined = não mexe
  // null = seta null
  // string = seta string
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  return value;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return Response.json({ error: auth.error }, { status: 401 });

  const { id } = await params;

  const scanlator = await prisma.scanlator.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      logoUrl: true,
      createdAt: true,
      members: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          role: true,
          createdAt: true,
          user: { select: { id: true, email: true, name: true, role: true } },
        },
      },
      works: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          createdAt: true,
          work: { select: { id: true, slug: true, title: true, coverUrl: true, type: true } },
        },
      },
      _count: { select: { chapters: true } },
    },
  });

  if (!scanlator) return Response.json({ error: "Scanlator não encontrado." }, { status: 404 });
  return Response.json({ scanlator });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return Response.json({ error: auth.error }, { status: 401 });

  const { id } = await params;

  let bodyUnknown: unknown;
  try {
    bodyUnknown = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido." }, { status: 400 });
  }

  const body = bodyUnknown as PatchScanlatorBody;

  const data: {
    name?: string;
    slug?: string;
    description?: string | null;
    logoUrl?: string | null;
  } = {};

  if (body.name !== undefined) {
    const name = toTrimmedStringOrNull(body.name);
    if (!name) return Response.json({ error: "Nome não pode ser vazio." }, { status: 400 });
    data.name = name;
  }

  if (body.slug !== undefined) {
    const slugRaw = getOptionalString(body.slug);
    if (!slugRaw) return Response.json({ error: "Slug inválido." }, { status: 400 });

    try {
      data.slug = makeSlug(slugRaw);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Slug inválido.";
      return Response.json({ error: msg }, { status: 400 });
    }
  }

  const description = getNullableString(body.description);
  if (description !== undefined) data.description = description;

  const logoUrl = getNullableString(body.logoUrl);
  if (logoUrl !== undefined) data.logoUrl = logoUrl;

  try {
    const updated = await prisma.scanlator.update({
      where: { id },
      data,
      select: { id: true, name: true, slug: true, description: true, logoUrl: true, updatedAt: true },
    });

    return Response.json({ scanlator: updated });
  } catch {
    return Response.json(
      { error: "Não foi possível atualizar (talvez scanlator não exista ou slug duplicado?)." },
      { status: 409 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return Response.json({ error: auth.error }, { status: 401 });

  const { id } = await params;

  try {
    await prisma.scanlator.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Não foi possível deletar (talvez não exista)." }, { status: 400 });
  }
}