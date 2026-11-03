export type DadosCadastro = { nome: string; cpf: string; telefone: string; dataNascimento: string; numeroSUS: string; emailResponsavel: string; cep: string; rua: string; numero: string; bairro: string; cidade: string; uf: string };
export class ErroCadastro extends Error { constructor(message: string, public status = 400) { super(message); } }
export const numeros = (v: string) => v.replace(/\D/g, "");
export function validarCPF(valor: string) {
  const n = numeros(valor);
  if (!/^\d{11}$/.test(n) || /^(\d)\1+$/.test(n)) return false;
  for (const tamanho of [9, 10]) {
    const soma = [...n.slice(0, tamanho)].reduce((s, d, i) => s + Number(d) * (tamanho + 1 - i), 0);
    const resto = (soma * 10) % 11;
    if ((resto === 10 ? 0 : resto) !== Number(n[tamanho])) return false;
  }
  return true;
}
export function dadosConta(entrada: Record<string, unknown>) {
  const nome = typeof entrada.nome === "string" ? entrada.nome.trim() : "";
  const cpf = typeof entrada.cpf === "string" ? numeros(entrada.cpf) : "";
  const email = typeof entrada.email === "string" ? entrada.email.trim().toLowerCase() : "";
  if (nome.length > 120 || nome.split(/\s+/).length < 2 || /[\x00-\x1f]/.test(nome)) throw new ErroCadastro("Informe seu nome completo.");
  if (!validarCPF(cpf)) throw new ErroCadastro("Informe um CPF válido.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160) throw new ErroCadastro("Informe um e-mail válido.");
  return { nome, cpf, email };
}
export function idadeCadastro(valor: string, hoje = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return null;
  const d = new Date(valor + "T12:00:00Z");
  if (!Number.isFinite(d.getTime()) || d.toISOString().slice(0,10) !== valor || valor > hoje.toISOString().slice(0,10)) return null;
  let idade = hoje.getUTCFullYear() - d.getUTCFullYear();
  if (hoje.getUTCMonth() < d.getUTCMonth() || (hoje.getUTCMonth() === d.getUTCMonth() && hoje.getUTCDate() < d.getUTCDate())) idade--;
  return idade >= 0 && idade <= 130 ? idade : null;
}
export function dadosCadastro(entrada: Record<string, unknown>): DadosCadastro {
  const campo = (nome: string, max: number, opcional = false) => {
    const v = entrada[nome];
    if ((v === undefined || v === "") && opcional) return "";
    if (typeof v !== "string" || !v.trim() || v.length > max || /[\x00-\x1f]/.test(v)) throw new ErroCadastro("Preencha corretamente: " + nome + ".");
    return v.trim();
  };
  const nome = campo("nome",120), cpf = numeros(campo("cpf",18)), telefone = numeros(campo("telefone",20));
  const dataNascimento = campo("dataNascimento",10), numeroSUS = numeros(campo("numeroSUS",25));
  const emailResponsavel = campo("emailResponsavel",160,true);
  const cep = numeros(campo("cep",10)), rua = campo("rua",160), numero = campo("numero",10), bairro = campo("bairro",100);
  const cidade = campo("cidade",50), uf = campo("uf",2);
  if (nome.split(/\s+/).length < 2) throw new ErroCadastro("Informe seu nome completo.");
  if (!validarCPF(cpf)) throw new ErroCadastro("Informe um CPF válido.");
  if (!/^[1-9]{2}[2-9]\d{7,8}$/.test(telefone)) throw new ErroCadastro("Informe um telefone válido com DDD.");
  const idade = idadeCadastro(dataNascimento);
  if (idade === null) throw new ErroCadastro("Informe uma data de nascimento válida.");
  if (!/^\d{15}$/.test(numeroSUS) || /^(\d)\1+$/.test(numeroSUS)) throw new ErroCadastro("Informe os 15 números do Cartão SUS.");
  if (idade < 10 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailResponsavel)) throw new ErroCadastro("Informe o e-mail do responsável pela criança.");
  if (!/^\d{8}$/.test(cep) || !/^[1-9]\d{0,5}$/.test(numero)) throw new ErroCadastro("Informe CEP e número residencial válidos.");
  if (cidade.toLowerCase() !== "blumenau" || uf.toUpperCase() !== "SC") throw new ErroCadastro("O cadastro está disponível apenas para Blumenau–SC.");
  return {nome, cpf, telefone, dataNascimento, numeroSUS, emailResponsavel, cep, rua, numero, bairro, cidade:"Blumenau", uf:"SC"};
}
export function cadastroCompleto(perfil: Record<string, unknown> | undefined) {
  if (!perfil || perfil.cadastroVersao !== 2 || typeof perfil.unidadeReferencia !== "string" || !perfil.unidadeReferencia.trim()) return false;
  try { dadosCadastro(perfil); return true; } catch { return false; }
}
