import { createHash } from "node:crypto";
import type { Transaction, DocumentData } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";
import { ErroAcesso } from "./autorizacao";
import { dataAgendavel, hojeBrasil } from "./datas";
import type { Cargo } from "./modelos";
export const HORARIOS = { Manhã: ["07:30", "08:30", "10:30", "11:30"], Tarde: ["13:30", "14:30", "16:00"] };
export const LEGADOS: Record<string, string[]> = { "Clínico geral": ["Dr. Rafael Martins", "Dra. Juliana Costa"], Pediatra: ["Dra. Mariana Alves", "Dr. Felipe Rocha"], Dentista: ["Dra. Camila Souza", "Dr. Bruno Lima"] };
export const SERVICOS: Record<string, string[]> = { Manhã: ["Consulta médica", "Pediatria", "Odontologia", "Consulta de retorno", "Renovação de receita"], Tarde: ["Odontologia", "Renovação de receita"] };
export const SERVICOS_CARGO: Record<string, Cargo[]> = { "Consulta médica": ["medico"], Pediatria: ["medico"], "Consulta de retorno": ["medico"], "Renovação de receita": ["medico"], Odontologia: ["odontologia"], "Atendimento de enfermagem": ["enfermagem"] };
export const chave = (...partes: string[]) => createHash("sha256").update(JSON.stringify(partes)).digest("hex");
export const configRef = (unidade: string, nome: string, dia: string) => adminDb.collection("escalas").doc(chave(unidade, nome, dia));
export const vinculoRef = (unidade: string, nome: string) => adminDb.collection("vinculosAgenda").doc(chave(unidade, nome));
export const servicoRef = (unidade: string, nome: string) => adminDb.collection("servicosAtendimento").doc(chave(unidade, nome));
export function profissaoDoServico(servico: string) { return servico === "Pediatria" ? "Pediatra" : servico === "Odontologia" ? "Dentista" : servico === "Atendimento de enfermagem" ? "Enfermagem" : "Clínico geral"; }
export function periodoDoHorario(horario: string) { return horario < "12:00" ? "Manhã" : "Tarde"; }
export function grade(config: DocumentData | undefined, nome: string, servico?: string): { horario: string; bloqueado: boolean }[] {
  if (config) return (Array.isArray(config.horarios) ? config.horarios as string[] : []).filter(h => !servico || config.servicos?.includes(servico)).map(h => ({ horario: h, bloqueado: config.ativo !== true || config.bloqueios?.includes(h) === true }));
  const profissao = Object.keys(LEGADOS).find(p => LEGADOS[p].includes(nome));
  if (!profissao) return [];
  return Object.entries(HORARIOS).flatMap(([periodo, horarios]) => horarios.filter(() => !servico || (SERVICOS[periodo].includes(servico) && profissaoDoServico(servico) === profissao)).map(horario => ({ horario, bloqueado: false })));
}
export function validarDataHorario(dia: string, horario: string) {
  if (!dataAgendavel(dia) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(horario)) throw new ErroAcesso("Escolha um dia útil nos próximos 21 dias e um horário válido.", 400);
  const horaAtual = new Intl.DateTimeFormat("en-GB", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());
  if (dia === hojeBrasil() && horario <= horaAtual) throw new ErroAcesso("Este horário já passou. Escolha outro.", 400);
}
export async function validarOferta(tx: Transaction, unidade: string, nome: string, dia: string, horario: string, servico: string, profissionalId?: string) {
  validarDataHorario(dia, horario);
  const config = await tx.get(configRef(unidade, nome, dia));
  const vinculo = await tx.get(vinculoRef(unidade, nome));
  const uid = profissionalId ?? vinculo.data()?.uid;
  const profissional = typeof uid === "string" ? await tx.get(adminDb.collection("profissionais").doc(uid)) : null;
  if (uid && (!profissional?.exists || profissional.data()?.ativo !== true || profissional.data()?.unidadeReferencia !== unidade || profissional.data()?.nomeAgenda !== nome)) throw new ErroAcesso("Profissional indisponível nesta unidade.", 409);
  const definicao = await tx.get(servicoRef(unidade, servico));
  const cargos = definicao.exists ? definicao.data()?.cargos : SERVICOS_CARGO[servico];
  if (definicao.exists && definicao.data()?.ativo !== true) throw new ErroAcesso("Tipo de atendimento inativo.", 409);
  if (profissional?.exists && (!Array.isArray(cargos) || !cargos.includes(profissional.data()?.cargo))) throw new ErroAcesso("Tipo de atendimento incompatível com o profissional.", 400);
  if (!grade(config.data(), nome, servico).some(h => h.horario === horario && !h.bloqueado)) throw new ErroAcesso("Horário fora da escala ou bloqueado.", 409);
}
export const TERMINAIS = ["cancelado", "concluido", "concluído", "finalizado", "falta"];
export function proximoStatus(status: string, acao: string, cargo: Cargo) {
  const transicoes: Record<string, Record<string, string>> = { agendado: { confirmar: "confirmado", presente: "presente", falta: "falta", cancelar: "cancelado" }, confirmado: { presente: "presente", falta: "falta", cancelar: "cancelado" }, presente: { concluir: "concluido" } };
  const novo = transicoes[status]?.[acao];
  if (!novo || (cargo === "recepcao" && acao === "concluir") || (cargo !== "recepcao" && acao === "cancelar")) throw new ErroAcesso("Essa alteração não é permitida para a situação atual da consulta.", 409);
  return novo;
}
