"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import WorkSearch from "@/components/WorkSearch";
import { usePathname } from "next/navigation";

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

  const base = s.includes("@") ? s.split("@")[0] : s;

  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  const clean = base.replace(/[^a-zA-Z0-9]/g, "");
  if (clean.length >= 2) return clean.slice(0, 2).toUpperCase();
  return clean.slice(0, 1).toUpperCase() || "U";
}

function roleLabel(role: Role) {
  if (role === "ADMIN") return "Admin";
  if (role === "SCAN") return "Scan";
  return "User";
}

export default function HeaderClient() {
  const pathname = usePathname();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const hideHeader = pathname === "/login" || pathname === "/register";

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
    if (hideHeader) return;
    void loadMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hideHeader]);

  async function logout() {
    setMenuOpen(false);
    setUser(null);

    try {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Erro ao fazer logout:", err);
    }

    window.location.href = "/";
  }

  const displayName = useMemo(() => (user ? user.name ?? user.email : ""), [user]);
  const initials = useMemo(() => (user ? getInitials(displayName) : ""), [user, displayName]);

  const canSeeScanlators = user?.role === "SCAN" || user?.role === "ADMIN";
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    if (!menuOpen) return;

    function onDocMouseDown(ev: MouseEvent) {
      const el = menuRef.current;
      if (!el) return;
      const target = ev.target;
      if (target instanceof Node && !el.contains(target)) {
        setMenuOpen(false);
      }
    }

    function onKeyDown(ev: KeyboardEvent) {
      if (ev.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  if (hideHeader) {
    return null;
  }

  return (
    <header className="border-b bg-white">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
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

            {canSeeScanlators ? (
              <Link className="underline" href="/scanlators">
                Scanlators
              </Link>
            ) : null}

            {isAdmin ? (
              <Link className="underline" href="/admin">
                Admin
              </Link>
            ) : null}
          </nav>
        </div>

        <div className="flex-1 max-w-md hidden sm:block">
          <WorkSearch />
        </div>

        <div className="flex items-center gap-3 text-sm">
          <div className="sm:hidden w-[180px]">
            <WorkSearch />
          </div>

          {loading ? (
            <span className="opacity-60">Carregando...</span>
          ) : user ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-md border px-2 py-1.5 hover:bg-gray-50"
              >
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-700">
                  {initials}
                </div>

                <div className="hidden sm:flex flex-col items-start leading-tight">
                  <span className="max-w-[180px] truncate">{displayName}</span>
                  <span className="text-xs opacity-60">{roleLabel(user.role)}</span>
                </div>

                <span className="hidden sm:inline text-xs opacity-60">▾</span>
              </button>

              {menuOpen ? (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border bg-white shadow-lg overflow-hidden">
                  <div className="px-3 py-2 border-b">
                    <div className="text-sm font-medium truncate">{displayName}</div>
                    <div className="text-xs opacity-60">{user.email}</div>
                  </div>

                  <div className="p-1">
                    <Link
                      href="/me"
                      onClick={() => setMenuOpen(false)}
                      className="block rounded-lg px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      Minha conta
                    </Link>

                    <Link
                      href="/favorites"
                      onClick={() => setMenuOpen(false)}
                      className="block rounded-lg px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      Favoritos
                    </Link>

                    {canSeeScanlators ? (
                      <Link
                        href="/scanlators"
                        onClick={() => setMenuOpen(false)}
                        className="block rounded-lg px-3 py-2 text-sm hover:bg-gray-50"
                      >
                        Minha Scan
                      </Link>
                    ) : null}

                    {isAdmin ? (
                      <Link
                        href="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="block rounded-lg px-3 py-2 text-sm hover:bg-gray-50"
                      >
                        Admin
                      </Link>
                    ) : null}

                    <button
                      type="button"
                      onClick={logout}
                      className="w-full text-left rounded-lg px-3 py-2 text-sm hover:bg-gray-50 text-red-600"
                    >
                      Sair
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
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
    </header>
  );
}