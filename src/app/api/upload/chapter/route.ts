import { put } from "@vercel/blob";
import { requireRole } from "@/lib/auth";

function sanitizeFilename(name: string): string {
  // Mantém letras/números/._- e troca o resto por "-"
  return name
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);
}

function makeSuffix(): string {
  return Math.random().toString(16).slice(2, 10);
}

function authStatus(auth: { user: { id: string } | null }) {
  return auth.user === null ? 401 : 403;
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

export async function POST(req: Request) {
  const auth = await requireRole(["SCAN", "ADMIN"]);
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: authStatus(auth) });
  }

  try {
    const form = await req.formData();
    const raw = form.getAll("files");

    const files: File[] = raw.filter((x): x is File => x instanceof File);

    if (files.length === 0) {
      return Response.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
    }

    // valida só imagens
    const nonImages = files.filter((f) => !f.type.startsWith("image/"));
    if (nonImages.length > 0) {
      return Response.json(
        { error: "Apenas arquivos de imagem são permitidos." },
        { status: 400 }
      );
    }

    const urls: string[] = [];

    // Upload sequencial preserva a ordem das páginas
    for (const file of files) {
      const safeName = sanitizeFilename(file.name || "image");
      const key = `chapters/${Date.now()}-${makeSuffix()}-${safeName}`;

      const blob = await put(key, file, { access: "public" });
      urls.push(blob.url);
    }

    return Response.json({ urls });
  } catch (error) {
    const msg = getErrorMessage(error);
    console.error("Upload error:", error);

    // mensagem amigável quando token/config do Blob está faltando/errada
    const maybeBlobConfig =
      msg.toLowerCase().includes("blob") ||
      msg.toLowerCase().includes("token") ||
      msg.toLowerCase().includes("forbidden") ||
      msg.toLowerCase().includes("unauthorized");

    return Response.json(
      {
        error: maybeBlobConfig
          ? "Erro no upload (Vercel Blob). Verifique se o Blob está habilitado no projeto e se as variáveis de ambiente do Blob foram configuradas no Vercel."
          : "Erro no upload.",
      },
      { status: 500 }
    );
  }
}