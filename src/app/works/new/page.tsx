import Link from "next/link";
import { requireRole } from "@/lib/auth";
import NewWorkClient from "./NewWorkClient";

export default async function NewWorkPage() {
  const auth = await requireRole(["SCAN", "ADMIN"]);

  if (!auth.ok) {
    const message =
      auth.user === null ? "Você precisa estar logado." : "Sem permissão para criar obra.";

    return (
      <main className="min-h-screen text-white">
        {/* Background premium */}
        <div className="fixed inset-0 -z-10 bg-gradient-to-b from-black via-zinc-950 to-black" />
        <div className="fixed inset-0 -z-10 opacity-40">
          <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-56 left-10 h-[520px] w-[520px] rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-40 right-10 h-[520px] w-[520px] rounded-full bg-white/5 blur-3xl" />
        </div>

        <div className="max-w-lg mx-auto p-6 space-y-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">Nova obra</h1>
            <p className="text-sm text-red-300">{message}</p>
          </div>

          <div className="card p-4">
            <p className="text-sm text-white/70">
              Se você acredita que isso é um erro, faça login com uma conta com permissão de{" "}
              <span className="font-medium text-white/85">SCAN</span> ou{" "}
              <span className="font-medium text-white/85">ADMIN</span>.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link className="btn-secondary" href="/works">
                ← Voltar para Obras
              </Link>
              <Link className="btn-ghost" href="/">
                Home
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen text-white">
      {/* Background premium (mantém consistência mesmo com Client Component) */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-black via-zinc-950 to-black" />
      <div className="fixed inset-0 -z-10 opacity-40">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-56 left-10 h-[520px] w-[520px] rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-40 right-10 h-[520px] w-[520px] rounded-full bg-white/5 blur-3xl" />
      </div>

      <NewWorkClient />
    </main>
  );
}