import tabela from "@/dados/territorio-blumenau.json";
import { ErroCadastro } from "./validacao";
export const FONTE_TERRITORIO = { fonte: tabela.fonte, url: tabela.url, consultadoEm: tabela.consultadoEm, documentoCriadoEm: tabela.documentoCriadoEm, versao: tabela.sha256 };
export function normalizarRua(valor: string) {
  return valor.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase().replace(/[°ºª]/g,"").replace(/[^A-Z0-9]+/g," ").trim().replace(/^(RUA|AVENIDA|RODOVIA|SERVIDAO|TRAVESSA|ALAMEDA)\s+/,"").replace(/^DOUTOR\s+/,"DR ");
}
const linhas = tabela.linhas as [string,string,number,number][];
export function unidadeDoEndereco(rua: string, numero: string) {
  const nome = normalizarRua(rua);
  if (!/^[1-9]\d{0,5}$/.test(numero)) throw new ErroCadastro("Informe o número residencial para identificar a UBS.");
  // Página 34: células com faixas pares/ímpares, revisadas visualmente no PDF.
  if (nome === "FREDERICO JENSEN") {
    const n = Number(numero);
    if (n <= 2120) return "ESF FREDERICO JENSEN";
    if ((n % 2 === 1 && n <= 3033) || (n % 2 === 0 && n <= 2726)) return "ESF HAROLD EWALD";
    if ((n % 2 === 0 && n <= 3360) || (n % 2 === 1 && n <= 3359)) return "ESF ARMANDO ODEBRECHT II";
    if (n <= 4423) return "ESF ARMANDO ODEBRECHT I";
    if (n <= 9999) return "ESF TEREZA LESCOVITZ I";
  }
  if (["FREDERICO JENSEN","PROFESSOR JACOB INEICHEN","BR 470","WALDIR KRUGER"].includes(nome)) throw new ErroCadastro("Este trecho precisa de confirmação territorial na UBS. O cadastro não será vinculado a uma unidade por aproximação.",422);
  const unidades = [...new Set(linhas.filter(([r,,inicio,fim]) => normalizarRua(r) === nome && Number(numero) >= inicio && Number(numero) <= fim).map(([,u]) => u))];
  if (unidades.length !== 1) throw new ErroCadastro("Não foi possível identificar uma única UBS para esta rua e número. Confira o endereço ou confirme o trecho com a unidade.",422);
  return unidades[0];
}
