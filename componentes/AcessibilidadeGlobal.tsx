"use client";
import { useEffect, useState } from "react";
import { aplicarPreferencias, lerPreferencias, salvarPreferencias, EVENTO_ACESSIBILIDADE } from "@/lib/acessibilidade";
export { lerPreferencias, salvarPreferencias, PREFERENCIAS_PADRAO, type PreferenciasAcessibilidade } from "@/lib/acessibilidade";
export default function AcessibilidadeGlobal() {
  const [segundos, setSegundos] = useState(0);
  useEffect(() => {
    let simplesAnterior = lerPreferencias().modoEssencial;
    aplicarPreferencias(lerPreferencias());
    const atualizar = () => {
      const preferencias = lerPreferencias();
      aplicarPreferencias(preferencias);
      if (!simplesAnterior && preferencias.modoEssencial) setSegundos(3);
      if (!preferencias.modoEssencial) setSegundos(0);
      simplesAnterior = preferencias.modoEssencial;
    };
    window.addEventListener(EVENTO_ACESSIBILIDADE, atualizar);
    window.addEventListener("storage", atualizar);
    return () => {
      window.removeEventListener(EVENTO_ACESSIBILIDADE, atualizar);
      window.removeEventListener("storage", atualizar);
    };
  }, []);
  useEffect(() => {
    if (segundos === 0) return;
    const timer = window.setTimeout(() => setSegundos(s => Math.max(0, s - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [segundos]);
  if (!segundos) return null;
  return <aside aria-label="Modo Simples ativado" className="fixed inset-x-4 bottom-5 z-[100] mx-auto flex max-w-lg flex-wrap items-center justify-center gap-3 rounded-2xl border border-sky-200 bg-white p-4 text-center text-[#005F8F] shadow-xl">
    <p role="status" className="font-bold">Modo Simples ativado.</p>
    <button type="button" onClick={() => salvarPreferencias({ ...lerPreferencias(), modoEssencial: false })} className="min-h-12 rounded-xl bg-[#005F8F] px-4 py-3 font-bold text-white">Voltar para o modo normal <span aria-hidden="true">· {segundos}</span></button>
  </aside>;
}
