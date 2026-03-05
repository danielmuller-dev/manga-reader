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

function navLinkClass(isActive: boolean) {
  return [
    "inline-flex items-center rounded-xl px-3 py-2 text-sm font-medium transition",
    "hover:bg-white/10",
    isActive ? "bg-white/10 text-white" : "text-white/80",
  ].join(" ");
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

  if (hideHeader) return null;

  const isHome = pathname === "/";
  const isWorks = pathname.startsWith("/works");
  const isFavorites = pathname.startsWith("/favorites");
  const isScanlators = pathname.startsWith("/scanlators");
  const isAdminPath = pathname.startsWith("/admin");

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-white/5 backdrop-blur">
      <div className="container-site">
        <div className="flex items-center justify-between gap-3 py-3">
          {/* Left */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold tracking-wide text-white hover:bg-white/10 transition"
            >
              <span>Manga Reader</span>
              <span className="text-xs text-white/60">beta</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <Link className={navLinkClass(isHome)} href="/">
                Home
              </Link>
              <Link className={navLinkClass(isWorks)} href="/works">
                Obras
              </Link>
              <Link className={navLinkClass(isFavorites)} href="/favorites">
                Favoritos
              </Link>

              {canSeeScanlators ? (
                <Link className={navLinkClass(isScanlators)} href="/scanlators">
                  Scanlators
                </Link>
              ) : null}

              {isAdmin ? (
                <Link className={navLinkClass(isAdminPath)} href="/admin">
                  Admin
                </Link>
              ) : null}
            </nav>
          </div>

          {/* Center Search */}
          <div className="flex-1 max-w-xl hidden sm:block">
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur px-3 py-2">
              <WorkSearch />
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            <div className="sm:hidden w-[190px]">
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur px-3 py-2">
                <WorkSearch />
              </div>
            </div>

            {loading ? (
              <span className="text-sm text-white/70">Carregando...</span>
            ) : user ? (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2 py-1.5 hover:bg-white/10 transition"
                >
                  <div className="h-9 w-9 rounded-full border border-white/10 bg-black/30 flex items-center justify-center text-xs font-semibold text-white">
                    {initials}
                  </div>

                  <div className="hidden sm:flex flex-col items-start leading-tight">
                    <span className="max-w-[190px] truncate text-sm text-white">
                      {displayName}
                    </span>
                    <span className="text-xs text-white/60">{roleLabel(user.role)}</span>
                  </div>

                  <span className="hidden sm:inline text-xs text-white/60">▾</span>
                </button>

                {menuOpen ? (
                  <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur">
                    <div className="px-4 py-3 border-b border-white/10">
                      <div className="text-sm font-semibold truncate text-white">{displayName}</div>
                      <div className="text-xs text-white/60 truncate">{user.email}</div>
                    </div>

                    <div className="p-2">
                      <Link
                        href="/me"
                        onClick={() => setMenuOpen(false)}
                        className="block rounded-xl px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white transition"
                      >
                        Minha conta
                      </Link>

                      <Link
                        href="/favorites"
                        onClick={() => setMenuOpen(false)}
                        className="block rounded-xl px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white transition"
                      >
                        Favoritos
                      </Link>

                      {canSeeScanlators ? (
                        <Link
                          href="/scanlators"
                          onClick={() => setMenuOpen(false)}
                          className="block rounded-xl px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white transition"
                        >
                          Minha Scan
                        </Link>
                      ) : null}

                      {isAdmin ? (
                        <Link
                          href="/admin"
                          onClick={() => setMenuOpen(false)}
                          className="block rounded-xl px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white transition"
                        >
                          Admin
                        </Link>
                      ) : null}

                      <div className="my-2 border-t border-white/10" />

                      <button
                        type="button"
                        onClick={logout}
                        className="w-full text-left rounded-xl px-3 py-2 text-sm font-medium text-red-200 hover:bg-red-500/10 transition"
                      >
                        Sair
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link className="btn-secondary" href="/login">
                  Login
                </Link>
                <Link className="btn-primary" href="/register">
                  Criar conta
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden pb-3">
          <div className="flex items-center gap-2 overflow-x-auto">
            <Link className={navLinkClass(isHome)} href="/">
              Home
            </Link>
            <Link className={navLinkClass(isWorks)} href="/works">
              Obras
            </Link>
            <Link className={navLinkClass(isFavorites)} href="/favorites">
              Favoritos
            </Link>

            {canSeeScanlators ? (
              <Link className={navLinkClass(isScanlators)} href="/scanlators">
                Scanlators
              </Link>
            ) : null}

            {isAdmin ? (
              <Link className={navLinkClass(isAdminPath)} href="/admin">
                Admin
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}