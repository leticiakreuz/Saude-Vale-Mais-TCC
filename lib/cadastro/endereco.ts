import "server-only";
import { ErroCadastro, numeros } from "./validacao";
import { FONTE_TERRITORIO, normalizarRua, unidadeDoEndereco } from "./territorio";
type CEP = { cep: string; rua: string; bairro: string; cidade: string; uf: string };
export async function consultarCEP(valor: string): Promise<CEP> {
  const cep = numeros(valor);
  if (!/^\d{8}$/.test(cep)) throw new ErroCadastro("Informe um CEP com oito números.");
  let dados;
  try {
    const r = await fetch("https://viacep.com.br/ws/"+cep+"/json/", { next: { revalidate: 86400 }, signal: AbortSignal.timeout(10000) });
    if (!r.ok) throw new Error();
    dados = await r.json();
  } catch { throw new ErroCadastro("A consulta de CEP está indisponível. Tente novamente antes de concluir.",503); }
  if (dados.erro) throw new ErroCadastro("CEP não encontrado.");
  if (dados.localidade !== "Blumenau" || dados.uf !== "SC" || String(dados.ibge) !== "4202404") throw new ErroCadastro("Use um endereço de Blumenau–SC. Outros municípios não são aceitos.");
  return {cep,rua:String(dados.logradouro || ""),bairro:String(dados.bairro || ""),cidade:"Blumenau",uf:"SC"};
}
export async function resolverEndereco(entrada: {cep:string;rua:string;numero:string;bairro:string}) {
  const postal = await consultarCEP(entrada.cep);
  if (postal.rua && normalizarRua(postal.rua) !== normalizarRua(entrada.rua)) throw new ErroCadastro("A rua informada não corresponde ao CEP consultado.");
  const rua = postal.rua || entrada.rua.trim(), bairro = postal.bairro || entrada.bairro.trim();
  if (!bairro || !rua) throw new ErroCadastro("Preencha a rua e o bairro do endereço.");
  const unidadeReferencia = unidadeDoEndereco(rua,entrada.numero);
  return {...postal,rua,bairro,numero:entrada.numero,unidade:unidadeReferencia,unidadeReferencia,fonteTerritorial:FONTE_TERRITORIO};
}
