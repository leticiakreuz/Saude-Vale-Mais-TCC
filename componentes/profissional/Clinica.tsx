"use client";
import { useState } from "react";
import { hojeBrasil } from "@/lib/profissionais/datas";
import { permite, type Consulta, type Profissional } from "@/lib/profissionais/modelos";
import { Bloco, CabecalhoPainel, Campo, Feedback, ListaConsultas, Resumo, useAcao, useDados } from "./ui";
import { Escalas, Receita, Vacinacao } from "./FerramentasClinicas";
interface AgendaDados { consultas: Consulta[]; horarios: { horario: string; estado: string }[]; proximas: Consulta[]; }
export default function Clinica({ profissional: p }: { profissional: Profissional }) {
  const [dia, setDia] = useState(hojeBrasil());
  const [selecionada, setSelecionada] = useState<Consulta>();
  const [historico, setHistorico] = useState(false);
  const agenda = useDados<AgendaDados>("agenda?dia=" + dia);
  const acao = useAcao(agenda.recarregar);
  const consultas = agenda.dados?.consultas ?? [];
  const presentes = consultas.filter(c => c.status === "presente").length;
  const finalizados = consultas.filter(c => c.status === "concluido").length;
  const lista = historico ? consultas.filter(c => ["concluido", "falta", "cancelado"].includes(c.status)) : consultas;
  const selecionar = (c: Consulta) => { setSelecionada(c); document.getElementById(p.cargo === "enfermagem" ? "vacinacao" : "receitas")?.scrollIntoView({ behavior: "smooth" }); };
  const nomes = { medico: ["Meu dia de atendimentos", "Acompanhe sua agenda, confirme os atendimentos e registre presença. Os dados se restringem à sua unidade e à sua própria agenda."], enfermagem: ["Cuidar, acompanhar, vacinar", "Organize os atendimentos de enfermagem e mantenha os registros de vacinação dos pacientes previstos na sua agenda."], odontologia: ["Agenda de saúde bucal", "Visualize os horários odontológicos, acompanhe a chegada dos pacientes e consulte seu histórico administrativo."] };
  const textos = nomes[p.cargo as keyof typeof nomes];
  return <><CabecalhoPainel titulo={textos[0]} descricao={textos[1]} /><Resumo itens={[["Atendimentos na data", consultas.length], ["Pacientes presentes", presentes], ["Concluídos", finalizados], ["Horários livres", agenda.dados?.horarios.filter(h => h.estado === "livre").length ?? "—"]]} /><Feedback erro={acao.erro} mensagem={acao.mensagem} />
    {p.cargo === "odontologia" && <Bloco titulo="Mapa de horários odontológicos" descricao="A disponibilidade respeita as reservas e os bloqueios da unidade."><div className="flex flex-wrap gap-3">{agenda.dados?.horarios.map(h => <div key={h.horario} className={"rounded-xl border px-5 py-3 text-sm " + (h.estado === "livre" ? "border-green-200 bg-green-50 text-green-800" : "border-slate-200 bg-slate-100 text-slate-600")}><strong>{h.horario}</strong><span className="mt-1 block">{h.estado}</span></div>)}</div></Bloco>}
    <div className={p.cargo === "medico" ? "grid items-start gap-7 xl:grid-cols-[minmax(0,2fr)_minmax(230px,1fr)]" : ""}><Bloco id="agenda" titulo={p.cargo === "enfermagem" ? "Atendimentos de enfermagem" : "Agenda do dia"}><div className="mb-5 flex flex-wrap items-end gap-4"><Campo titulo="Data da agenda" type="date" value={dia} onChange={e => { setDia(e.target.value); setSelecionada(undefined); }} /><button className="sv-button sv-button-outline" onClick={agenda.recarregar}>Atualizar</button>{p.cargo === "odontologia" && <button id="historico" className="sv-button sv-button-outline" onClick={() => setHistorico(v => !v)}>{historico ? "Ver todos" : "Ver histórico da data"}</button>}</div><Feedback {...agenda} />{agenda.dados && <ListaConsultas consultas={lista} acao={acao.atendimento} ocupado={acao.ocupado} selecionar={selecionar} />}</Bloco>
    {p.cargo === "medico" && <Bloco titulo="Próximas consultas" descricao="Sua agenda para os próximos 20 dias.">{agenda.dados?.proximas.length ? <ul className="space-y-4">{agenda.dados.proximas.slice(0, 8).map(c => <li key={c.id} className="border-b border-slate-100 pb-4"><p className="text-sm font-bold text-[#005F8F]">{c.dia.split("-").reverse().join("/")} · {c.horario}</p><p className="mt-1 text-sm">{c.pacienteNome}</p><p className="mt-1 text-xs text-slate-500">{c.servico}</p></li>)}</ul> : <p className="text-sm text-slate-600">Nenhuma próxima consulta encontrada.</p>}</Bloco>}</div>
    {p.cargo === "enfermagem" && permite(p, "vacina.ler") && <Vacinacao key={selecionada?.pacienteId + ":" + selecionada?.id} consulta={selecionada} podeEscrever={permite(p, "vacina.escrever")} />}
    <Receita key={selecionada?.pacienteId + ":" + selecionada?.id} profissional={p} consulta={selecionada} aoSalvar={agenda.recarregar} /><Escalas />
  </>;
}
