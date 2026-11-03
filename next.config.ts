
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["firebase-admin"],
  outputFileTracingIncludes: { "/app-icon/*": ["./public/imagens/logo-saude-vale-mais-1.png"] },
};

export default nextConfig;
