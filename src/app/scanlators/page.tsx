import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type BaseScanlatorCard = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  description: string | null;
};

type MemberScanlatorCard = BaseScanlatorCard & {
  memberRole: "OWNER" | "EDITOR";
};

type MembershipRow = {
  role: "OWNER" | "EDITOR";
  scanlator: BaseScanlatorCard;
};

export default async function ScanlatorsPage() {
  const auth = await requireRole(["ADMIN", "SCAN"]);

  if (!auth.ok) {
    const message =
      auth.user === null
        ? "Você precisa estar logado."
        : "Sem permissão para acessar esta página.";

    return (
      <main className="min-h-screen bg-gray-50 p-6 text-gray-900">
        <div className="max-w-4xl mx-auto space-y-3">
          <h1 className="text-2xl font-semibold">Scanlators</h1>
          <p className="text-red-600">{message}</p>

          <div className="flex gap-3">
            <Link className="underline" href="/">
              Home
            </Link>
            <Link className="underline" href="/works">
              Obras
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const me = auth.user;

  // ✅ ADMIN: vê todos
  if (me.role === "ADMIN") {
    const scanlators: BaseScanlatorCard[] = await prisma.scanlator.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, slug: true, logoUrl: true, description: true },
    });

    return (
      <main className="min-h-screen bg-gray-50 p-6 text-gray-900">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Scanlators</h1>
              <p className="text-sm text-gray-600">Você vê todos os scanlators.</p>
            </div>

            <Link
              href="/admin"
              className="rounded-md bg-gray-900 px-3 py-2 text-sm text-white hover:bg-gray-800"
            >
              Admin
            </Link>
          </div>

          {scanlators.length === 0 ? (
            <div className="rounded-lg border bg-white p-4">
              <p className="text-gray-700">Nenhum scanlator encontrado.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {scanlators.map((s) => (
                <Link
                  key={s.id}
                  href={`/scanlators/${s.slug}`}
                  className="rounded-lg border bg-white p-4 hover:shadow-sm transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded bg-gray-100 flex items-center justify-center overflow-hidden">
                      {s.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.logoUrl} alt={s.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-xs text-gray-500">LOGO</span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2 className="font-semibold truncate">{s.name}</h2>
                      <p className="text-sm text-gray-600 truncate">/{s.slug}</p>

                      {s.description ? (
                        <p className="mt-2 text-sm text-gray-700 line-clamp-2">
                          {s.description}
                        </p>
                      ) : (
                        <p className="mt-2 text-sm text-gray-500">Sem descrição.</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    );
  }

  // ✅ SCAN: vê apenas os que ele pertence
  const memberships: MembershipRow[] = await prisma.scanlatorMember.findMany({
    where: { userId: me.id },
    orderBy: { createdAt: "desc" },
    select: {
      role: true,
      scanlator: { select: { id: true, name: true, slug: true, logoUrl: true, description: true } },
    },
  });

  const scanlators: MemberScanlatorCard[] = memberships.map((m) => ({
    ...m.scanlator,
    memberRole: m.role,
  }));

  return (
    <main className="min-h-screen bg-gray-50 p-6 text-gray-900">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Scanlators</h1>
            <p className="text-sm text-gray-600">
              Você vê apenas os scanlators que você pertence.
            </p>
          </div>

          <Link className="underline text-sm" href="/">
            Home
          </Link>
        </div>

        {scanlators.length === 0 ? (
          <div className="rounded-lg border bg-white p-4">
            <p className="text-gray-700">Nenhum scanlator encontrado.</p>
            <p className="text-sm text-gray-500">
              Peça para um admin te adicionar como membro de um scanlator.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {scanlators.map((s) => (
              <Link
                key={s.id}
                href={`/scanlators/${s.slug}`}
                className="rounded-lg border bg-white p-4 hover:shadow-sm transition"
              >
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded bg-gray-100 flex items-center justify-center overflow-hidden">
                    {s.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.logoUrl} alt={s.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs text-gray-500">LOGO</span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold truncate">{s.name}</h2>
                      <span className="text-xs rounded bg-gray-100 px-2 py-0.5 text-gray-700">
                        {s.memberRole}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 truncate">/{s.slug}</p>

                    {s.description ? (
                      <p className="mt-2 text-sm text-gray-700 line-clamp-2">
                        {s.description}
                      </p>
                    ) : (
                      <p className="mt-2 text-sm text-gray-500">Sem descrição.</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}