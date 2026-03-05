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

type ScanlatorMemberRole = "OWNER" | "EDITOR" | "UPLOADER";

type MemberScanlatorCard = BaseScanlatorCard & {
  memberRole: ScanlatorMemberRole;
};

type MembershipRow = {
  role: ScanlatorMemberRole;
  scanlator: BaseScanlatorCard;
};

function typeRoleLabel(role: ScanlatorMemberRole) {
  if (role === "OWNER") return "OWNER";
  if (role === "EDITOR") return "EDITOR";
  return "UPLOADER";
}

export default async function ScanlatorsPage() {
  const auth = await requireRole(["ADMIN", "SCAN"]);

  if (!auth.ok) {
    const message =
      auth.user === null
        ? "Você precisa estar logado."
        : "Sem permissão para acessar esta página.";

    return (
      <main className="min-h-screen text-white">
        {/* Background */}
        <div className="fixed inset-0 -z-10 bg-gradient-to-b from-black via-zinc-950 to-black" />
        <div className="fixed inset-0 -z-10 opacity-40">
          <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-56 left-10 h-[520px] w-[520px] rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-40 right-10 h-[520px] w-[520px] rounded-full bg-white/5 blur-3xl" />
        </div>

        <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Scanlators</h1>
              <p className="muted mt-1">
                Área restrita para equipes (SCAN) e administradores.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link className="btn-secondary" href="/">
                Home
              </Link>
              <Link className="btn-secondary" href="/works">
                Obras
              </Link>
            </div>
          </header>

          <div className="card p-6">
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              {message}
            </div>

            <div className="mt-4">
              <Link className="btn-primary" href="/login">
                Fazer login
              </Link>
            </div>
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
      <main className="min-h-screen text-white">
        {/* Background */}
        <div className="fixed inset-0 -z-10 bg-gradient-to-b from-black via-zinc-950 to-black" />
        <div className="fixed inset-0 -z-10 opacity-40">
          <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-56 left-10 h-[520px] w-[520px] rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-40 right-10 h-[520px] w-[520px] rounded-full bg-white/5 blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto px-4 py-10 space-y-6">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Scanlators</h1>
              <p className="muted mt-1">Você vê todos os scanlators cadastrados.</p>
            </div>

            <div className="flex items-center gap-2">
              <Link className="btn-secondary" href="/works">
                Obras
              </Link>
              <Link className="btn-secondary" href="/admin">
                Admin
              </Link>
            </div>
          </header>

          {scanlators.length === 0 ? (
            <div className="card p-6">
              <p className="text-white/80">Nenhum scanlator encontrado.</p>
              <p className="muted mt-1 text-sm">
                Crie um scanlator no painel Admin para gerenciar equipes e uploads.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {scanlators.map((s) => (
                <Link
                  key={s.id}
                  href={`/scanlators/${s.slug}`}
                  className="card card-hover p-4 group focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center overflow-hidden shrink-0">
                      {s.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={s.logoUrl}
                          alt={s.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <span className="text-[10px] text-white/60">LOGO</span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h2 className="font-semibold truncate text-white/90">{s.name}</h2>
                        <span className="chip">Equipe</span>
                      </div>

                      <p className="text-sm text-white/60 truncate">/{s.slug}</p>

                      {s.description ? (
                        <p className="mt-2 text-sm text-white/80 line-clamp-2">
                          {s.description}
                        </p>
                      ) : (
                        <p className="mt-2 text-sm text-white/55">Sem descrição.</p>
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
    <main className="min-h-screen text-white">
      {/* Background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-black via-zinc-950 to-black" />
      <div className="fixed inset-0 -z-10 opacity-40">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-56 left-10 h-[520px] w-[520px] rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-40 right-10 h-[520px] w-[520px] rounded-full bg-white/5 blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10 space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Scanlators</h1>
            <p className="muted mt-1">Você vê apenas os scanlators que você pertence.</p>
          </div>

          <div className="flex items-center gap-2">
            <Link className="btn-secondary" href="/">
              Home
            </Link>
            <Link className="btn-secondary" href="/works">
              Obras
            </Link>
          </div>
        </header>

        {scanlators.length === 0 ? (
          <div className="card p-6">
            <p className="text-white/80">Nenhum scanlator encontrado.</p>
            <p className="muted mt-1 text-sm">
              Peça para um admin te adicionar como membro de um scanlator.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {scanlators.map((s) => (
              <Link
                key={s.id}
                href={`/scanlators/${s.slug}`}
                className="card card-hover p-4 group focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              >
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center overflow-hidden shrink-0">
                    {s.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={s.logoUrl}
                        alt={s.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <span className="text-[10px] text-white/60">LOGO</span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="font-semibold truncate text-white/90">{s.name}</h2>
                      <span className="chip">{typeRoleLabel(s.memberRole)}</span>
                    </div>

                    <p className="text-sm text-white/60 truncate">/{s.slug}</p>

                    {s.description ? (
                      <p className="mt-2 text-sm text-white/80 line-clamp-2">
                        {s.description}
                      </p>
                    ) : (
                      <p className="mt-2 text-sm text-white/55">Sem descrição.</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="card p-4">
          <p className="text-xs text-white/70">
            Dica: use <span className="font-medium text-white/85">Shift + ←/→</span> no Reader para
            navegar entre capítulos rapidamente.
          </p>
        </div>
      </div>
    </main>
  );
}