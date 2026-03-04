import type { Metadata } from "next";
import "./globals.css";
import HeaderClient from "@/components/HeaderClient";

export const metadata: Metadata = {
  title: "Manga Reader",
  description: "Leitor PT-BR de Mangá / Manhwa / Manhua / Webtoon / Novel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <HeaderClient />
        {children}
      </body>
    </html>
  );
}