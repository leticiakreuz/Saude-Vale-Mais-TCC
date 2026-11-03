import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/", name: "Saúde Vale+", short_name: "Saúde Vale+", lang: "pt-BR",
    description: "Consultas, medicamentos e vacinação — projeto acadêmico Saúde Vale+.",
    start_url: "/acesso", scope: "/", display: "standalone",
    background_color: "#F5F7FA", theme_color: "#0A5C83",
    icons: [
      { src: "/app-icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/app-icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
