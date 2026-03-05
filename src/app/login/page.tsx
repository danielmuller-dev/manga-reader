"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = (await res.json().catch(() => ({} as Record<string, unknown>))) as {
        error?: unknown;
      };

      if (!res.ok) {
        const err = typeof data.error === "string" ? data.error : "Erro no login.";
        setMsg(err);
        return;
      }

      // força recarregar o app inteiro (cookie novo + middleware)
      window.location.href = "/";
    } catch {
      setMsg("Erro de rede. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-fuchsia-600/30 blur-3xl" />
        <div className="absolute -bottom-52 -right-40 h-[620px] w-[620px] rounded-full bg-cyan-500/25 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),rgba(0,0,0,0.6))]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          {/* Brand */}
          <div className="mb-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
              <span className="text-sm font-semibold tracking-wide">Manga Reader</span>
              <span className="text-xs text-white/60">beta</span>
            </div>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight">Entrar</h1>
            <p className="mt-2 text-sm text-white/70">
              Faça login para acessar o conteúdo.
            </p>
          </div>

          {/* Card */}
          <form
            onSubmit={onSubmit}
            className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/70">Email</label>
                <input
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/10"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-sm text-white/70">Senha</label>
                <input
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/10"
                  type="password"
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              {msg ? (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {msg}
                </div>
              ) : null}

              <button
                className="mt-2 w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
                type="submit"
                disabled={loading}
              >
                {loading ? "Entrando..." : "Entrar"}
              </button>

              <p className="pt-2 text-center text-sm text-white/70">
                Não tem conta?{" "}
                <Link className="font-semibold text-white underline underline-offset-4" href="/register">
                  Criar conta
                </Link>
              </p>
            </div>
          </form>

          <p className="mt-6 text-center text-xs text-white/50">
            Ao entrar, você concorda em testar a versão beta do Manga Reader.
          </p>
        </div>
      </div>
    </main>
  );
}