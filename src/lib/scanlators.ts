import "server-only";
import { prisma } from "@/lib/prisma";
import { requireRole, type SessionUser, type Role } from "@/lib/auth";
import type { Scanlator, ScanlatorMemberRole } from "@prisma/client";

function normalizeSlug(input: string) {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function makeSlug(nameOrSlug: string) {
  const slug = normalizeSlug(nameOrSlug);
  if (!slug) throw new Error("Slug inválido.");
  return slug;
}

export type AuthFail = {
  ok: false;
  error: string;
  user: SessionUser | null;
};

export type AuthOk = {
  ok: true;
  user: SessionUser;
};

export type AuthResult = AuthOk | AuthFail;

export type AuthWithScanlatorOk = {
  ok: true;
  user: SessionUser;
  scanlator: Pick<Scanlator, "id" | "slug" | "name">;
};

export type AuthWithScanlatorResult = AuthWithScanlatorOk | AuthFail;

export async function requireAdmin(): Promise<AuthResult> {
  return requireRole(["ADMIN"]);
}

export async function requireScanOrAdmin(): Promise<AuthResult> {
  return requireRole(["ADMIN", "SCAN"]);
}

export async function canManageScanlator(
  userId: string,
  scanlatorId: string
): Promise<{ isMember: boolean; member: { id: string; role: ScanlatorMemberRole } | null }> {
  const member = await prisma.scanlatorMember.findUnique({
    where: { scanlatorId_userId: { scanlatorId, userId } },
    select: { id: true, role: true },
  });

  return { isMember: !!member, member };
}

export async function requireScanlatorAccessById(scanlatorId: string): Promise<AuthResult> {
  const auth = await requireScanOrAdmin();
  if (!auth.ok) return auth;

  if (auth.user.role === "ADMIN") return auth;

  const access = await canManageScanlator(auth.user.id, scanlatorId);
  if (!access.isMember) {
    return { ok: false, error: "Você não pertence a este scanlator.", user: auth.user };
  }

  return auth;
}

export async function requireScanlatorAccessBySlug(slug: string): Promise<AuthWithScanlatorResult> {
  const auth = await requireScanOrAdmin();
  if (!auth.ok) return auth;

  const scanlator = await prisma.scanlator.findUnique({
    where: { slug },
    select: { id: true, slug: true, name: true },
  });

  if (!scanlator) {
    return { ok: false, error: "Scanlator não encontrado.", user: auth.user };
  }

  if (auth.user.role === "ADMIN") {
    return { ok: true, user: auth.user, scanlator };
  }

  const access = await canManageScanlator(auth.user.id, scanlator.id);
  if (!access.isMember) {
    return { ok: false, error: "Você não pertence a este scanlator.", user: auth.user };
  }

  return { ok: true, user: auth.user, scanlator };
}