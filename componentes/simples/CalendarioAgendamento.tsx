"use client";
import { useState } from "react";
import { hojeBrasil } from "@/lib/datas";

const dataExtensa = (iso: string) => new Intl.DateTimeFormat("pt-BR", { dateStyle: "full", timeZone: "UTC" }).format(new Date(iso + "T12:00:00Z"));

export default function CalendarioAgendamento({ dias, valor, onChange }: { dias: string[]; valor: string; onChange: (dia: string) => void }) {
  const meses = [...new Set(dias.map(d => d.slice(0, 7)))];
  const [mes, setMes] = useState(() => valor.slice(0, 7) || meses[0] || hojeBrasil().slice(0, 7));
  const indice = meses.indexOf(mes);
  const [ano, numeroMes] = mes.split("-").map(Number);
  const primeiro = new Date(Date.UTC(ano, numeroMes - 1, 1, 12));
  const total = new Date(Date.UTC(ano, numeroMes, 0, 12)).getUTCDate();
  const disponiveis = new Set(dias);
  const hoje = hojeBrasil();
  const titulo = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }).format(primeiro);
  return <div className="sv-calendario">
    <div className="sv-calendario-cabecalho">
      <button type="button" aria-label="Mês anterior" disabled={indice <= 0} onClick={() => setMes(meses[indice - 1])}>‹</button>
      <p aria-live="polite" className="font-bold capitalize">{titulo}</p>
      <button type="button" aria-label="Próximo mês" disabled={indice < 0 || indice >= meses.length - 1} onClick={() => setMes(meses[indice + 1])}>›</button>
    </div>
    <div className="sv-calendario-semana" aria-hidden="true">{["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(d => <span key={d}>{d}</span>)}</div>
    <div className="sv-calendario-dias" role="group" aria-label={`Dias de ${titulo}`}>
      {Array.from({ length: primeiro.getUTCDay() }, (_, i) => <span key={`vazio-${i}`} aria-hidden="true" />)}
      {Array.from({ length: total }, (_, i) => {
        const dia = `${mes}-${String(i + 1).padStart(2, "0")}`;
        const disponivel = disponiveis.has(dia);
        return <button type="button" key={dia} disabled={!disponivel} aria-pressed={valor === dia} aria-current={dia === hoje ? "date" : undefined} aria-label={`${dataExtensa(dia)}${disponivel ? "" : ", sem agendamento"}`} onClick={() => onChange(dia)}>
          <span>{i + 1}</span>{valor === dia ? <span className="sv-calendario-marca" aria-hidden="true">✓</span> : disponivel && <span className="sv-calendario-ponto" aria-hidden="true" />}
        </button>;
      })}
    </div>
    <p className="sv-calendario-legenda"><span className="sv-calendario-ponto" aria-hidden="true" />Dias destacados permitem consultar horários.</p>
    <p role="status" className="sv-calendario-selecao">{valor ? `Data escolhida: ${dataExtensa(valor)}` : "Toque em um dia destacado para escolher."}</p>
  </div>;
}
