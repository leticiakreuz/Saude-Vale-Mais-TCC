"use client";
import { useEffect, useState } from "react";
import { EVENTO_ACESSIBILIDADE, lerPreferencias, salvarPreferencias, PREFERENCIAS_PADRAO, type PreferenciasAcessibilidade } from "@/lib/acessibilidade";

export default function ConfiguracoesAcessibilidade() {
  const [preferencias, setPreferencias] = useState<PreferenciasAcessibilidade>(PREFERENCIAS_PADRAO);
  const [mensagem, setMensagem] = useState("");
  useEffect(() => {
    const atualizar = () => setPreferencias(lerPreferencias());
    atualizar();
    window.addEventListener(EVENTO_ACESSIBILIDADE, atualizar);
    window.addEventListener("storage", atualizar);
    return () => {
      window.removeEventListener(EVENTO_ACESSIBILIDADE, atualizar);
      window.removeEventListener("storage", atualizar);
    };
  }, []);
  function alterar(valores: Partial<PreferenciasAcessibilidade>) {
    const atualizadas = { ...lerPreferencias(), ...valores };
    setPreferencias(atualizadas);
    salvarPreferencias(atualizadas);
    setMensagem("Preferências salvas neste navegador.");
  }
  return (
    <section className="mx-auto max-w-3xl">
      <p className="sv-eyebrow">Suas preferências</p>
      <h1 className="mt-3 text-3xl font-extrabold text-[#005F8F]">Configurações</h1>
      <p className="mt-4 leading-7 text-slate-600">Personalize a leitura e a navegação. As mudanças são aplicadas a todas as páginas neste navegador.</p>
      <div className="mt-8 space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
        <fieldset className="rounded-xl border border-slate-200 p-5">
          <legend className="px-2 font-bold text-[#005F8F]">Aparência</legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {([{ valor: "claro", texto: "Fundo claro" }, { valor: "escuro", texto: "Fundo escuro" }] as const).map(opcao => <button key={opcao.valor} type="button" aria-pressed={preferencias.tema === opcao.valor} onClick={() => alterar({ tema: opcao.valor })} className={"min-h-14 rounded-xl border-2 px-5 py-3 font-bold " + (preferencias.tema === opcao.valor ? "border-[#007DB8] bg-sky-50 text-[#005F8F]" : "border-slate-300 text-slate-700")}>{opcao.texto}{preferencias.tema === opcao.valor ? " ✓" : ""}</button>)}
          </div>
        </fieldset>
        <div className="flex flex-wrap items-center justify-between gap-5 rounded-xl border border-slate-200 p-5">
          <div><h2 className="font-bold text-[#005F8F]">Alto contraste</h2><p className="mt-2 text-sm leading-6 text-slate-600">Destaca os campos, as bordas e o foco da navegação.</p></div>
          <button type="button" role="switch" aria-label="Alto contraste" aria-checked={preferencias.altoContraste} onClick={() => alterar({ altoContraste: !preferencias.altoContraste })} className="sv-button sv-button-outline">{preferencias.altoContraste ? "Ativado" : "Desativado"}</button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-5 rounded-xl border border-sky-200 bg-sky-50 p-5">
          <div className="max-w-md"><h2 className="font-bold text-[#005F8F]">Modo Simples</h2><p className="mt-2 text-sm leading-6 text-slate-600">Letras maiores, botões confortáveis e uma navegação mais direta. Disponível para qualquer pessoa.</p></div>
          <button type="button" role="switch" aria-label="Modo Simples" aria-checked={preferencias.modoEssencial} onClick={() => alterar({ modoEssencial: !preferencias.modoEssencial })} className="sv-button">{preferencias.modoEssencial ? "Desativar" : "Ativar"}</button>
        </div>
        <button type="button" onClick={() => alterar(PREFERENCIAS_PADRAO)} className="sv-button sv-button-outline">Restaurar aparência padrão</button>
        <p role="status" className="text-sm text-green-800">{mensagem}</p>
      </div>
    </section>
  );
}
