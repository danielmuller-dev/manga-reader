import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ContinueReading from "./ContinueReading";
import DeleteChapterButton from "./DeleteChapterButton";
import FavoriteButton from "./FavoriteButton";

export default async function WorkPage({
  params,
}: {
  params: Promise<{ slug: string }>;
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

      // ✅ Tags (WorkTag -> Tag)
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
        },
      },
    },
  });

  if (!work) {
    return (
      <main className="min-h-screen bg-gray-50 p-6 text-gray-900">
        <div className="max-w-3xl mx-auto space-y-4">
          <p>Obra não encontrada.</p>
          <Link className="underline" href="/works">
            Voltar
          </Link>
        </div>
      </main>
    );
  }

  const tags = work.tags
    .map((t) => t.tag)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <main className="min-h-screen bg-gray-50 p-6 text-gray-900">
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm opacity-70">{work.type}</div>
            <h1 className="text-3xl font-semibold">{work.title}</h1>
            <div className="text-sm opacity-70">/{work.slug}</div>

            {/* ✅ Tags (chips clicáveis) */}
            {tags.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {tags.map((t) => (
                  <Link
                    key={t.id}
                    href={`/search?tag=${encodeURIComponent(t.slug)}&page=1`}
                    className="rounded-full border bg-white px-3 py-1 text-xs hover:bg-gray-50"
                    title={`Buscar por #${t.name}`}
                  >
                    #{t.name}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          <Link className="underline" href="/works">
            ← Voltar
          </Link>
        </div>

        {/* Ações */}
        <div className="flex flex-wrap items-center gap-2">
          <ContinueReading workId={work.id} />

          <Link
            href={`/works/${work.slug}/chapters/new`}
            className="inline-block rounded-md border bg-white px-3 py-2 hover:bg-gray-50"
          >
            Adicionar capítulo
          </Link>

          <FavoriteButton workId={work.id} />
        </div>

        {/* Info */}
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex gap-4">
            <div className="w-28 h-40 bg-gray-100 rounded-md overflow-hidden flex items-center justify-center">
              {work.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={work.coverUrl}
                  alt={work.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs opacity-60">Sem capa</span>
              )}
            </div>

            <div className="flex-1 space-y-2">
              <div className="text-sm font-medium">Descrição</div>
              <p className="text-sm opacity-80">
                {work.description ? work.description : "Sem descrição."}
              </p>
            </div>
          </div>
        </div>

        {/* Chapters */}
        <div className="rounded-xl border bg-white p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Capítulos</h2>
            <span className="text-sm opacity-70">
              {work.chapters.length} capítulo(s)
            </span>
          </div>

          {work.chapters.length === 0 ? (
            <p className="text-sm opacity-70">
              Nenhum capítulo ainda. Clique em “Adicionar capítulo”.
            </p>
          ) : (
            <ul className="space-y-2">
              {work.chapters.map((c) => {
                const label =
                  c.number != null
                    ? `Cap. ${c.number}${c.title ? ` — ${c.title}` : ""}`
                    : `Capítulo${c.title ? ` — ${c.title}` : ""}`;

                return (
                  <li
                    key={c.id}
                    className="border rounded-lg p-3 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-medium">{label}</div>
                      <div className="text-xs opacity-70">
                        {c.kind}
                        {c.kind === "IMAGES" && c.readMode
                          ? ` • ${c.readMode}`
                          : ""}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        className="rounded-md bg-black text-white px-3 py-2 hover:opacity-90"
                        href={`/read/${c.id}`}
                      >
                        Ler
                      </Link>

                      <DeleteChapterButton chapterId={c.id} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}