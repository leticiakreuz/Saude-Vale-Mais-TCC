import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Saúde Vale+",
  description:
    "Plataforma digital para facilitar o acesso aos serviços de saúde pública.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="font-sans">
        {children}
      </body>
    </html>
  );
}