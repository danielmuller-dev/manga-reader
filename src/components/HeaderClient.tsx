"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import WorkSearch from "@/components/WorkSearch";

type Role = "USER" | "SCAN" | "ADMIN";

type User = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
};

type MeResponse = { user: User } | { user: null };

function getInitials(label: string) {
  const s = (label || "").trim();
  if (!s) return "U";

  // Se for email, usa antes do @
  const base = s.includes("@") ? s.split("@")[0] : s;

  // Se tiver espaços, pega 2 iniciais
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  // Se for algo tipo muller_01 ou m1n1p1r0k4, pega 2 primeiras letras/números
  const clean = base.replace(/[^a-zA-Z0-9]/g, "");
  if (clean.length >= 2) return clean.slice(0, 2).toUpperCase();
  return clean.slice(0, 1).toUpperCase() || "U";
}

export default function HeaderClient() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadMe() {
    setLoading(true);
    try {
      const res = await fetch("/api/me", { cache: "no-store" });
      const data = (await res.json()) as MeResponse;
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMe();
  }, []);

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/";
  }

  const displayName = user ? user.name ?? user.email : "";
  const initials = user ? getInitials(displayName) : "";

  return (
    <header className="border-b bg-white">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* LEFT */}
        <div className="flex items-center gap-4">
          <Link href="/" className="font-semibold whitespace-nowrap">
            Manga Reader
          </Link>

          <nav className="hidden md:flex items-center gap-3 text-sm">
            <Link className="underline" href="/">
              Home
            </Link>
            <Link className="underline" href="/works">
              Obras
            </Link>
            <Link className="underline" href="/favorites">
              Favoritos
            </Link>
            {user?.role === "ADMIN" && (
              <Link className="underline" href="/admin">
                Admin
              </Link>
            )}
          </nav>
        </div>

        {/* CENTER - SEARCH */}
        <div className="flex-1 max-w-md hidden sm:block">
          <WorkSearch />
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-3 text-sm">
          {/* Mobile: search menor */}
          <div className="sm:hidden w-[180px]">
            <WorkSearch />
          </div>

          {loading ? (
            <span className="opacity-60">Carregando...</span>
          ) : user ? (
            <>
              <div className="hidden sm:flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-700 select-none">
                  {initials}
                </div>
                <span className="opacity-70 whitespace-nowrap">
                  {displayName} ({user.role})
                </span>
              </div>

              {/* Em telas pequenas, mostra só o avatar */}
              <div className="sm:hidden h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-700 select-none">
                {initials}
              </div>

              <button
                onClick={logout}
                className="rounded-md border px-3 py-2 hover:bg-gray-50"
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <Link className="underline whitespace-nowrap" href="/login">
                Login
              </Link>
              <Link
                className="rounded-md bg-black text-white px-3 py-2 hover:opacity-90 whitespace-nowrap"
                href="/register"
              >
                Criar conta
              </Link>
            </>
          )}
        </div>
      </div>

      {/* NAV mobile (pra não sumir) */}
      <div className="md:hidden max-w-6xl mx-auto px-4 pb-3">
        <nav className="flex items-center gap-3 text-sm">
          <Link className="underline" href="/">
            Home
          </Link>
          <Link className="underline" href="/works">
            Obras
          </Link>
          <Link className="underline" href="/favorites">
            Favoritos
          </Link>
          {user?.role === "ADMIN" && (
            <Link className="underline" href="/admin">
              Admin
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}