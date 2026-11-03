export const ABAS_ADMIN = [
  ["inicio", "Visão da unidade"],
  ["historico", "Histórico de atendimentos"],
  ["equipe", "Equipe e permissões"],
  ["escalas", "Escalas e bloqueios"],
  ["funcionarios", "Funcionários por UBS"],
] as const;
export type AbaAdministracao = typeof ABAS_ADMIN[number][0];
export function abaAdministracao(valor: unknown): AbaAdministracao {
  if (valor === "relatorios") return "historico";
  if (valor === "servicos") return "funcionarios";
  return ABAS_ADMIN.some(([id]) => id === valor) ? valor as AbaAdministracao : "inicio";
}
export function caminhoAba(aba: AbaAdministracao) { return "/profissional/administracao?aba=" + aba; }
