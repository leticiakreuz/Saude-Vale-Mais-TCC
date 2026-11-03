import { autorizar, corpo, json, respostaErro } from "@/lib/profissionais/autorizacao";
import { alterarAgendamento } from "@/lib/profissionais/agendamentos";
export const runtime = "nodejs";
export async function POST(request: Request) { try { return json(await alterarAgendamento(await autorizar(request), await corpo(request))); } catch (erro) { return respostaErro(erro); } }
