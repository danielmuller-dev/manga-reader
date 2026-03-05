import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ContinueReading from "./ContinueReading";
import FavoriteButton from "./FavoriteButton";
import { cookies } from "next/headers";
import ChapterListClient, { type ChapterRowClient } from "./ChapterListClient";

type UserRole = "USER" | "SCAN" | "ADMIN";
type TagItem = { id: string; slug: string; name: string };

type ChapterKind = "IMAGES" | "TEXT";
type ReadMode = "SCROLL" | "PAGINATED";

type SortMode = "NUMBER_DESC" | "NEWEST" | "OLDEST";

type SearchParams = Record<string, string | string[] | undefined>;

async function getUserId(): Promise<string | null> {
  const store = await cookies();
  return store.get("userId")?.value || null;
}

function firstParam(v: string | string[] | undefined): string | null {
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v[0] ?? null;
  return null;
}

function parseSortMode(v: string | null): SortMode {
  if (v === "NEWEST" || v === "OLDEST" || v === "NUMBER_DESC") return v;
  return "NUMBER_DESC";
}

function parseCompact(v: string | null): boolean {
  // default: true
  if (v == null || v.trim() === "") return true;
  if (v === "0" || v === "false") return false;
  if (v === "1" || v === "true") return true;
  return true;
}

function coverFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center text-xs text-white/50">
      Sem capa
    </div>
  );
}

export default async function WorkPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: SearchParams;
}) {
  const { slug } = await params;

  const work = await prisma.work.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      title: true,
      type: true,
      description: true,
      coverUrl: true,
      tags: {
        select: {
          tag: {
            select: { id: true, slug: true, name: true },
          },
        },
      },
      chapters: {
        orderBy: [{ number: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          number: true,
          title: true,
          kind: true,
          readMode: true,
          createdAt: true,
          scanlator: {
            select: { id: true, slug: true, name: true },
          },
        },
      },
    },
  });

  if (!work) {
    return (
      <main className="min-h-screen">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="card p-5">
            <p className="text-sm text-white/70">Obra não encontrada.</p>
            <div className="mt-4">
              <Link className="btn-secondary" href="/works">
                Voltar
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const tags: TagItem[] = work.tags
    .map((t) => t.tag)
    .sort((a, b) => a.name.localeCompare(b.name));

  // 🔐 Permissão (UI)
  const userId = await getUserId();
  let role: UserRole | null = null;

  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    role = (user?.role as UserRole | undefined) ?? null;
  }

  const canManageChapters = role === "ADMIN" || role === "SCAN";

  // ✅ Serializa capítulos para props de Client Component
  const chapterRowsClient: ChapterRowClient[] = work.chapters.map((c) => ({
    id: c.id,
    number: c.number,
    title: c.title,
    kind: c.kind as ChapterKind,
    readMode: (c.readMode as ReadMode | null) ?? null,
    createdAtIso: c.createdAt.toISOString(),
    scanlator: c.scanlator
      ? { id: c.scanlator.id, slug: c.scanlator.slug, name: c.scanlator.name }
      : null,
  }));

  // ✅ Estado inicial vindo da URL (SSR/shareable)
  const sp = searchParams ?? {};
  const scan = (firstParam(sp.scan) ?? "ALL").trim() || "ALL";
  const q = firstParam(sp.q) ?? "";
  const sort = parseSortMode(firstParam(sp.sort));
  const compact = parseCompact(firstParam(sp.compact));

  return (
    <main className="min-h-screen">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2">
              <span className="chip">{work.type}</span>
              <span className="text-xs text-white/50 truncate">/{work.slug}</span>
            </div>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight">{work.title}</h1>

            {tags.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {tags.map((t) => (
                  <Link
                    key={t.id}
                    href={`/search?tag=${encodeURIComponent(t.slug)}&page=1`}
                    className="chip hover:bg-white/10 transition"
                    title={`Buscar por #${t.name}`}
                  >
                    #{t.name}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          <Link className="btn-secondary" href="/works">
            ← Voltar
          </Link>
        </div>

        {/* Ações */}
        <div className="flex flex-wrap items-center gap-2">
          <ContinueReading workId={work.id} />

          {canManageChapters ? (
            <Link href={`/works/${work.slug}/chapters/new`} className="btn-secondary">
              Adicionar capítulo
            </Link>
          ) : null}

          <FavoriteButton workId={work.id} />
        </div>

        {/* Info */}
        <div className="card p-5">
          <div className="flex flex-col sm:flex-row gap-5">
            <div className="w-32 h-48 overflow-hidden rounded-2xl border border-white/10 bg-black/30 shrink-0">
              {work.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={work.coverUrl}
                  alt={work.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                coverFallback()
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              <div className="text-sm font-semibold">Descrição</div>
              <p className="text-sm text-white/70 whitespace-pre-wrap">
                {work.description || "Sem descrição."}
              </p>

              <div className="pt-2 text-xs text-white/50">
                Dica: você pode ter várias versões do mesmo capítulo (ex: Cap. 12 — Reaper / Cap. 12 — Flame).
              </div>
            </div>
          </div>
        </div>

        {/* Capítulos */}
        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Capítulos</h2>
              <p className="muted text-sm">
                Filtre por scan, busque por título/número e ordene como preferir.
              </p>
            </div>

            <span className="chip">{chapterRowsClient.length} capítulo(s)</span>
          </div>

          {chapterRowsClient.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm text-white/70">
                Nenhum capítulo ainda.
                {canManageChapters ? " Clique em “Adicionar capítulo”." : ""}
              </p>
            </div>
          ) : (
            <ChapterListClient
              workSlug={work.slug}
              chapters={chapterRowsClient}
              canManageChapters={canManageChapters}
              initial={{ scan, q, sort, compact }}
            />
          )}
        </div>
      </div>
    </main>
  );
}