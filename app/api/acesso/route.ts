import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { autenticar, profissionalDoToken, json, respostaErro, ErroAcesso } from "@/lib/profissionais/autorizacao";
import { caminhoCargo } from "@/lib/profissionais/modelos";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const token = await autenticar(request);
    const snap = await adminDb.collection("profissionais").doc(token.uid).get();
    if (!snap.exists && token.profissional !== true) { const resposta = json({ destino: "/dashboard" }); resposta.cookies.delete("sv-profissional"); return resposta; }
    const p = await profissionalDoToken(token);
    if (Date.now() / 1000 - token.auth_time > 300) throw new ErroAcesso("Para abrir uma sessão profissional, entre novamente com seu e-mail e senha.", 401);
    const session = await adminAuth.createSessionCookie(request.headers.get("authorization")!.slice(7).trim(), { expiresIn: 8 * 60 * 60 * 1000 });
    const resposta = json({ destino: caminhoCargo(p.cargo) });
    resposta.cookies.set("sv-profissional", session, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 8 * 60 * 60 });
    return resposta;
  } catch (erro) { return respostaErro(erro); }
}
export async function DELETE() { const resposta = json({ mensagem: "Sessão encerrada." }); resposta.cookies.delete("sv-profissional"); return resposta; }
