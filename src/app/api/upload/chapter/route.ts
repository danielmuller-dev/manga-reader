import { put } from "@vercel/blob";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const files = form.getAll("files") as File[];

    if (!files.length) {
      return Response.json(
        { error: "Nenhum arquivo enviado." },
        { status: 400 }
      );
    }

    const urls: string[] = [];

    for (const file of files) {
      const blob = await put(
        `chapters/${Date.now()}-${file.name}`,
        file,
        { access: "public" }
      );

      urls.push(blob.url);
    }

    return Response.json({ urls });

  } catch (error) {
    console.error("Upload error:", error);

    return Response.json(
      { error: "Erro no upload." },
      { status: 500 }
    );
  }
}