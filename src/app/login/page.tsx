"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(data.error || "Erro no login.");
        return;
      }

      // ✅ força recarregar o app inteiro
      // assim o HeaderClient monta de novo e busca /api/me com o cookie novo
      window.location.href = "/";
    } catch {
      setMsg("Erro de rede. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <form
        className="w-full max-w-sm space-y-4 bg-white p-6 rounded-xl shadow text-gray-900"
        onSubmit={onSubmit}
      >
        <h1 className="text-2xl font-semibold text-center">Entrar</h1>

        <input
          className="w-full border rounded-md p-2"
          type="email"
          placeholder="email@exemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          className="w-full border rounded-md p-2"
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          className="w-full bg-black text-white rounded-md p-2 hover:opacity-90 disabled:opacity-60"
          type="submit"
          disabled={loading}
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>

        <p className="text-sm text-center">
          Não tem conta?{" "}
          <Link className="underline" href="/register">
            Criar conta
          </Link>
        </p>

        {msg && <p className="text-sm text-center text-red-600">{msg}</p>}
      </form>
    </main>
  );
}