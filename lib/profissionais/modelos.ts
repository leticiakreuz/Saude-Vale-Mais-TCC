export const CARGOS = ["medico", "enfermagem", "odontologia", "recepcao", "administracao"] as const;
export type Cargo = typeof CARGOS[number];
export const ROTULOS: Record<Cargo, string> = { medico: "Medicina", enfermagem: "Enfermagem", odontologia: "Odontologia", recepcao: "Recepção", administracao: "Administração" };
export const PERMISSOES = ["agenda.propria", "agenda.unidade", "agenda.gerenciar", "atendimento.registrar", "pacientes.buscar", "vacina.ler", "vacina.escrever", "receita.emitir", "profissionais.gerenciar", "escalas.gerenciar", "servicos.gerenciar", "relatorios.ler"] as const;
export type Permissao = typeof PERMISSOES[number];
export const LIMITES: Record<Cargo, readonly Permissao[]> = {
  medico: ["agenda.propria", "atendimento.registrar", "receita.emitir"],
  enfermagem: ["agenda.propria", "atendimento.registrar", "vacina.ler", "vacina.escrever", "receita.emitir"],
  odontologia: ["agenda.propria", "atendimento.registrar", "receita.emitir"],
  recepcao: ["agenda.unidade", "agenda.gerenciar", "pacientes.buscar", "atendimento.registrar"],
  administracao: ["profissionais.gerenciar", "escalas.gerenciar", "servicos.gerenciar", "relatorios.ler"],
};
export const PADRAO: Record<Cargo, readonly Permissao[]> = { ...LIMITES, enfermagem: ["agenda.propria", "atendimento.registrar", "vacina.ler", "vacina.escrever"] };
export interface Profissional {
  uid: string; nome: string; email: string; cargo: Cargo; unidadeReferencia: string;
  registro: string; nomeAgenda: string; ativo: boolean; permissoes: Permissao[]; versao: number;
}
export interface Consulta {
  id: string; pacienteId: string; pacienteNome: string; servico: string; medico: string;
  dia: string; horario: string; periodo: string; status: string; unidadeReferencia: string;
}
export function cargoValido(valor: unknown): valor is Cargo { return typeof valor === "string" && CARGOS.includes(valor as Cargo); }
export function permite(p: Profissional, permissao: Permissao): boolean { return p.ativo && LIMITES[p.cargo].includes(permissao) && p.permissoes.includes(permissao); }
export function caminhoCargo(cargo: Cargo) { return "/profissional/" + cargo; }
