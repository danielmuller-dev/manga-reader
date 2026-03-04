"use client";

export default function LogoutButton() {
  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-lg border px-4 py-2 text-sm hover:bg-black/5"
      type="button"
    >
      Sair
    </button>
  );
}