import { createHash } from "node:crypto";
import { ErroCadastro } from "./validacao";
import { ErroAcesso } from "@/lib/profissionais/autorizacao";
const tentativas = new Map<string,{quantidade:number;ate:number}>();
export async function corpoCadastro(request:Request, limitar=false):Promise<Record<string,unknown>> {
  const origin = request.headers.get("origin");
  // Next pode usar localhost internamente mesmo quando a prévia é aberta em 127.0.0.1.
  const host = request.headers.get("host") ?? new URL(request.url).host;
  if (!origin || !/^https?:\/\//.test(origin) || new URL(origin).host !== host) throw new ErroCadastro("Recarregue a página para continuar.",403);
  if (!request.headers.get("content-type")?.startsWith("application/json")) throw new ErroCadastro("Envie os dados do formulário.");
  const texto = await request.text();
  if (texto.length > 16000) throw new ErroCadastro("Formulário muito grande.",413);
  let dados;
  try { dados=JSON.parse(texto); } catch { throw new ErroCadastro("Formulário inválido."); }
  if (!dados || typeof dados !== "object" || Array.isArray(dados)) throw new ErroCadastro("Formulário inválido.");
  if (limitar) {
    const agora=Date.now(), chave=createHash("sha256").update(request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local").digest("hex");
    for (const [k,v] of tentativas) if (v.ate<agora) tentativas.delete(k);
    if (tentativas.size > 5000) throw new ErroCadastro("Aguarde alguns minutos antes de tentar novamente.",429);
    const atual=tentativas.get(chave) ?? {quantidade:0,ate:agora+3600000};
    if (atual.quantidade >= 10) throw new ErroCadastro("Muitas tentativas de cadastro. Tente mais tarde.",429);
    atual.quantidade++; tentativas.set(chave,atual);
  }
  return dados;
}
export function falhaCadastro(e:unknown) {
  const codigo = e && typeof e==="object" && "code" in e ? String(e.code) : "";
  const duplicado=["auth/email-already-exists","auth/email-already-in-use"].includes(codigo);
  return Response.json({erro: e instanceof ErroCadastro || e instanceof ErroAcesso ? e.message : duplicado ? "Este e-mail já possui uma conta. Entre para completar o cadastro." : "Não foi possível salvar o cadastro. Tente novamente."},{status:e instanceof ErroCadastro || e instanceof ErroAcesso ? e.status : duplicado ? 409 : 500,headers:{"Cache-Control":"no-store"}});
}
