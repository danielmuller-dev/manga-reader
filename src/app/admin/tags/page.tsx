import TagAdminClient from "@/components/TagAdminClient";
import { requireRoles } from "@/lib/auth-server";

export default async function AdminTagsPage() {
  const auth = await requireRoles(["ADMIN", "SCAN"]);
  if (!auth.ok) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6">
        <h1 className="text-xl font-semibold">Tags</h1>
        <p className="mt-2 text-sm text-gray-600">Acesso negado.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold">Gerenciar Tags</h1>
      <p className="mt-2 text-sm text-gray-600">
        Crie tags (gêneros) e depois associe às obras.
      </p>

      <div className="mt-6">
        <TagAdminClient />
      </div>
    </div>
  );
}