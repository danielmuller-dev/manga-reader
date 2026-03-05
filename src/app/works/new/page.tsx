import Link from "next/link";
import { requireRole } from "@/lib/auth";
import NewWorkClient from "./NewWorkClient";

export default async function NewWorkPage() {
  const auth = await requireRole(["SCAN", "ADMIN"]);

  if (!auth.ok) {
    const message =
      auth.user === null ? "Você precisa estar logado." : "Sem permissão para criar obra.";

    return (
      <main className="min-h-screen bg-gray-50 p-6 text-gray-900">
        <div className="max-w-lg mx-auto space-y-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">Nova obra</h1>
            <p className="text-sm text-red-600">{message}</p>
          </div>

          <div className="flex gap-3">
            <Link className="underline" href="/works">
              Voltar para Obras
            </Link>
            <Link className="underline" href="/">
              Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return <NewWorkClient />;
}