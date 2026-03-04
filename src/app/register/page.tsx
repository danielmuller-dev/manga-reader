"use client";

import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nickname,
        email,
        password,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setMsg(data.error || "Erro ao cadastrar.");
      return;
    }

    setMsg("Conta criada com sucesso! Agora faça login.");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 bg-white p-6 rounded-xl shadow"
      >
        <h1 className="text-2xl font-semibold text-center">
          Criar conta
        </h1>

        <input
          className="w-full border rounded-md p-2"
          type="text"
          placeholder="NickName"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          required
        />

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
          placeholder="Senha (mín. 6 caracteres)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          className="w-full bg-black text-white rounded-md p-2 hover:opacity-90"
        >
          Cadastrar
        </button>

        <p className="text-sm text-center">
          Já tem conta?{" "}
          <Link href="/login" className="underline">
            Entrar
          </Link>
        </p>

        {msg && (
          <p className="text-sm text-center text-red-500">
            {msg}
          </p>
        )}
      </form>
    </main>
  );
}