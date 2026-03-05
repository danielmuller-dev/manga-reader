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
        {!hideHeader && <HeaderClient />}
        {children}
      </body>
    </html>
  );
}