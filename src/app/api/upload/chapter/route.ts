import { put } from "@vercel/blob";

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

export async function POST(req: Request) {
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
    console.error("Upload error:", error);
    return Response.json({ error: "Erro no upload." }, { status: 500 });
  }
}