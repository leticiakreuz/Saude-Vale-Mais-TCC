import { adminDb } from "@/lib/firebaseAdmin";
import { autorizar, ErroAcesso, json, respostaErro } from "@/lib/profissionais/autorizacao";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const p = await autorizar(request, "pacientes.buscar"), termo = (new URL(request.url).searchParams.get("q") ?? "").trim();
    if (termo.length < 2 || termo.length > 80) throw new ErroAcesso("Digite ao menos duas letras do início do nome.", 400);
    const docs = await adminDb.collection("usuarios").where("unidadeReferencia", "==", p.unidadeReferencia).orderBy("nome").startAt(termo).endAt(termo + "\uf8ff").limit(20).get();
    return json({ pacientes: docs.docs.map(d => ({ uid: d.id, nome: String(d.data().nome ?? ""), dataNascimento: String(d.data().dataNascimento ?? "") })) });
  } catch (erro) { return respostaErro(erro); }
}
