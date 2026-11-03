import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";
import { autorizar, conferirNaTransacao, corpo, ErroAcesso, json, respostaErro, texto } from "@/lib/profissionais/autorizacao";
import { servicoRef, SERVICOS_CARGO } from "@/lib/profissionais/agendaRegras";
import { auditoria } from "@/lib/profissionais/agendamentos";
import { permite } from "@/lib/profissionais/modelos";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const p = await autorizar(request);
    if (!permite(p, "servicos.gerenciar") && !permite(p, "agenda.unidade")) throw new ErroAcesso("Sem acesso aos serviços.");
    const docs = await adminDb.collection("servicosAtendimento").where("unidadeReferencia", "==", p.unidadeReferencia).get();
    const servicos = new Map(Object.entries(SERVICOS_CARGO).map(([nome, cargos]) => [nome, { nome, cargos, ativo: true }]));
    docs.docs.forEach(d => servicos.set(d.data().nome, { nome: d.data().nome, cargos: d.data().cargos, ativo: d.data().ativo }));
    return json({ servicos: [...servicos.values()] });
  } catch (erro) { return respostaErro(erro); }
}
export async function POST(request: Request) {
  try {
    const p = await autorizar(request, "servicos.gerenciar"), dados = await corpo(request), nome = texto(dados, "nome", 100);
    if (!Array.isArray(dados.cargos) || !dados.cargos.length || dados.cargos.some(c => !["medico", "enfermagem", "odontologia"].includes(c)) || typeof dados.ativo !== "boolean") throw new ErroAcesso("Escolha as funções e o status do atendimento.", 400);
    await adminDb.runTransaction(async tx => {
      await conferirNaTransacao(tx, p, "servicos.gerenciar");
      const ref = servicoRef(p.unidadeReferencia, nome), anterior = await tx.get(ref);
      tx.set(ref, { nome, cargos: dados.cargos, ativo: dados.ativo, unidadeReferencia: p.unidadeReferencia, atualizadoEm: FieldValue.serverTimestamp() });
      auditoria(tx, p, "alterar-servico", ref.path, anterior.exists ? { ativo: anterior.data()?.ativo } : null, { nome, cargos: dados.cargos, ativo: dados.ativo });
    });
    return json({ mensagem: "Tipo de atendimento salvo." });
  } catch (erro) { return respostaErro(erro); }
}
