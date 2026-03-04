import Link from "next/link";
import { prisma } from "@/lib/prisma";

type TagItem = { id: string; slug: string; name: string };
type WorkTagRow = { tag: TagItem };

export default async function WorkTagsBySlug({ slug }: { slug: string }) {
  const work = await prisma.work.findUnique({
    where: { slug },
    select: {
      id: true,
      tags: {
        select: {
          tag: { select: { id: true, slug: true, name: true } },
        },
      },
    },
  });

  if (!work) return null;

  const tagRows: WorkTagRow[] = (work.tags as unknown as WorkTagRow[]) ?? [];
  const tags = tagRows
    .map((t) => t.tag)
    .sort((a, b) => a.name.localeCompare(b.name));

  if (tags.length === 0) return null;

  return (
    <div className="mt-4">
      <div className="text-xs text-gray-500 mb-2">Tags</div>
      <div className="flex flex-wrap gap-2">
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
    </div>
  );
}