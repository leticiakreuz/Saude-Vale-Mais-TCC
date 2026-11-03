import "server-only";
import { FieldValue, type Transaction, type DocumentReference } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";
import { conferirNaTransacao, ErroAcesso, identificador, texto } from "./autorizacao";
import { chave, periodoDoHorario, profissaoDoServico, proximoStatus, TERMINAIS, validarOferta } from "./agendaRegras";
import { hojeBrasil } from "./datas";
import { permite, type Profissional, type Permissao } from "./modelos";
export function auditoria(tx: Transaction, p: { uid: string; unidadeReferencia: string }, acao: string, alvo: string, antes: unknown, depois: unknown) {
  tx.create(adminDb.collection("auditoria").doc(), { autorUid: p.uid, unidadeReferencia: p.unidadeReferencia, acao, alvo, antes, depois, criadoEm: FieldValue.serverTimestamp() });
}
export async function alterarAgendamento(p: Profissional, dados: Record<string, unknown>) {
  const acao = texto(dados, "acao", 20);
  const gerenciar = ["reservar", "remarcar", "cancelar"].includes(acao);
  const permissao: Permissao = gerenciar ? "agenda.gerenciar" : "atendimento.registrar";
  if (!permite(p, permissao)) throw new ErroAcesso("Você não tem permissão para alterar esta agenda.");
  const pacienteId = identificador(dados, "pacienteId");
  const pacienteRef = adminDb.collection("usuarios").doc(pacienteId);
  const id = acao === "reservar" ? pacienteRef.collection("agendamentos").doc().id : identificador(dados, "agendamentoId");
  const consultaRef = pacienteRef.collection("agendamentos").doc(id);
  const controleRef = pacienteRef.collection("controleAgendamento").doc("ativo");
  const reagendar = ["reservar", "remarcar"].includes(acao);
  const dia = reagendar ? texto(dados, "dia", 10) : "";
  const horario = reagendar ? texto(dados, "horario", 5) : "";
  const servico = reagendar ? texto(dados, "servico", 100) : "";
  const profissionalId = reagendar ? identificador(dados, "profissionalId") : "";
  await adminDb.runTransaction(async tx => {
    await conferirNaTransacao(tx, p, permissao);
    const paciente = await tx.get(pacienteRef);
    if (!paciente.exists || paciente.data()?.unidadeReferencia !== p.unidadeReferencia) throw new ErroAcesso("Paciente não vinculado à sua unidade.");
    const consultaSnap = await tx.get(consultaRef);
    const controle = await tx.get(controleRef);
    const consulta = consultaSnap.data();
    if (acao !== "reservar") {
      if (!consulta || consulta.unidadeReferencia !== p.unidadeReferencia) throw new ErroAcesso("Consulta não encontrada na sua unidade.", 404);
      if (p.cargo !== "recepcao" && consulta.medico !== p.nomeAgenda) throw new ErroAcesso("Você só pode alterar sua própria agenda.");
      if (consulta.status !== texto(dados, "statusEsperado", 30)) throw new ErroAcesso("Esta consulta mudou. Atualize a agenda.", 409);
    }
    let reservaAnteriorRef: DocumentReference | undefined;
    let reservaAnterior;
    if (consulta?.reservaId && /^[a-f0-9]{64}$/.test(consulta.reservaId)) {
      reservaAnteriorRef = adminDb.collection("horariosReservados").doc(consulta.reservaId);
      reservaAnterior = await tx.get(reservaAnteriorRef);
      if (reservaAnterior.exists && (reservaAnterior.data()?.pacienteId !== pacienteId || reservaAnterior.data()?.agendamentoId !== id)) throw new ErroAcesso("A reserva não corresponde a esta consulta.", 409);
    }
    if (reagendar) {
      if (acao === "remarcar" && !["agendado", "confirmado"].includes(consulta?.status)) throw new ErroAcesso("Apenas consultas agendadas ou confirmadas podem ser remarcadas.", 409);
      if (controle.data()?.agendamentoId && controle.data()?.agendamentoId !== id) {
        const anterior = await tx.get(pacienteRef.collection("agendamentos").doc(controle.data()!.agendamentoId));
        if (anterior.exists && !TERMINAIS.includes(String(anterior.data()?.status))) throw new ErroAcesso("O paciente já possui uma consulta ativa.", 409);
      }
      const profissionalSnap = await tx.get(adminDb.collection("profissionais").doc(profissionalId));
      const profissional = profissionalSnap.data();
      if (!profissional || !profissional.ativo || profissional.unidadeReferencia !== p.unidadeReferencia || !["medico", "odontologia", "enfermagem"].includes(profissional.cargo)) throw new ErroAcesso("Profissional indisponível nesta unidade.", 400);
      const nome = String(profissional.nomeAgenda ?? profissional.nome);
      await validarOferta(tx, p.unidadeReferencia, nome, dia, horario, servico, profissionalId);
      const reservaId = chave(p.unidadeReferencia, nome, dia, horario);
      const reservaRef = adminDb.collection("horariosReservados").doc(reservaId);
      const reserva = await tx.get(reservaRef);
      if (reserva.exists && reserva.data()?.status === "reservado" && !(reserva.data()?.pacienteId === pacienteId && reserva.data()?.agendamentoId === id)) throw new ErroAcesso("Este horário acabou de ser reservado. Escolha outro.", 409);
      const depois = { userId: pacienteId, servico, periodo: periodoDoHorario(horario), medico: nome, profissionalId, profissao: profissaoDoServico(servico), dia, horario, unidadeReferencia: p.unidadeReferencia, reservaId, status: "agendado" };
      if (reservaAnteriorRef && reservaAnteriorRef.id !== reservaId && reservaAnterior?.exists) tx.update(reservaAnteriorRef, { status: "cancelado", atualizadoEm: FieldValue.serverTimestamp() });
      tx.set(reservaRef, { unidadeReferencia: p.unidadeReferencia, medico: nome, dia, horario, periodo: depois.periodo, pacienteId, agendamentoId: id, status: "reservado", atualizadoEm: FieldValue.serverTimestamp() });
      tx.set(consultaRef, { ...depois, atualizadoPor: p.uid, atualizadoEm: FieldValue.serverTimestamp(), ...(acao === "reservar" ? { criadoEm: FieldValue.serverTimestamp() } : {}) }, { merge: true });
      tx.set(controleRef, { userId: pacienteId, agendamentoId: id, atualizadoEm: FieldValue.serverTimestamp() });
      auditoria(tx, p, acao, consultaRef.path, consulta ? { dia: consulta.dia, horario: consulta.horario, medico: consulta.medico, status: consulta.status } : null, { dia, horario, medico: nome, status: "agendado" });
    } else {
      const novoStatus = proximoStatus(String(consulta?.status), acao, p.cargo);
      if (["presente", "falta", "concluir"].includes(acao) && consulta!.dia > hojeBrasil()) throw new ErroAcesso("Não é possível registrar presença ou falta em uma data futura.", 400);
      tx.update(consultaRef, { status: novoStatus, atualizadoPor: p.uid, atualizadoEm: FieldValue.serverTimestamp() });
      if (TERMINAIS.includes(novoStatus)) {
        if (reservaAnteriorRef && reservaAnterior?.exists) tx.update(reservaAnteriorRef, { status: novoStatus, atualizadoEm: FieldValue.serverTimestamp() });
        if (controle.data()?.agendamentoId === id) tx.set(controleRef, { agendamentoId: null, atualizadoEm: FieldValue.serverTimestamp() }, { merge: true });
      }
      auditoria(tx, p, acao, consultaRef.path, { status: consulta!.status }, { status: novoStatus });
    }
  });
  return { mensagem: "Agendamento atualizado.", agendamentoId: id };
}
