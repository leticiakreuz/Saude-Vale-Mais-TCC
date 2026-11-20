import { adminDb } from "@/lib/firebaseAdmin";
import { autenticar, json, respostaErro } from "@/lib/autorizacao";
import { cadastroCompleto } from "@/lib/cadastro/validacao";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const token = await autenticar(request);
    const perfil = await adminDb.collection("usuarios").doc(token.uid).get();
    const destino = cadastroCompleto(perfil.data()) ? "/dashboard" : "/completar-cadastro";
    const resposta = json({ destino });
    resposta.cookies.delete("sv-profissional");
    return resposta;
  } catch (erro) { return respostaErro(erro); }
}
export async function DELETE() { const resposta = json({ mensagem: "Sessão encerrada." }); resposta.cookies.delete("sv-profissional"); return resposta; }
