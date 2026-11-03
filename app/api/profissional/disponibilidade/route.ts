import { adminDb } from "@/lib/firebaseAdmin";
import { autorizar, ErroAcesso, json, respostaErro } from "@/lib/profissionais/autorizacao";
import { configRef, grade } from "@/lib/profissionais/agendaRegras";
import { dataAgendavel } from "@/lib/profissionais/datas";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const p = await autorizar(request, "agenda.gerenciar"), params = new URL(request.url).searchParams;
    const uid = params.get("profissionalId") ?? "", dia = params.get("dia") ?? "", servico = params.get("servico") ?? "";
    if (!uid || !dataAgendavel(dia)) throw new ErroAcesso("Selecione profissional e dia útil nos próximos 21 dias.", 400);
    const alvo = await adminDb.collection("profissionais").doc(uid).get();
    if (!alvo.exists || !alvo.data()?.ativo || alvo.data()?.unidadeReferencia !== p.unidadeReferencia) throw new ErroAcesso("Profissional indisponível nesta unidade.");
    const nome = String(alvo.data()?.nomeAgenda);
    const [config, reservas] = await Promise.all([configRef(p.unidadeReferencia, nome, dia).get(), adminDb.collection("horariosReservados").where("unidadeReferencia", "==", p.unidadeReferencia).where("medico", "==", nome).where("dia", "==", dia).get()]);
    const ocupados = reservas.docs.filter(d => d.data().status === "reservado").map(d => d.data().horario);
    return json({ horarios: grade(config.data(), nome, servico).map(h => ({ horario: h.horario, estado: h.bloqueado ? "bloqueado" : ocupados.includes(h.horario) ? "ocupado" : "livre" })) });
  } catch (erro) { return respostaErro(erro); }
}
