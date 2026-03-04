"use client";

import Link from "next/link";

type Role = "USER" | "SCAN" | "ADMIN";

type User = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
};

export default function AdminClient({ me }: { me: User }) {
  return (
    <main className="min-h-screen bg-gray-50 p-6 text-gray-900">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Painel Admin</h1>
          <p className="text-sm text-gray-600 mt-1">
            Bem-vindo {me.name ?? me.email}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/admin/works"
            className="rounded-lg border bg-white p-4 hover:bg-gray-50"
          >
            <div className="text-sm font-semibold">Gerenciar Obras</div>
            <div className="mt-1 text-sm text-gray-600">
              Visualizar todas as obras e gerenciar tags de cada uma.
            </div>
          </Link>

          <Link
            href="/admin/tags"
            className="rounded-lg border bg-white p-4 hover:bg-gray-50"
          >
            <div className="text-sm font-semibold">Gerenciar Tags</div>
            <div className="mt-1 text-sm text-gray-600">
              Criar e organizar os gêneros utilizados nas obras.
            </div>
          </Link>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm font-semibold">Atalhos</div>

          <div className="flex flex-wrap gap-2 mt-3">
            <Link
              href="/"
              className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
            >
              Home
            </Link>

            <Link
              href="/works"
              className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
            >
              Ver Obras
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}