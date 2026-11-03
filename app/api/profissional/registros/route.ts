import { FieldValue, type Transaction } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";
import { autorizar, conferirNaTransacao, corpo, ErroAcesso, identificador, json, respostaErro, texto } from "@/lib/profissionais/autorizacao";
import { permite, type Profissional } from "@/lib/profissionais/modelos";
import { auditoria } from "@/lib/profissionais/agendamentos";
import { chave } from "@/lib/profissionais/agendaRegras";
import { dataReal, hojeBrasil } from "@/lib/profissionais/datas";
import { FASES, VACINAS } from "@/lib/vacinacaoRegras";
export const runtime = "nodejs";
async function conferirPaciente(tx: Transaction, p: Profissional, pacienteId: string, consultaId: string, escrita: boolean) {
  const pacienteRef = adminDb.collection("usuarios").doc(pacienteId);
  const paciente = await tx.get(pacienteRef), consulta = await tx.get(pacienteRef.collection("agendamentos").doc(consultaId));
  const c = consulta.data();
  if (!paciente.exists || paciente.data()?.unidadeReferencia !== p.unidadeReferencia || !c || c.unidadeReferencia !== p.unidadeReferencia || c.medico !== p.nomeAgenda || ["cancelado", "falta"].includes(c.status)) throw new ErroAcesso("Paciente não vinculado a um atendimento autorizado da sua agenda.");
  if (escrita && c.dia > hojeBrasil()) throw new ErroAcesso("Selecione um atendimento da data atual ou anterior.", 400);
}
export async function GET(request: Request) {
  try {
    const p = await autorizar(request, "vacina.ler");
    const params = new URL(request.url).searchParams;
    if (!params.get("pacienteId")) return json({ registros: [] });
    const dados = Object.fromEntries(params);
    const pacienteId = identificador(dados, "pacienteId"), agendamentoId = identificador(dados, "agendamentoId");
    const registros = await adminDb.runTransaction(async tx => {
      await conferirNaTransacao(tx, p, "vacina.ler");
      await conferirPaciente(tx, p, pacienteId, agendamentoId, false);
      const docs = await tx.get(adminDb.collection("usuarios").doc(pacienteId).collection("vacinacao").limit(200));
      return docs.docs.map(d => { const v = d.data(); return { id: d.id, codigo: String(v.codigo ?? ""), vacina: String(v.vacina ?? v.nome ?? ""), dose: String(v.dose ?? ""), dataAplicacao: String(v.dataAplicacao ?? v.data ?? ""), lote: String(v.lote ?? ""), unidade: String(v.unidade ?? ""), revisao: Number(v.revisao ?? 1) }; });
    });
    return json({ registros });
  } catch (erro) { return respostaErro(erro); }
}
export async function POST(request: Request) {
  try {
    const dados = await corpo(request), tipo = texto(dados, "tipo", 20);
    if (!["vacina", "medicamento"].includes(tipo)) throw new ErroAcesso("Registro inválido.", 400);
    const permissao = tipo === "vacina" ? "vacina.escrever" : "receita.emitir";
    const p = await autorizar(request, permissao);
    if (tipo === "vacina" && !permite(p, "vacina.ler")) throw new ErroAcesso("É necessária permissão de consulta da vacinação.");
    const pacienteId = identificador(dados, "pacienteId"), consultaId = identificador(dados, "agendamentoId");
    let registro: Record<string, unknown>;
    let id: string;
    if (tipo === "vacina") {
      const codigo = texto(dados, "codigo", 60), catalogo = VACINAS.find(v => v.codigo === codigo);
      if (!catalogo) throw new ErroAcesso("Vacina não encontrada no catálogo demonstrativo.", 400);
      const data = texto(dados, "dataAplicacao", 10), dose = texto(dados, "dose", 40), fase = texto(dados, "fase", 20);
      if (!dataReal(data) || data > hojeBrasil() || !FASES.some(f => f.codigo === fase)) throw new ErroAcesso("Confira a data e a fase da aplicação.", 400);
      const periodoGestacao = texto(dados, "periodoGestacao", 10, true);
      if (periodoGestacao && !["atual", "anterior"].includes(periodoGestacao)) throw new ErroAcesso("Período gestacional inválido.", 400);
      registro = { codigo, vacina: catalogo.nome, dose, dataAplicacao: data, dataPrevista: "", lote: texto(dados, "lote", 60), fase, unidade: p.unidadeReferencia, status: "Aplicada", ...(fase === "Gestante" && periodoGestacao ? { periodoGestacao, anoGestacao: data.slice(0, 4) } : {}) };
      id = dados.registroId ? identificador(dados, "registroId") : chave(pacienteId, codigo, dose, data);
    } else {
      const proximaRetirada = texto(dados, "proximaRetirada", 10, true);
      const status = texto(dados, "status", 40);
      if (!["Disponível", "Indisponível", "Aguardando reposição"].includes(status) || (proximaRetirada && !dataReal(proximaRetirada))) throw new ErroAcesso("Confira disponibilidade e data de retirada.", 400);
      registro = { nome: texto(dados, "nome", 120), dosagem: texto(dados, "dosagem", 80), quantidade: texto(dados, "quantidade", 40), frequencia: texto(dados, "frequencia", 80), status, unidadeRetirada: p.unidadeReferencia, proximaRetirada, observacao: "RECEITA DEMONSTRATIVA — projeto acadêmico, sem validade clínica ou documental." };
      id = identificador(dados, "requisicaoId");
    }
    const ref = adminDb.collection("usuarios").doc(pacienteId).collection(tipo === "vacina" ? "vacinacao" : "medicamentos").doc(id);
    await adminDb.runTransaction(async tx => {
      await conferirNaTransacao(tx, p, permissao);
      await conferirPaciente(tx, p, pacienteId, consultaId, true);
      const anterior = await tx.get(ref);
      if (dados.registroId) {
        if (!anterior.exists || anterior.data()?.unidade !== p.unidadeReferencia) throw new ErroAcesso("Registro não pertence à sua unidade.");
        if (Number(anterior.data()?.revisao ?? 1) !== dados.revisaoEsperada) throw new ErroAcesso("O registro mudou. Atualize a lista.", 409);
      } else if (anterior.exists) throw new ErroAcesso("Este registro já foi cadastrado.", 409);
      // Mantém a autoria original e acrescenta a autoria da correção.
      tx.set(ref, { ...registro, pacienteId, agendamentoId: consultaId, demonstrativo: true, ...(anterior.exists ? {} : { profissionalUid: p.uid, profissionalNome: p.nome, criadoEm: FieldValue.serverTimestamp() }), atualizadoPor: p.uid, atualizadoEm: FieldValue.serverTimestamp(), revisao: Number(anterior.data()?.revisao ?? 0) + 1 }, { merge: true });
      auditoria(tx, p, anterior.exists ? "corrigir-vacina" : "registrar-" + tipo, ref.path, anterior.exists ? { revisao: Number(anterior.data()?.revisao ?? 1) } : null, { revisao: Number(anterior.data()?.revisao ?? 0) + 1 });
    });
    return json({ mensagem: "Registro demonstrativo salvo.", registroId: id }, 201);
  } catch (erro) { return respostaErro(erro); }
}
