import type { Metadata } from "next";
import AcessibilidadeGlobal from "../componentes/AcessibilidadeGlobal";
import "./globals.css";

export const metadata: Metadata = {
  title: "Saúde Vale+",
  description: "Plataforma digital para facilitar o acesso aos serviços de saúde pública.",
  appleWebApp: { capable: true, title: "Saúde Vale+", statusBarStyle: "default" },
  icons: { apple: "/app-icon/192" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" data-scroll-behavior="smooth">
      <body className="font-sans">
        {children}
        <AcessibilidadeGlobal />
      </body>
    </html>
  );
}
