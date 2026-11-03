"use client";
import { useState } from "react";
import { hojeBrasil, formatarData } from "@/lib/profissionais/datas";
import { Bloco, CabecalhoPainel, Campo, Feedback, Resumo, useDados } from "./ui";
type Atendimento = { id: string; dia: string; horario: string; profissional: string; servico: string; status: string };
const rotulos: Record<string, string> = { agendado: "Agendado", confirmado: "Confirmado", presente: "Em atendimento", concluido: "Realizado", "concluído": "Realizado", finalizado: "Realizado", cancelado: "Cancelado", falta: "Falta" };
export default function HistoricoAdministrativo() {
  const [inicio, setInicio] = useState(hojeBrasil());
  const [fim, setFim] = useState(hojeBrasil());
  const parametros = new URLSearchParams({ inicio, fim }).toString();
  const relatorio = useDados<{ contagens: Record<string, number> }>("relatorios?" + parametros);
  const historico = useDados<{ atendimentos: Atendimento[]; limiteAtingido: boolean }>("historico?" + parametros);
  const contagens = relatorio.dados?.contagens;
  return <>
    <CabecalhoPainel titulo="Histórico de atendimentos" descricao="Consulte os atendimentos e os resultados administrativos da sua UBS por período." />
    <Bloco id="historico" titulo="Consultar período">
      <div className="flex flex-wrap items-end gap-4">
        <Campo titulo="De" type="date" value={inicio} onChange={e => setInicio(e.target.value)} />
        <Campo titulo="Até" type="date" value={fim} onChange={e => setFim(e.target.value)} />
        <button className="sv-button sv-button-outline" onClick={() => { relatorio.recarregar(); historico.recarregar(); }}>Atualizar histórico</button>
      </div>
      <Feedback {...relatorio} />
      {contagens && <div className="mt-6"><Resumo itens={[
        ["Agendadas / confirmadas", (contagens.agendado ?? 0) + (contagens.confirmado ?? 0)],
        ["Realizadas", (contagens.concluido ?? 0) + (contagens["concluído"] ?? 0) + (contagens.finalizado ?? 0)],
        ["Canceladas", contagens.cancelado ?? 0], ["Faltas", contagens.falta ?? 0],
      ]} /><p className="text-sm text-slate-600">Chegadas em atendimento: {contagens.presente ?? 0}.</p></div>}
    </Bloco>
    <Bloco titulo="Atendimentos do período" descricao="Data, profissional, serviço e situação do atendimento na sua unidade.">
      <Feedback {...historico} />
      {historico.dados?.limiteAtingido && <p role="status" className="mb-5 rounded-lg bg-amber-50 p-4 text-sm text-amber-900">Há mais de 200 atendimentos neste período. Reduza o intervalo para consultar todos os registros.</p>}
      {historico.dados && (historico.dados.atendimentos.length ? <div className="overflow-x-auto"><table className="w-full min-w-[580px] text-left text-sm">
        <caption className="sr-only">Histórico administrativo de atendimentos da UBS</caption>
        <thead><tr>{["Data", "Horário", "Profissional", "Atendimento", "Situação"].map(t => <th key={t} scope="col" className="border-b border-slate-200 px-3 py-4">{t}</th>)}</tr></thead>
        <tbody>{historico.dados.atendimentos.map(a => <tr key={a.id} className="border-b border-slate-100"><td className="px-3 py-4">{formatarData(a.dia)}</td><td className="px-3 py-4">{a.horario}</td><td className="px-3 py-4">{a.profissional}</td><td className="px-3 py-4">{a.servico}</td><td className="px-3 py-4"><span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-[#005F8F]">{rotulos[a.status] ?? a.status}</span></td></tr>)}</tbody>
      </table></div> : <p className="py-5 text-sm text-slate-600">Nenhum atendimento encontrado neste período.</p>)}
    </Bloco>
  </>;
}
