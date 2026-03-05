import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function isPublicPath(pathname: string): boolean {
  // Páginas públicas
  if (pathname === "/login") return true;
  if (pathname === "/register") return true;

  // Rotas de API necessárias para autenticar e deslogar
  if (pathname === "/api/login") return true;
  if (pathname === "/api/register") return true;
  if (pathname === "/api/logout") return true;

  // Assets do Next / arquivos estáticos
  if (pathname.startsWith("/_next")) return true;
  if (pathname === "/favicon.ico") return true;
  if (pathname === "/robots.txt") return true;
  if (pathname === "/sitemap.xml") return true;

  // Se você tiver uploads locais expostos publicamente (ex: /uploads/*), libere aqui:
  // if (pathname.startsWith("/uploads")) return true;

  return false;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Deixa passar tudo que for público/estático
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const userId = req.cookies.get("userId")?.value ?? null;

  // Se não estiver logado, manda pro login
  if (!userId) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    // opcional: voltar pra página após login
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Aplica a tudo, exceto arquivos estáticos comuns
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};