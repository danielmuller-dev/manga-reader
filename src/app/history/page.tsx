import Link from "next/link";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

type ProgressMode = "SCROLL" | "PAGINATED";

function formatChapterLabel(n: number | null, t: string | null) {
  const base = n != null ? `Cap. ${n}` : "Capítulo";
  return t ? `${base} — ${t}` : base;
}

function surfaceCoverFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center text-xs text-white/50">
      Sem capa
    </div>
  );
}

async function getUserId(): Promise<string | null> {
  const store = await cookies();
  return store.get("userId")?.value || null;
}

export default async function HistoryPage() {
  const userId = await getUserId();

  if (!userId) {
    return (
      <main className="min-h-screen">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold">Histórico de leitura</h1>
              <p className="muted text-sm">Entre na sua conta para ver seu histórico.</p>
            </div>

            <Link className="btn-secondary" href="/works">
              Obras
            </Link>
          </div>

          <div className="card p-5">
            <p className="text-sm text-white/70">
              Você precisa estar logado para ver seu histórico.
            </p>
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

  const progress = await prisma.readingProgress.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: 100,
    select: {
      mode: true,
      pageIndex: true,
      scrollY: true,
      updatedAt: true,
      chapterId: true,
      work: {
        select: {
          slug: true,
          title: true,
          coverUrl: true,
          type: true,
        },
      },
      chapter: {
        select: {
          number: true,
          title: true,
        },
      },
    },
  });

  return (
    <main className="min-h-screen">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Histórico de leitura</h1>
            <p className="muted text-sm">Continue exatamente de onde você parou.</p>
          </div>

          <div className="flex items-center gap-2">
            <Link className="btn-secondary" href="/">
              ← Home
            </Link>
            <Link className="btn-secondary" href="/works">
              Obras
            </Link>
          </div>
        </div>

        {progress.length === 0 ? (
          <div className="card p-5">
            <p className="text-sm text-white/70">
              Nenhum progresso ainda. Abra um capítulo e role a página (scroll) ou mude de
              página (paginado) para salvar automaticamente.
            </p>
            <div className="mt-4">
              <Link className="btn-primary" href="/works">
                Ver obras
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {progress.map((p) => {
              const mode = p.mode as ProgressMode;

              const qs =
                mode === "PAGINATED"
                  ? `?p=${p.pageIndex ?? 0}`
                  : `?s=${p.scrollY ?? 0}`;

              const where =
                mode === "PAGINATED"
                  ? `Página ${(p.pageIndex ?? 0) + 1}`
                  : `Scroll ${p.scrollY ?? 0}px`;

              const updated = p.updatedAt.toISOString();

              return (
                <Link
                  key={`${p.work.slug}-${p.chapterId}`}
                  href={`/read/${p.chapterId}${qs}`}
                  className="card card-hover p-4"
                  title={`Atualizado: ${updated}`}
                >
                  <div className="flex gap-3">
                    <div className="w-16 h-24 overflow-hidden rounded-xl border border-white/10 bg-black/30">
                      {p.work.coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.work.coverUrl}
                          alt={p.work.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        surfaceCoverFallback()
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-white/60">{p.work.type}</div>
                      <div className="font-semibold truncate">{p.work.title}</div>
                      <div className="text-sm text-white/80 truncate">
                        {formatChapterLabel(p.chapter.number, p.chapter.title)}
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="chip">{where}</span>
                        <span className="chip">Continuar</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}