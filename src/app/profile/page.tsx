import { redirect } from "next/navigation";
import LogoutButton from "./LogoutButton";
import { getCurrentUser } from "@/lib/getCurrentUser";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) redirect("/login");

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Meu perfil</h1>
      <p className="mt-2 text-sm opacity-80">
        Informações da sua conta e ações rápidas.
      </p>

      <section className="mt-6 rounded-xl border p-5">
        <div className="grid gap-3">
          <div>
            <div className="text-xs uppercase opacity-60">Nome</div>
            <div className="text-base">{user.name ?? "—"}</div>
          </div>

          <div>
            <div className="text-xs uppercase opacity-60">Email</div>
            <div className="text-base">{user.email ?? "—"}</div>
          </div>

          <div>
            <div className="text-xs uppercase opacity-60">Role</div>
            <div className="text-base">{user.role ?? "user"}</div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <LogoutButton />
        </div>
      </section>
    </main>
  );
}