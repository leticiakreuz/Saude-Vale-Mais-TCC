
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  serverExternalPackages: ["firebase-admin"],
  outputFileTracingIncludes: {
    "/app-icon/*": ["./public/imagens/logo-saude-vale-mais-1.png"],
    "/icon": ["./public/imagens/logo-saude-vale-mais-1.png"],
  },
};

export default nextConfig;
