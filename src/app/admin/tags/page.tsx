import TagAdminClient from "@/components/TagAdminClient";
import { requireRoles } from "@/lib/auth-server";
import Link from "next/link";

export default async function AdminTagsPage() {
  const auth = await requireRoles(["ADMIN", "SCAN"]);

  if (!auth.ok) {
    return (
      <main className="min-h-screen text-white">
        {/* Background */}
        <div className="fixed inset-0 -z-10 bg-gradient-to-b from-black via-zinc-950 to-black" />
        <div className="fixed inset-0 -z-10 opacity-40">
          <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-56 left-10 h-[520px] w-[520px] rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-40 right-10 h-[520px] w-[520px] rounded-full bg-white/5 blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold">Tags</h1>
              <p className="muted mt-1 text-sm">Área administrativa.</p>
            </div>

            <div className="flex items-center gap-2">
              <Link className="btn-secondary" href="/admin">
                Admin
              </Link>
              <Link className="btn-secondary" href="/works">
                Obras
              </Link>
            </div>
          </header>

          <div className="card p-6">
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              Acesso negado.
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen text-white">
      {/* Background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-black via-zinc-950 to-black" />
      <div className="fixed inset-0 -z-10 opacity-40">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-56 left-10 h-[520px] w-[520px] rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-40 right-10 h-[520px] w-[520px] rounded-full bg-white/5 blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold">Gerenciar Tags</h1>
            <p className="muted mt-1 text-sm">
              Crie tags (gêneros) e associe às obras.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link className="btn-secondary" href="/admin">
              Painel Admin
            </Link>
            <Link className="btn-secondary" href="/works">
              Obras
            </Link>
          </div>
        </header>

        <div className="card p-6">
          <TagAdminClient />
        </div>
      </div>
    </main>
  );
}