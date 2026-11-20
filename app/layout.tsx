import type { Metadata } from "next";
import AcessibilidadeGlobal from "../componentes/AcessibilidadeGlobal";
import ExigirCadastroCompleto from "@/componentes/cadastro/ExigirCadastroCompleto";
import "./globals.css";

export const metadata: Metadata = {
  title: "Saúde Vale+",
  description: "Plataforma digital para facilitar o acesso aos serviços de saúde pública.",
  appleWebApp: { capable: true, title: "Saúde Vale+", statusBarStyle: "default" },
  icons: {
    icon: { url: "/icon?v=saude-vale-1", type: "image/png", sizes: "64x64" },
    shortcut: "/icon?v=saude-vale-1",
    apple: "/app-icon/192?v=simbolo-2",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" data-scroll-behavior="smooth">
      <body className="font-sans">
        <ExigirCadastroCompleto>{children}</ExigirCadastroCompleto>
        <AcessibilidadeGlobal />
      </body>
    </html>
  );
}
