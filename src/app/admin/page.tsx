import Link from "next/link";
import { requireRole } from "@/lib/auth";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const auth = await requireRole(["ADMIN"]);

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
              <h1 className="text-2xl font-semibold">Admin</h1>
              <p className="muted mt-1">Área restrita para administradores.</p>
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

  // UI real fica no client (AdminClient)
  return <AdminClient me={auth.user} />;
}