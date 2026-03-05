import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = (await req.json()) as HandleUploadBody;

  try {
    const json = await handleUpload({
      request: req,
      body,
      onBeforeGenerateToken: async (pathname) => {
        // ✅ Regras básicas de segurança
        // - restringe upload a imagens
        // - limite por arquivo (ajuste se quiser)
        return {
          allowedContentTypes: ["image/*"],
          maximumSizeInBytes: 20 * 1024 * 1024, // 20MB por arquivo
          tokenPayload: JSON.stringify({
            userId: user.id,
            userRole: user.role,
            pathname,
          }),
        };
      },
      onUploadCompleted: async () => {
        // opcional: log / auditoria
      },
    });

    return NextResponse.json(json);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Erro no upload.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}