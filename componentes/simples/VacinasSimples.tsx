"use client";
import Link from "next/link";
import Icone from "@/componentes/publico/Icone";
import TelaSimples from "./TelaSimples";
import { aplicada, type RegistroVacinal } from "@/lib/vacinacaoRegras";
export default function VacinasSimples({ registros, carregando, erro, aviso, autenticado, podeEmitir, emitindo, baixar, abrirCompleta }: {
  registros: RegistroVacinal[]; carregando: boolean; erro: string; aviso: string; autenticado: boolean;
  podeEmitir: boolean; emitindo: boolean; baixar: () => Promise<void>; abrirCompleta: () => void;
}) {
  const temPendencias = registros.some(registro => !aplicada(registro));
  const situacao = !registros.length ? "Sem registros para verificar." : temPendencias ? "Há vacinas pendentes ou sem confirmação." : "Nenhuma pendência registrada.";
  const corSituacao = !registros.length ? "border-slate-200 bg-white text-slate-700" : temPendencias ? "border-amber-200 bg-amber-50 text-amber-900" : "border-green-200 bg-green-50 text-green-900";
  return <TelaSimples titulo="Vacinas" icone="vacina">
    {erro && <p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-red-800">{erro}</p>}
    {aviso && <p role="status" className="mb-5 rounded-xl bg-green-50 p-4 text-green-800">{aviso}</p>}
    {carregando ? <p role="status">Carregando…</p> : !autenticado ? <Link href="/login" className="sv-button">Entrar na minha conta</Link> : <>
      <div className="mb-6 flex flex-wrap gap-3">
        <button type="button" onClick={abrirCompleta} className="sv-button sv-button-outline"><Icone nome="cartao" />Carteira completa</button>
        <button type="button" disabled={!podeEmitir || emitindo} onClick={baixar} className="sv-button"><Icone nome="escudo" />{emitindo ? "Gerando…" : "Comprovante demonstrativo"}</button>
      </div>
      {!podeEmitir && <p className="mb-5 text-sm text-slate-600">Veja os requisitos do comprovante em “Carteira completa”.</p>}
      {!erro && <div role="status" className={"flex items-center gap-4 rounded-2xl border p-6 " + corSituacao}>
        <Icone nome="vacina" className="h-10 w-10 shrink-0" />
        <p className="text-lg font-bold">{situacao}</p>
      </div>}
    </>}
  </TelaSimples>;
}
