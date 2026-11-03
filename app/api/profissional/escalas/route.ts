import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";
import { autorizar, conferirNaTransacao, corpo, ErroAcesso, identificador, json, respostaErro, texto } from "@/lib/profissionais/autorizacao";
import { configRef, servicoRef, SERVICOS_CARGO } from "@/lib/profissionais/agendaRegras";
import { auditoria } from "@/lib/profissionais/agendamentos";
import { dataReal, hojeBrasil } from "@/lib/profissionais/datas";
import { permite } from "@/lib/profissionais/modelos";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const p = await autorizar(request);
    if (!permite(p, "escalas.gerenciar") && !permite(p, "agenda.propria")) throw new ErroAcesso("Sem acesso às escalas.");
    let consulta = adminDb.collection("escalas").where("unidadeReferencia", "==", p.unidadeReferencia).where("dia", ">=", hojeBrasil());
    if (p.cargo !== "administracao") consulta = consulta.where("profissionalId", "==", p.uid);
    const docs = await consulta.orderBy("dia").limit(200).get();
    return json({ escalas: docs.docs.map(d => ({ id: d.id, ...d.data(), atualizadoEm: undefined })) });
  } catch (erro) { return respostaErro(erro); }
}
function lista(dados: Record<string, unknown>, campo: string): string[] {
  const valor = dados[campo];
  if (!Array.isArray(valor) || valor.length > 50 || valor.some(v => typeof v !== "string" || !v.trim() || v.length > 100)) throw new ErroAcesso("Lista inválida: " + campo, 400);
  return [...new Set(valor.map(v => v.trim()))].sort();
}
export async function POST(request: Request) {
  try {
    const p = await autorizar(request, "escalas.gerenciar"), dados = await corpo(request);
    const profissionalId = identificador(dados, "profissionalId"), dia = texto(dados, "dia", 10);
    const horarios = lista(dados, "horarios"), bloqueios = lista(dados, "bloqueios"), servicos = lista(dados, "servicos");
    if (!dataReal(dia) || dia < hojeBrasil() || !horarios.length || !servicos.length || horarios.some(h => !/^([01]\d|2[0-3]):[0-5]\d$/.test(h)) || bloqueios.some(h => !horarios.includes(h)) || typeof dados.ativo !== "boolean") throw new ErroAcesso("Confira data, horários, serviços e bloqueios.", 400);
    await adminDb.runTransaction(async tx => {
      await conferirNaTransacao(tx, p, "escalas.gerenciar");
      const profissional = await tx.get(adminDb.collection("profissionais").doc(profissionalId)), alvo = profissional.data();
      if (!alvo || alvo.ativo !== true || alvo.unidadeReferencia !== p.unidadeReferencia || !["medico", "enfermagem", "odontologia"].includes(alvo.cargo)) throw new ErroAcesso("Profissional indisponível nesta unidade.");
      for (const servico of servicos) {
        const definicao = await tx.get(servicoRef(p.unidadeReferencia, servico));
        const cargos = definicao.exists ? definicao.data()?.cargos : SERVICOS_CARGO[servico];
        if ((definicao.exists && definicao.data()?.ativo !== true) || !Array.isArray(cargos) || !cargos.includes(alvo.cargo)) throw new ErroAcesso("Serviço incompatível ou inativo: " + servico, 400);
      }
      const ref = configRef(p.unidadeReferencia, String(alvo.nomeAgenda), dia), anterior = await tx.get(ref);
      const proxima = { profissionalId, nomeAgenda: alvo.nomeAgenda, unidadeReferencia: p.unidadeReferencia, dia, horarios, bloqueios, servicos, ativo: dados.ativo };
      tx.set(ref, { ...proxima, atualizadoPor: p.uid, atualizadoEm: FieldValue.serverTimestamp() });
      auditoria(tx, p, "alterar-escala", ref.path, anterior.exists ? { horarios: anterior.data()?.horarios, bloqueios: anterior.data()?.bloqueios, ativo: anterior.data()?.ativo } : null, { horarios, bloqueios, ativo: dados.ativo });
    });
    return json({ mensagem: "Escala salva. Reservas existentes foram preservadas." });
  } catch (erro) { return respostaErro(erro); }
}
