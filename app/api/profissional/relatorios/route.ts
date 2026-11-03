import { adminDb } from "@/lib/firebaseAdmin";
import { autorizar, ErroAcesso, json, respostaErro } from "@/lib/profissionais/autorizacao";
import { dataReal, hojeBrasil } from "@/lib/profissionais/datas";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const p = await autorizar(request, "relatorios.ler"), params = new URL(request.url).searchParams;
    const inicio = params.get("inicio") ?? hojeBrasil(), fim = params.get("fim") ?? inicio;
    if (!dataReal(inicio) || !dataReal(fim) || inicio > fim || (new Date(fim).getTime() - new Date(inicio).getTime()) / 86400000 > 366) throw new ErroAcesso("Escolha um período de até 366 dias.", 400);
    const base = adminDb.collectionGroup("agendamentos").where("unidadeReferencia", "==", p.unidadeReferencia).where("dia", ">=", inicio).where("dia", "<=", fim);
    const status = ["agendado", "confirmado", "presente", "concluido", "cancelado", "falta", "concluído", "finalizado"];
    const resultados = await Promise.all(status.map(async s => [s, (await base.where("status", "==", s).count().get()).data().count] as const));
    return json({ inicio, fim, contagens: Object.fromEntries(resultados) });
  } catch (erro) { return respostaErro(erro); }
}
