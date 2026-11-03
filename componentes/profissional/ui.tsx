"use client";
import { onAuthStateChanged } from "firebase/auth";
import { useCallback, useEffect, useState, type ReactNode, type InputHTMLAttributes } from "react";
import { auth } from "@/app/firebase";
import { api } from "./api";
import { formatarData } from "@/lib/profissionais/datas";
import type { Consulta } from "@/lib/profissionais/modelos";
export function useDados<T>(caminho: string, habilitado = true) {
  const [dados, setDados] = useState<T>();
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [versao, setVersao] = useState(0);
  const recarregar = useCallback(() => setVersao(v => v + 1), []);
  useEffect(() => {
    if (!habilitado) return;
    let ativo = true;
    let geracao = 0;
    const cancelar = onAuthStateChanged(auth, async user => {
      const atual = ++geracao;
      setDados(undefined); setErro(""); setCarregando(true);
      if (!user) { if (ativo) { setErro("Entre na sua conta para carregar os dados."); setCarregando(false); } return; }
      try { const resultado = await api<T>(caminho); if (ativo && atual === geracao) setDados(resultado); }
      catch (e) { if (ativo && atual === geracao) setErro(e instanceof Error ? e.message : "Não foi possível carregar."); }
      finally { if (ativo && atual === geracao) setCarregando(false); }
    });
    return () => { ativo = false; cancelar(); };
  }, [caminho, versao, habilitado]);
  return { dados, erro, carregando, recarregar };
}
export function Bloco({ id, titulo, descricao, children }: { id?: string; titulo: string; descricao?: string; children: ReactNode }) { return <section id={id} className="mb-7 scroll-mt-5 rounded-2xl border border-slate-200 bg-white p-5 md:p-7"><h2 className="text-xl font-bold text-[#005F8F]">{titulo}</h2>{descricao && <p className="mt-2 text-sm leading-6 text-slate-600">{descricao}</p>}<div className="mt-5">{children}</div></section>; }
export function Feedback({ erro, mensagem, carregando }: { erro?: string; mensagem?: string; carregando?: boolean }) { return <>{carregando && <p role="status" className="my-4 text-slate-600">Carregando dados…</p>}{erro && <p role="alert" className="my-4 rounded-lg bg-red-50 p-4 text-sm text-red-800">{erro}</p>}{mensagem && <p role="status" className="my-4 rounded-lg bg-green-50 p-4 text-sm text-green-800">{mensagem}</p>}</>; }
export const campo = "min-h-12 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900";
export function Campo({ titulo, ...props }: InputHTMLAttributes<HTMLInputElement> & { titulo: string }) { return <label className="grid gap-2 text-sm font-semibold text-slate-700">{titulo}<input className={campo} {...props} /></label>; }
export function Seletor({ titulo, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { titulo: string }) { return <label className="grid gap-2 text-sm font-semibold text-slate-700">{titulo}<select className={campo} {...props}>{children}</select></label>; }
export function CabecalhoPainel({ titulo, descricao }: { titulo: string; descricao: string }) { return <div className="mb-8"><p className="sv-eyebrow">Saúde Vale+ / Equipe</p><h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">{titulo}</h1><p className="mt-3 max-w-3xl leading-7 text-slate-600">{descricao}</p></div>; }
export function Resumo({ itens }: { itens: [string, number | string][] }) { return <div className="mb-7 grid grid-cols-2 gap-4 xl:grid-cols-4">{itens.map(([rotulo, valor]) => <div key={rotulo} className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-600">{rotulo}</p><p className="mt-2 text-3xl font-extrabold text-[#005F8F]">{valor}</p></div>)}</div>; }
export function ListaConsultas({ consultas, acao, ocupado, selecionar, recepcao = false }: { consultas: Consulta[]; acao?: (c: Consulta, acao: string) => void; ocupado?: boolean; selecionar?: (c: Consulta) => void; recepcao?: boolean }) {
  if (!consultas.length) return <p className="py-5 text-sm text-slate-600">Nenhum atendimento encontrado neste período.</p>;
  return <div className="overflow-x-auto"><table className="w-full min-w-[610px] text-left text-sm"><caption className="sr-only">Atendimentos autorizados</caption><thead className="border-b border-slate-200 text-xs uppercase text-slate-500"><tr>{["Data / hora", "Paciente", "Atendimento", "Situação", "Ações"].map(t => <th scope="col" key={t} className="px-3 py-4">{t}</th>)}</tr></thead><tbody>{consultas.map(c => <tr key={c.pacienteId + c.id} className="border-b border-slate-100 align-top"><td className="px-3 py-5 font-semibold">{formatarData(c.dia)}<br /><span className="text-[#005F8F]">{c.horario}</span></td><td className="px-3 py-5">{c.pacienteNome}<span className="mt-1 block text-xs text-slate-500">ID: {c.pacienteId.slice(0, 8)}</span></td><td className="px-3 py-5">{c.servico}<span className="mt-1 block text-xs text-slate-500">{c.medico}</span></td><td className="px-3 py-5"><span className="inline-block rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-[#005F8F]">{c.status}</span></td><td className="px-3 py-4"><div className="flex max-w-64 flex-wrap gap-2">{selecionar && <button className="min-h-10 rounded border border-slate-300 px-3" onClick={() => selecionar(c)}>Selecionar</button>}{acao && ["agendado", "confirmado", "presente"].includes(c.status) && <>{c.status === "agendado" && <button disabled={ocupado} className="sv-acao" onClick={() => acao(c, "confirmar")}>Confirmar</button>}{c.status !== "presente" && <><button disabled={ocupado} className="sv-acao" onClick={() => acao(c, "presente")}>Chegada</button><button disabled={ocupado} className="sv-acao" onClick={() => acao(c, "falta")}>Falta</button></>}{c.status === "presente" && !recepcao && <button disabled={ocupado} className="sv-acao" onClick={() => acao(c, "concluir")}>Concluir</button>}{recepcao && c.status !== "presente" && <button disabled={ocupado} className="sv-acao text-red-700!" onClick={() => acao(c, "cancelar")}>Cancelar</button>}</>}</div></td></tr>)}</tbody></table></div>;
}
export function useAcao(recarregar: () => void) {
  const [ocupado, setOcupado] = useState(false), [erro, setErro] = useState(""), [mensagem, setMensagem] = useState("");
  async function executar(caminho: string, dados: unknown) { setOcupado(true); setErro(""); setMensagem(""); try { await api(caminho, dados); setMensagem("Alteração registrada com sucesso."); recarregar(); return true; } catch (e) { setErro(e instanceof Error ? e.message : "Não foi possível concluir."); return false; } finally { setOcupado(false); } }
  async function atendimento(c: Consulta, acao: string) { if (["cancelar", "falta"].includes(acao) && !window.confirm(acao === "cancelar" ? "Cancelar esta consulta e liberar o horário?" : "Registrar falta neste atendimento?")) return; await executar("agendamentos", { acao, pacienteId: c.pacienteId, agendamentoId: c.id, statusEsperado: c.status }); }
  return { ocupado, erro, mensagem, executar, atendimento };
}
