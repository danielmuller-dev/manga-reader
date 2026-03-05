import type { Metadata } from "next";
import "./globals.css";
import HeaderClient from "@/components/HeaderClient";
import { headers } from "next/headers";

export const metadata: Metadata = {
  title: "Manga Reader",
  description: "Leitor PT-BR de Mangá / Manhwa / Manhua / Webtoon / Novel",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";

  const hideHeader =
    pathname.startsWith("/login") || pathname.startsWith("/register");

  return (
    <html lang="pt-BR">
      <body>
        {/* Background global (estilo login) */}
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-neutral-950">
          <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-fuchsia-600/25 blur-3xl" />
          <div className="absolute -bottom-52 -right-40 h-[620px] w-[620px] rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),rgba(0,0,0,0.70))]" />
        </div>

        {!hideHeader && <HeaderClient />}

        {/* Wrapper global (container + padding padrão) */}
        <div className="min-h-screen">
          <div className="container-site page">{children}</div>
        </div>
      </body>
    </html>
  );
}