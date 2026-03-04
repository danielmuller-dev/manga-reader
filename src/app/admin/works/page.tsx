import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/auth-server";
import type { WorkType } from "@prisma/client";

type WorkRow = {
  id: string;
  title: string;
  slug: string;
  type: WorkType;
  _count: { chapters: number };
};

export default async function AdminWorksPage() {
  const auth = await requireRoles(["ADMIN", "SCAN"]);
  if (!auth.ok) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-xl font-semibold">Obras</h1>
        <p className="mt-2 text-sm text-gray-600">Acesso negado.</p>
      </div>
    );
  }

  const works: WorkRow[] = await prisma.work.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      type: true,
      _count: { select: { chapters: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Obras (Admin)</h1>
          <p className="mt-2 text-sm text-gray-600">Gerencie tags e navegue para a obra.</p>
        </div>

        <Link className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50" href="/admin/tags">
          Gerenciar Tags
        </Link>
      </div>

      <div className="mt-6 rounded-lg border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="p-3">Título</th>
              <th className="p-3">Tipo</th>
              <th className="p-3">Capítulos</th>
              <th className="p-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {works.map((w) => (
              <tr key={w.id} className="border-t">
                <td className="p-3">
                  <div className="font-medium">{w.title}</div>
                  <div className="text-xs text-gray-500">ID: {w.id}</div>
                </td>
                <td className="p-3">{w.type}</td>
                <td className="p-3">{w._count.chapters}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-2">
                    <Link
                      className="rounded-md border px-3 py-2 text-xs hover:bg-gray-50"
                      href={`/admin/works/${w.id}/tags`}
                    >
                      Tags
                    </Link>
                    <Link
                      className="rounded-md border px-3 py-2 text-xs hover:bg-gray-50"
                      href={`/works/${w.slug}`}
                    >
                      Ver obra
                    </Link>
                  </div>
                </td>
              </tr>
            ))}

            {works.length === 0 ? (
              <tr>
                <td className="p-3 text-gray-600" colSpan={4}>
                  Nenhuma obra cadastrada.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}