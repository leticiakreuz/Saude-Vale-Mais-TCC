import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createElement } from "react";
import { ImageResponse } from "next/og";
export const runtime = "nodejs";
export async function GET(_request: Request, { params }: { params: Promise<{ tamanho: string }> }) {
  const { tamanho } = await params;
  const numero = Number(tamanho);
  if (![192, 512].includes(numero)) return new Response("Ícone não encontrado.", { status: 404 });
  const logo = await readFile(join(process.cwd(), "public/imagens/logo-saude-vale-mais-1.png"));
  return new ImageResponse(createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", backgroundColor: "#0A5C83" } }, createElement("img", { src: "data:image/png;base64," + logo.toString("base64"), width: numero * 0.9, height: numero * 0.45, alt: "Saúde Vale+" })), { width: numero, height: numero, headers: { "Cache-Control": "public, max-age=86400" } });
}
