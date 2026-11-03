import { consultarCEP, resolverEndereco } from "@/lib/cadastro/endereco";
import { ErroCadastro } from "@/lib/cadastro/validacao";
export const runtime = "nodejs";
export async function POST(request:Request) {
  try {
    const entrada = await request.json();
    if (!entrada || typeof entrada !== "object" || JSON.stringify(entrada).length > 1500) throw new ErroCadastro("Endereço inválido.");
    if (typeof entrada.cep !== "string" || entrada.cep.length > 10) throw new ErroCadastro("Informe o CEP.");
    const endereco = entrada.numero ? await resolverEndereco({cep:entrada.cep,rua:typeof entrada.rua === "string" ? entrada.rua.slice(0,160) : "",numero:String(entrada.numero).slice(0,10),bairro:typeof entrada.bairro === "string" ? entrada.bairro.slice(0,100) : ""}) : await consultarCEP(entrada.cep);
    return Response.json(endereco,{headers:{"Cache-Control":"no-store"}});
  } catch(e) { return Response.json({erro:e instanceof ErroCadastro ? e.message : "Não foi possível consultar o endereço."},{status:e instanceof ErroCadastro ? e.status : 400,headers:{"Cache-Control":"no-store"}}); }
}
