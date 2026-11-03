"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "firebase/auth";
import Icone, { type NomeIcone } from "@/componentes/publico/Icone";
import TelaSimples from "./TelaSimples";
import { dataAgendavel, formatarData, hojeBrasil } from "@/lib/profissionais/datas";
type Consulta = { id: string; servico: string; medico: string; dia: string; horario: string; status: string; unidadeReferencia?: string };
type Tela = "inicio" | "consultas" | "historico" | "servico" | "horario" | "confirmar";
const servicos: Record<string, string[]> = { Manhã: ["Consulta médica", "Pediatria", "Odontologia", "Consulta de retorno", "Renovação de receita"], Tarde: ["Odontologia", "Renovação de receita"] };
const profissionais = { geral: ["Dr. Rafael Martins", "Dra. Juliana Costa"], pediatria: ["Dra. Mariana Alves", "Dr. Felipe Rocha"], dentista: ["Dra. Camila Souza", "Dr. Bruno Lima"] };
const horarios: Record<string, string[]> = { Manhã: ["07:30", "08:30", "10:30", "11:30"], Tarde: ["13:30", "14:30", "16:00"] };
const iconesServico: Record<string, NomeIcone> = { "Consulta médica": "estetoscopio", Pediatria: "crianca", Odontologia: "dente", "Consulta de retorno": "retorno", "Renovação de receita": "receita" };
const statusTexto: Record<string, string> = { agendado: "Agendada", confirmado: "Confirmada", presente: "Em atendimento", concluido: "Realizada", "concluído": "Realizada", finalizado: "Realizada", cancelado: "Cancelada", falta: "Falta" };
const encerrado = (status: string) => ["cancelado", "concluido", "concluído", "finalizado", "falta"].includes(status.toLowerCase());
function diasDisponiveis() {
  const hoje = hojeBrasil(), primeiro = new Date(hoje + "T12:00:00Z"), dias = [];
  for (let i = 0; i < 21; i++) { const d = new Date(primeiro); d.setUTCDate(d.getUTCDate() + i); const iso = d.toISOString().slice(0, 10); if (dataAgendavel(iso, hoje)) dias.push(iso); }
  return dias;
}
const botao = "flex min-h-24 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left text-xl font-bold text-[#005F8F] shadow-sm hover:border-[#007DB8]";
export default function AgendamentosSimples({ usuario, consultas, carregando, perfilCompleto, unidade, cancelar, salvando, erroExterno, mensagemExterna }: {
  usuario: User | null; consultas: Consulta[]; carregando: boolean; perfilCompleto: boolean; unidade?: string;
  cancelar: (id: string) => Promise<void>; salvando: boolean; erroExterno?: string; mensagemExterna?: string;
}) {
  const [tela, setTela] = useState<Tela>("inicio");
  const [periodo, setPeriodo] = useState("Manhã"), [servico, setServico] = useState("Consulta médica");
  const [medico, setMedico] = useState(""), [dia, setDia] = useState(""), [hora, setHora] = useState("");
  const [indisponiveis, setIndisponiveis] = useState<string[]>([]);
  const [consultando, setConsultando] = useState(false), [disponibilidadePronta, setDisponibilidadePronta] = useState(false);
  const [erro, setErro] = useState(""), [mensagem, setMensagem] = useState(""), [enviando, setEnviando] = useState(false);
  const medicos = servico === "Pediatria" ? profissionais.pediatria : servico === "Odontologia" ? profissionais.dentista : profissionais.geral;
  useEffect(() => {
    if (tela !== "horario") { setConsultando(false); return; }
    setHora(""); setIndisponiveis([]); setDisponibilidadePronta(false); setErro("");
    if (!usuario || !medico || !dia) { setConsultando(false); return; }
    const controle = new AbortController();
    setConsultando(true);
    (async () => {
      try {
        const token = await usuario.getIdToken();
        const resposta = await fetch("/api/agendamentos/disponibilidade?" + new URLSearchParams({ medico, dia, servico }), { headers: { Authorization: "Bearer " + token }, signal: controle.signal, cache: "no-store" });
        const dados = await resposta.json();
        if (!resposta.ok) throw new Error(dados.erro ?? "Não foi possível consultar os horários.");
        if (!controle.signal.aborted) { setIndisponiveis([...(dados.horariosOcupados ?? []), ...(dados.horariosBloqueados ?? [])]); setDisponibilidadePronta(true); }
      } catch (e) { if (!controle.signal.aborted) setErro(e instanceof Error ? e.message : "Tente novamente."); }
      finally { if (!controle.signal.aborted) setConsultando(false); }
    })();
    return () => controle.abort();
  }, [usuario, medico, dia, servico, tela]);
  function voltar() {
    setErro("");
    setTela(tela === "confirmar" ? "horario" : tela === "horario" ? "servico" : "inicio");
  }
  async function reservar() {
    if (!usuario || enviando || !hora) return;
    setEnviando(true); setErro("");
    try {
      const token = await usuario.getIdToken();
      const resposta = await fetch("/api/agendamentos/reservar", { method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }, body: JSON.stringify({ periodo, servico, medico, dia, horario: hora }) });
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(dados.erro ?? "Não foi possível agendar.");
      setMensagem("Consulta agendada!"); setTela("consultas"); setHora("");
    } catch (e) { setErro(e instanceof Error ? e.message : "Tente novamente."); }
    finally { setEnviando(false); }
  }
  const lista = consultas.filter(c => tela === "historico" ? encerrado(c.status) : !encerrado(c.status)).sort((a, b) => (tela === "historico" ? -1 : 1) * (a.dia + a.horario).localeCompare(b.dia + b.horario));
  return <TelaSimples titulo="Consultas" icone="agenda">
    {tela !== "inicio" && <button type="button" onClick={voltar} className="mb-5 min-h-12 px-2 font-bold text-[#005F8F]">← Voltar</button>}
    {(erro || erroExterno) && <p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-red-800">{erro || erroExterno}</p>}
    {(mensagem || mensagemExterna) && <p role="status" className="mb-5 rounded-xl bg-green-50 p-4 text-green-800">{mensagem || mensagemExterna}</p>}
    {carregando ? <p role="status">Carregando…</p> : tela === "inicio" ? <div className="grid gap-4 sm:grid-cols-2">
      <button className={botao} onClick={() => { setMensagem(""); setTela("servico"); }}><Icone nome="agenda" className="h-12 w-12 shrink-0" />Agendar</button>
      <button className={botao} onClick={() => setTela("consultas")}><Icone nome="cartao" className="h-12 w-12 shrink-0" />Minhas consultas</button>
      <button className={botao} onClick={() => setTela("historico")}><Icone nome="historico" className="h-12 w-12 shrink-0" />Histórico</button>
    </div> : ["consultas", "historico"].includes(tela) ? <div className="space-y-4">
      <h2 className="mb-5 text-2xl font-bold text-[#005F8F]">{tela === "historico" ? "Histórico" : "Minhas consultas"}</h2>
      {!lista.length && <p className="rounded-2xl bg-white p-6">Nenhuma consulta.</p>}
      {lista.map(c => <article key={c.id} className="rounded-2xl border border-slate-200 bg-white p-6"><p className="text-lg font-bold text-[#005F8F]">{c.servico}</p><p className="mt-4 flex items-center gap-3 font-bold"><Icone nome="agenda" />{formatarData(c.dia)} · {c.horario}</p><p className="mt-3 flex items-center gap-3"><Icone nome="pessoa" />{c.medico}</p>{c.unidadeReferencia && <p className="mt-3 text-sm">{c.unidadeReferencia}</p>}<p className="mt-4 font-semibold">{statusTexto[c.status] ?? c.status}</p>{["agendado", "confirmado"].includes(c.status.toLowerCase()) && <button disabled={salvando} onClick={() => cancelar(c.id)} className="mt-5 min-h-12 rounded-xl border border-red-300 px-5 py-3 font-bold text-red-700">Cancelar consulta</button>}</article>)}
    </div> : !perfilCompleto ? <Link href="/perfil?pendencias=1" className={botao}><Icone nome="pessoa" className="h-12 w-12" />Completar perfil →</Link> : <>
      {tela === "servico" && <>
        <div className="mb-5 flex gap-3">{["Manhã", "Tarde"].map(p => <button key={p} type="button" aria-pressed={periodo === p} onClick={() => { setPeriodo(p); setServico(servicos[p][0]); setMedico(""); }} className={"sv-button " + (periodo !== p ? "sv-button-outline" : "")}><span aria-hidden="true">{p === "Manhã" ? "☀️" : "🌇"}</span>{p}</button>)}</div>
        <div className="grid gap-3 sm:grid-cols-2">{servicos[periodo].map(s => <button key={s} className={botao + (servico === s ? " ring-2 ring-[#007DB8]" : "")} aria-pressed={servico === s} onClick={() => { setServico(s); setMedico(""); }}><Icone nome={iconesServico[s]} className="h-10 w-10 shrink-0" />{s}</button>)}</div>
        <button className="sv-button mt-7 w-full" onClick={() => setTela("horario")}>Continuar →</button>
      </>}
      {tela === "horario" && <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
        <label className="grid gap-3 font-bold text-[#005F8F]"><span className="flex items-center gap-3"><Icone nome="pessoa" />Profissional</span><select value={medico} onChange={e => setMedico(e.target.value)} className="min-h-14 rounded-xl border border-slate-300 bg-white px-4 py-3"><option value="">Escolher</option>{medicos.map(m => <option key={m}>{m}</option>)}</select></label>
        <label className="mt-6 grid gap-3 font-bold text-[#005F8F]"><span className="flex items-center gap-3"><Icone nome="agenda" />Dia</span><select value={dia} onChange={e => setDia(e.target.value)} className="min-h-14 rounded-xl border border-slate-300 bg-white px-4 py-3"><option value="">Escolher</option>{diasDisponiveis().map(d => <option key={d} value={d}>{formatarData(d)}</option>)}</select></label>
        {consultando && <p role="status" className="mt-6">Buscando horários…</p>}
        {disponibilidadePronta && <fieldset className="mt-6"><legend className="mb-4 font-bold text-[#005F8F]">Horário</legend><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{horarios[periodo].map(h => <button type="button" key={h} aria-pressed={hora === h} disabled={indisponiveis.includes(h)} onClick={() => setHora(h)} className={"min-h-16 rounded-xl border p-3 text-lg font-bold disabled:opacity-40 " + (hora === h ? "border-[#007DB8] bg-[#007DB8] text-white" : "border-slate-300 text-[#005F8F]")}>{h}<span className="block text-xs">{indisponiveis.includes(h) ? "Indisponível" : hora === h ? "✓ Escolhido" : "Livre"}</span></button>)}</div></fieldset>}
        <button disabled={!hora || !disponibilidadePronta || consultando} className="sv-button mt-7 w-full" onClick={() => setTela("confirmar")}>Continuar →</button>
      </div>}
      {tela === "confirmar" && <div className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-2xl font-bold text-[#005F8F]">Confirmar consulta?</h2><p className="mt-6 text-xl font-bold">{servico}</p><p className="mt-5 flex items-center gap-3"><Icone nome="agenda" />{formatarData(dia)} · {hora}</p><p className="mt-4 flex items-center gap-3"><Icone nome="pessoa" />{medico}</p><p className="mt-4">{unidade}</p><button disabled={enviando || !hora} className="sv-button mt-7 w-full" onClick={reservar}>{enviando ? "Agendando…" : "✓ Confirmar"}</button></div>}
    </>}
  </TelaSimples>;
}
