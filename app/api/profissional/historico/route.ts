import { createHash } from "node:crypto";
import { adminDb } from "@/lib/firebaseAdmin";
import { autorizar, ErroAcesso, json, respostaErro } from "@/lib/profissionais/autorizacao";
import { dataReal, hojeBrasil } from "@/lib/profissionais/datas";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const administrador = await autorizar(request, "relatorios.ler");
    const parametros = new URL(request.url).searchParams;
    const inicio = parametros.get("inicio") ?? hojeBrasil();
    const fim = parametros.get("fim") ?? inicio;
    if (!dataReal(inicio) || !dataReal(fim) || inicio > fim || (new Date(fim).getTime() - new Date(inicio).getTime()) / 86400000 > 366) throw new ErroAcesso("Escolha um período de até 366 dias.", 400);
    const documentos = await adminDb.collectionGroup("agendamentos")
      .where("unidadeReferencia", "==", administrador.unidadeReferencia)
      .where("dia", ">=", inicio).where("dia", "<=", fim)
      .select("dia", "horario", "medico", "servico", "status").limit(201).get();
    const atendimentos = documentos.docs.slice(0, 200).map(documento => {
      const dados = documento.data();
      return {
        id: createHash("sha256").update(documento.ref.path).digest("hex"),
        dia: String(dados.dia ?? ""), horario: String(dados.horario ?? ""),
        profissional: String(dados.medico ?? ""), servico: String(dados.servico ?? ""),
        status: String(dados.status ?? ""),
      };
    }).sort((a, b) => (b.dia + b.horario).localeCompare(a.dia + a.horario));
    return json({ atendimentos, limiteAtingido: documentos.size > 200, unidadeReferencia: administrador.unidadeReferencia });
  } catch (erro) { return respostaErro(erro); }
}
