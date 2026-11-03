"use client";
import { useState } from "react";
import { ROTULOS, type Cargo } from "@/lib/profissionais/modelos";
import { api } from "./api";
import { Bloco, CabecalhoPainel, Feedback, Seletor, useDados } from "./ui";
type Funcionario = { id: string; nome: string; cargo: Cargo; registro: string; ativo: boolean; unidadeReferencia: string };
type Diretorio = { unidades: string[]; unidadeSelecionada: string; funcionarios: Funcionario[]; proximaPagina: string | null };
function ListaFuncionarios({ unidade, selecionar }: { unidade: string; selecionar: (unidade: string) => void }) {
  const caminho = "funcionarios?" + new URLSearchParams({ unidade });
  const consulta = useDados<Diretorio>(caminho);
  const [adicionais, setAdicionais] = useState<Funcionario[]>([]);
  const [proxima, setProxima] = useState<string | null | undefined>();
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const cursor = proxima === undefined ? consulta.dados?.proximaPagina : proxima;
  const funcionarios = [...new Map([...(consulta.dados?.funcionarios ?? []), ...adicionais].map(f => [f.id, f])).values()];
  const grupos = [...new Set(funcionarios.map(f => f.unidadeReferencia))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  async function carregarMais() {
    if (!cursor) return;
    setCarregando(true); setErro("");
    try {
      const pagina = await api<Diretorio>(caminho + "&cursor=" + encodeURIComponent(cursor));
      setAdicionais(atuais => [...atuais, ...pagina.funcionarios]); setProxima(pagina.proximaPagina);
    } catch (e) { setErro(e instanceof Error ? e.message : "Não foi possível carregar a próxima página."); }
    finally { setCarregando(false); }
  }
  return <Bloco titulo="Funcionários da saúde" descricao="Escolha uma UBS para consultar os profissionais cadastrados no Saúde Vale+.">
    <div className="mb-6 max-w-md"><Seletor titulo="Qual UBS deseja ver?" value={unidade} onChange={e => selecionar(e.target.value)}>
      <option value="*">Todas as UBS</option>
      {consulta.dados ? consulta.dados.unidades.map(u => <option key={u} value={u}>{u}</option>) : unidade !== "*" && <option value={unidade}>{unidade}</option>}
    </Seletor></div>
    <Feedback erro={consulta.erro || erro} carregando={consulta.carregando} />
    {consulta.dados && !funcionarios.length && <p className="py-5 text-sm text-slate-600">Nenhum funcionário cadastrado na UBS selecionada.</p>}
    <div className="space-y-7">{grupos.map(ubs => <section key={ubs} className="overflow-hidden rounded-xl border border-slate-200">
      <h2 className="bg-sky-50 px-5 py-4 font-bold text-[#005F8F]">{ubs}</h2>
      <div className="overflow-x-auto"><table className="w-full min-w-[530px] text-left text-sm">
        <caption className="sr-only">Funcionários de {ubs}</caption>
        <thead><tr>{["Funcionário", "Função", "Registro profissional", "Situação"].map(t => <th scope="col" key={t} className="border-b border-slate-200 px-5 py-3">{t}</th>)}</tr></thead>
        <tbody>{funcionarios.filter(f => f.unidadeReferencia === ubs).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")).map(f => <tr key={f.id} className="border-b border-slate-100"><td className="px-5 py-4 font-semibold">{f.nome}</td><td className="px-5 py-4">{ROTULOS[f.cargo]}</td><td className="px-5 py-4">{f.registro || "Não se aplica"}</td><td className="px-5 py-4">{f.ativo ? "Ativo" : "Inativo"}</td></tr>)}</tbody>
      </table></div>
    </section>)}</div>
    {cursor && <button className="sv-button sv-button-outline mt-6" disabled={carregando} onClick={carregarMais}>{carregando ? "Carregando…" : "Carregar mais funcionários"}</button>}
  </Bloco>;
}
export default function FuncionariosPorUBS({ unidadeInicial }: { unidadeInicial: string }) {
  const [unidade, setUnidade] = useState(unidadeInicial);
  return <><CabecalhoPainel titulo="Funcionários por UBS" descricao="Consulte os funcionários da saúde organizados por unidade. Para editar a equipe da sua UBS, use a aba Equipe e permissões." /><ListaFuncionarios key={unidade} unidade={unidade} selecionar={setUnidade} /></>;
}
