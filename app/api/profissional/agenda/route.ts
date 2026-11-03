import { adminDb } from "@/lib/firebaseAdmin";
import { autorizar, ErroAcesso, json, respostaErro } from "@/lib/profissionais/autorizacao";
import { permite, type Consulta } from "@/lib/profissionais/modelos";
import { dataReal, hojeBrasil } from "@/lib/profissionais/datas";
import { configRef, grade } from "@/lib/profissionais/agendaRegras";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const p = await autorizar(request);
    if (!permite(p, "agenda.propria") && !permite(p, "agenda.unidade")) throw new ErroAcesso("Sua função não tem acesso a agendas individuais.");
    const params = new URL(request.url).searchParams, dia = params.get("dia") ?? hojeBrasil();
    if (!dataReal(dia)) throw new ErroAcesso("Data inválida.", 400);
    let nome = p.nomeAgenda;
    const profissionalId = params.get("profissionalId");
    if (p.cargo === "recepcao" && profissionalId) {
      const alvo = await adminDb.collection("profissionais").doc(profissionalId).get();
      if (!alvo.exists || alvo.data()?.unidadeReferencia !== p.unidadeReferencia) throw new ErroAcesso("Profissional fora da unidade.");
      nome = String(alvo.data()?.nomeAgenda);
    }
    const propria = p.cargo !== "recepcao" || Boolean(profissionalId);
    let consulta = adminDb.collectionGroup("agendamentos").where("unidadeReferencia", "==", p.unidadeReferencia).where("dia", "==", dia);
    if (propria) consulta = consulta.where("medico", "==", nome);
    const docs = await consulta.limit(501).get();
    if (docs.size > 500) throw new ErroAcesso("Muitos atendimentos. Filtre por profissional.", 400);
    // Projeta apenas os campos administrativos; nenhum documento completo do paciente sai desta API.
    async function projetar(snapshot: typeof docs): Promise<Consulta[]> {
      const refs = [...new Set(snapshot.docs.map(d => d.ref.parent.parent!.id))].map(uid => adminDb.collection("usuarios").doc(uid));
      const perfis = refs.length ? await adminDb.getAll(...refs) : [];
      const nomes = new Map(perfis.filter(d => d.data()?.unidadeReferencia === p.unidadeReferencia).map(d => [d.id, String(d.data()?.nome ?? "Paciente")]));
      return snapshot.docs.filter(d => nomes.has(d.ref.parent.parent!.id)).map(d => { const v = d.data(); const pacienteId = d.ref.parent.parent!.id; return { id: d.id, pacienteId, pacienteNome: nomes.get(pacienteId)!, servico: String(v.servico), medico: String(v.medico), dia: String(v.dia), horario: String(v.horario), periodo: String(v.periodo), status: String(v.status), unidadeReferencia: p.unidadeReferencia }; }).sort((a, b) => (a.dia + a.horario).localeCompare(b.dia + b.horario));
    }
    const consultas = await projetar(docs);
    let proximas: Consulta[] = [];
    if (propria) {
      const fim = new Date(hojeBrasil() + "T12:00:00Z"); fim.setUTCDate(fim.getUTCDate() + 20);
      const proximasDoc = await adminDb.collectionGroup("agendamentos").where("unidadeReferencia", "==", p.unidadeReferencia).where("medico", "==", nome).where("dia", ">=", hojeBrasil()).where("dia", "<=", fim.toISOString().slice(0, 10)).limit(200).get();
      proximas = (await projetar(proximasDoc)).filter(c => ["agendado", "confirmado"].includes(c.status));
    }
    const configuracao = propria ? await configRef(p.unidadeReferencia, nome, dia).get() : null;
    const ocupados = consultas.filter(c => ["agendado", "confirmado", "presente"].includes(c.status)).map(c => c.horario);
    const horarios = propria ? grade(configuracao?.data(), nome).map(h => ({ horario: h.horario, estado: h.bloqueado ? "bloqueado" : ocupados.includes(h.horario) ? "ocupado" : "livre" })) : [];
    return json({ consultas, horarios, proximas });
  } catch (erro) { return respostaErro(erro); }
}
