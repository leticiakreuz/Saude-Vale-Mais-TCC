import { gerarIconeApp } from "@/lib/iconeApp";
export const runtime = "nodejs";
export async function GET(_request: Request, { params }: { params: Promise<{ tamanho: string }> }) {
  const { tamanho } = await params;
  const numero = Number(tamanho);
  if (![192, 512].includes(numero)) return new Response("Ícone não encontrado.", { status: 404 });
  const resposta = await gerarIconeApp(numero);
  resposta.headers.set("Cache-Control", "public, max-age=86400");
  return resposta;
}
