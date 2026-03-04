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
      <main className="min-h-screen bg-gray-50 p-6 text-gray-900">
        <div className="max-w-4xl mx-auto space-y-3">
          <h1 className="text-2xl font-semibold">Admin</h1>

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

  return <AdminClient me={auth.user} />;
}