"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged, type User } from "firebase/auth";
import { collection, doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";

import Header from "../../componentes/Header";
import Navigation from "../../componentes/Navigation";
import Footer from "../../componentes/Footer";
import { auth, db } from "../firebase";
import {
  aplicada,
  avaliarComprovante,
  catalogoPorCodigo,
  CATALOGO_POR_FASE,
  FASES,
  faseDoRegistro,
  fasePorIdade,
  fasesAcessiveis,
  identificarCodigo,
  idadeEmMeses,
  normalizar,
  TITULOS_FASE,
  type FaseVacinal,
  type PerfilVacinal,
  type PeriodoGestacao,
  type RegistroVacinal,
} from "../../lib/vacinacaoRegras";

const ESTILOS: Record<FaseVacinal, { cabecalho: string; claro: string; destaque: string; borda: string }> = {
  Crianca: { cabecalho: "bg-gradient-to-r from-[#007DB8] to-[#22AFC4]", claro: "bg-[#E8F6FC]", destaque: "text-[#005F8F]", borda: "border-[#A9DDED]" },
  Adolescente: { cabecalho: "bg-gradient-to-r from-[#15803D] to-[#22A66A]", claro: "bg-green-50", destaque: "text-green-800", borda: "border-green-200" },
  Adulto: { cabecalho: "bg-gradient-to-r from-[#005F8F] to-[#007DB8]", claro: "bg-blue-50", destaque: "text-[#005F8F]", borda: "border-blue-200" },
  Idoso: { cabecalho: "bg-gradient-to-r from-[#69409A] to-[#9970C6]", claro: "bg-purple-50", destaque: "text-purple-800", borda: "border-purple-200" },
  Gestante: { cabecalho: "bg-gradient-to-r from-[#BE185D] to-[#EA6297]", claro: "bg-pink-50", destaque: "text-pink-800", borda: "border-pink-200" },
};

function formatarData(data: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return data || "—";
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

function colunaDaDose(dose: string): number {
  const normalizada = normalizar(dose);
  if (normalizada.includes("reforco") || normalizada.includes("anual") || normalizada.includes("adicional")) return 3;
  if (normalizada.includes("3")) return 2;
  if (normalizada.includes("2")) return 1;
  return 0;
}

function situacaoRegistro(registro: RegistroVacinal): { texto: string; cor: string } {
  if (aplicada(registro)) return { texto: "Aplicada", cor: "text-green-700" };
  if (registro.dataPrevista && registro.dataPrevista < new Date().toISOString().slice(0, 10)) {
    return { texto: "Data prevista já passou", cor: "text-rose-700" };
  }
  return { texto: "Pendente / sem confirmação", cor: "text-amber-700" };
}

export default function VacinacaoPage() {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<PerfilVacinal>({});
  const [registros, setRegistros] = useState<RegistroVacinal[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [fase, setFase] = useState<FaseVacinal>("Adulto");
  const [periodoGestacao, setPeriodoGestacao] = useState<PeriodoGestacao>("atual");
  const [anoFiltro, setAnoFiltro] = useState("todos");
  const [mostrarGestacao, setMostrarGestacao] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [emitindo, setEmitindo] = useState(false);

  const [gestanteAtual, setGestanteAtual] = useState(false);
  const [jaFoiGestante, setJaFoiGestante] = useState(false);
  const [semanasGestacao, setSemanasGestacao] = useState("");
  const [inicioGestacao, setInicioGestacao] = useState("");


  useEffect(() => {
    let cancelarRegistros: (() => void) | undefined;
    let versao = 0;
    let ativo = true;

    const cancelarAuth = onAuthStateChanged(auth, async (user) => {
      const atual = ++versao;
      cancelarRegistros?.();
      cancelarRegistros = undefined;
      setUsuario(user);
      setRegistros([]);
      setErro("");
      if (!user) {
        setPerfil({});
        setCarregando(false);
        return;
      }

      setCarregando(true);
      try {
        const documento = await getDoc(doc(db, "usuarios", user.uid));
        if (!ativo || atual !== versao) return;

        const dados = documento.data() ?? {};
        const perfilCarregado: PerfilVacinal = {
          nome: String(dados.nome ?? user.displayName ?? ""),
          dataNascimento: String(dados.dataNascimento ?? ""),
          gestanteAtual: dados.gestanteAtual === true,
          jaFoiGestante: dados.jaFoiGestante === true,
          semanasGestacao: Number(dados.semanasGestacao ?? 0),
          inicioGestacao: String(dados.inicioGestacao ?? ""),
        };
        setPerfil(perfilCarregado);
        setGestanteAtual(perfilCarregado.gestanteAtual === true);
        setJaFoiGestante(perfilCarregado.jaFoiGestante === true);
        setSemanasGestacao(perfilCarregado.semanasGestacao ? String(perfilCarregado.semanasGestacao) : "");
        setInicioGestacao(perfilCarregado.inicioGestacao ?? "");

        const faseInicial = fasePorIdade(idadeEmMeses(perfilCarregado.dataNascimento)) ?? "Adulto";
        setFase(faseInicial);

        cancelarRegistros = onSnapshot(
          collection(db, "usuarios", user.uid, "vacinacao"),
          (snapshot) => {
            if (!ativo || atual !== versao) return;
            const lista: RegistroVacinal[] = snapshot.docs.map((item) => {
              const dadosVacina = item.data();
              return {
                id: item.id,
                vacina: String(dadosVacina.vacina ?? dadosVacina.nome ?? ""),
                codigo: String(dadosVacina.codigo ?? ""),
                dose: String(dadosVacina.dose ?? ""),
                dataAplicacao: String(dadosVacina.dataAplicacao ?? dadosVacina.data ?? ""),
                dataPrevista: String(dadosVacina.dataPrevista ?? ""),
                lote: String(dadosVacina.lote ?? ""),
                unidade: String(dadosVacina.unidade ?? ""),
                status: String(dadosVacina.status ?? ""),
                fase: dadosVacina.fase,
                periodoGestacao: dadosVacina.periodoGestacao,
                anoGestacao: String(dadosVacina.anoGestacao ?? ""),
              };
            });
            setRegistros(lista);
            setCarregando(false);
          },
          (firebaseErro) => {
            if (!ativo || atual !== versao) return;
            console.error("Erro de vacinação:", firebaseErro);
            setErro("Não foi possível carregar os registros de vacinação. Confira a conexão e as regras do Firestore.");
            setCarregando(false);
          }
        );
      } catch (firebaseErro) {
        if (!ativo || atual !== versao) return;
        console.error("Erro no perfil vacinal:", firebaseErro);
        setErro("Não foi possível carregar o perfil do paciente.");
        setCarregando(false);
      }
    });

    return () => {
      ativo = false;
      versao += 1;
      cancelarAuth();
      cancelarRegistros?.();
    };
  }, []);

  const idadeMeses = useMemo(() => idadeEmMeses(perfil.dataNascimento), [perfil.dataNascimento]);
  const faseAtual = fasePorIdade(idadeMeses);
  const podeVerGestante = perfil.gestanteAtual === true || perfil.jaFoiGestante === true;
  const fases = fasesAcessiveis(idadeMeses, podeVerGestante);
  const estilo = ESTILOS[fase];
  const avaliacao = useMemo(() => avaliarComprovante(perfil, registros), [perfil, registros]);
  const contextoAtual = faseAtual === fase || (fase === "Gestante" && perfil.gestanteAtual && periodoGestacao === "atual");
  const podeEmitir = !!usuario && !carregando && contextoAtual && avaliacao.apto;

  const anosGestacoesAnteriores = useMemo(() => [...new Set(
    registros.filter((r) => r.fase === "Gestante" && r.periodoGestacao === "anterior")
      .map((r) => r.anoGestacao || "Sem ano informado")
  )].sort().reverse(), [registros]);

  const registrosVisiveis = useMemo(() => registros.filter((registro) => {
    if (fase === "Gestante") {
      if (registro.fase !== "Gestante" || registro.periodoGestacao !== periodoGestacao) return false;
      return periodoGestacao !== "anterior" || anoFiltro === "todos" ||
        (registro.anoGestacao || "Sem ano informado") === anoFiltro;
    }
    return faseDoRegistro(registro, perfil.dataNascimento) === fase;
  }), [registros, fase, periodoGestacao, anoFiltro, perfil.dataNascimento]);

  const linhas = useMemo(() => {
    const codigos = [...CATALOGO_POR_FASE[fase]];
    for (const registro of registrosVisiveis) {
      const codigo = identificarCodigo(registro);
      if (codigo && !codigos.includes(codigo)) codigos.push(codigo);
    }
    return codigos.map((codigo) => ({
      codigo,
      nome: catalogoPorCodigo(codigo)?.nome ?? registrosVisiveis.find((r) => identificarCodigo(r) === codigo)?.vacina ?? codigo,
      registros: registrosVisiveis.filter((r) => identificarCodigo(r) === codigo),
    }));
  }, [fase, registrosVisiveis]);

  function trocarFase(proxima: FaseVacinal) {
    if (!fases.includes(proxima)) return;
    setFase(proxima);
    setAnoFiltro("todos");
    setPeriodoGestacao(proxima === "Gestante" && !perfil.gestanteAtual ? "anterior" : "atual");
    setErro("");
    setAviso("");
  }

  async function salvarHistoricoGestacional() {
    if (!usuario) return;
    if (gestanteAtual && (!inicioGestacao || !semanasGestacao || Number(semanasGestacao) < 1 || Number(semanasGestacao) > 43)) {
      setErro("Se está gestante, informe a data aproximada do início e a semana atual (1 a 43).");
      return;
    }
    setSalvando(true);
    setErro("");
    try {
      const mudancas = {
        gestanteAtual,
        jaFoiGestante,
        semanasGestacao: gestanteAtual ? Number(semanasGestacao) : null,
        inicioGestacao: gestanteAtual ? inicioGestacao : null,
      };
      await setDoc(doc(db, "usuarios", usuario.uid), mudancas, { merge: true });
      setPerfil((anterior) => ({ ...anterior, ...mudancas, semanasGestacao: Number(mudancas.semanasGestacao ?? 0), inicioGestacao: mudancas.inicioGestacao ?? "" }));
      if (!gestanteAtual && !jaFoiGestante && fase === "Gestante") trocarFase(faseAtual ?? "Adulto");
      setAviso("Informações de gestação atualizadas. A opção Gestante respeita esses dados autodeclarados.");
      setMostrarGestacao(false);
    } catch (firebaseErro) {
      console.error("Erro ao atualizar histórico gestacional:", firebaseErro);
      setErro("Não foi possível salvar as informações. Verifique as permissões do perfil no Firestore.");
    } finally {
      setSalvando(false);
    }
  }

  async function baixarComprovante() {
    if (!usuario || !podeEmitir || emitindo) return;
    setEmitindo(true);
    setErro("");
    try {
      const token = await usuario.getIdToken();
      const resposta = await fetch("/api/vacinacao/comprovante", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!resposta.ok) {
        const dados = await resposta.json().catch(() => null);
        throw new Error(dados?.erro ?? `Falha HTTP ${resposta.status} ao gerar o comprovante.`);
      }
      const arquivo = await resposta.blob();
      const url = URL.createObjectURL(arquivo);
      const link = document.createElement("a");
      link.href = url;
      link.download = "comprovante-bom-cidadao-simulacao.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 30000);
      setAviso("Comprovante demonstrativo gerado. O documento não possui validade oficial.");
    } catch (falha) {
      console.error("Falha ao obter PDF:", falha);
      setErro(falha instanceof Error ? falha.message : "Não foi possível gerar o PDF.");
    } finally {
      setEmitindo(false);
    }
  }

  const campo = "mt-1 w-full rounded-xl border border-[#D1D5DB] bg-white px-3 py-2.5 text-sm text-[#111827] outline-none focus:border-[#007DB8] focus:ring-2 focus:ring-[#8ED3F5]/60";

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#111827]">
      <Header />
      <Navigation />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
        <Link href="/dashboard" className="mb-5 inline-block text-sm font-bold text-[#005F8F] hover:underline">← Voltar ao painel</Link>
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#007DB8]">Saúde Vale+ · Prevenção</p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-[#005F8F]">Minha carteira de vacinação</h1>
            <p className="mt-2 text-sm text-[#5C6B7A]">Consulte os registros de vacinação cadastrados pela administração no Firebase. Não é possível adicionar ou alterar doses por esta página.</p>
          </div>
        </div>

        {!usuario && !carregando && <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">Entre na sua conta para ver a carteirinha. <Link className="font-bold underline" href="/login">Entrar</Link></div>}
        {erro && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{erro}</div>}
        {aviso && <div role="status" className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{aviso}</div>}

        {usuario && (
          <>
            <section className="mb-6 rounded-2xl border border-[#D1D5DB] bg-white p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-extrabold text-[#005F8F]">Tipo de carteirinha</h2>
                  <p className="text-xs text-gray-500">A fase atual é escolhida pela data de nascimento. As fases anteriores permanecem acessíveis.</p>
                </div>
                <button type="button" onClick={() => setMostrarGestacao((v) => !v)} className="text-xs font-bold text-[#007DB8] underline">
                  {mostrarGestacao ? "Fechar informações" : "Informações sobre gestação"}
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {FASES.filter((item) => fases.includes(item.codigo)).map((item) => (
                  <button key={item.codigo} type="button" onClick={() => trocarFase(item.codigo)}
                    aria-pressed={fase === item.codigo}
                    className={`rounded-xl border px-4 py-2.5 text-sm font-bold transition ${fase === item.codigo ? "border-[#005F8F] bg-[#005F8F] text-white shadow-sm" : "border-gray-200 bg-white text-[#374151] hover:border-[#007DB8]"}`}>
                    {item.rotulo}
                    {item.codigo === faseAtual ? " · Atual" : ""}
                  </button>
                ))}
              </div>
              {!perfil.dataNascimento && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">Data de nascimento ausente. <Link href="/perfil" className="font-bold underline">Preencha seu perfil</Link> para selecionar automaticamente a fase e avaliar o comprovante.</p>}

              {mostrarGestacao && (
                <div className="mt-5 border-t border-gray-200 pt-4">
                  <h3 className="font-bold text-[#005F8F]">Histórico gestacional (opcional)</h3>
                  <p className="mt-1 text-xs text-gray-500">Informação fornecida por você, usada apenas para habilitar a carteirinha da gestante.</p>
                  <div className="mt-3 flex flex-wrap gap-5 text-sm">
                    <label className="flex items-center gap-2"><input type="checkbox" checked={gestanteAtual} onChange={(e) => setGestanteAtual(e.target.checked)} /> Estou grávida atualmente</label>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={jaFoiGestante} onChange={(e) => setJaFoiGestante(e.target.checked)} /> Já estive grávida</label>
                  </div>
                  {gestanteAtual && (
                    <div className="mt-3 grid max-w-xl gap-3 sm:grid-cols-2">
                      <label className="text-xs font-semibold">Data aproximada do início da gestação<input className={campo} type="date" value={inicioGestacao} onChange={(e) => setInicioGestacao(e.target.value)} /></label>
                      <label className="text-xs font-semibold">Semana gestacional atual<input className={campo} type="number" min={1} max={43} value={semanasGestacao} onChange={(e) => setSemanasGestacao(e.target.value)} /></label>
                    </div>
                  )}
                  <button type="button" disabled={salvando} onClick={salvarHistoricoGestacional} className="mt-4 rounded-lg bg-[#005F8F] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60">Salvar informações</button>
                </div>
              )}
            </section>

            {fase === "Gestante" && (
              <section className="mb-5 rounded-xl border border-pink-200 bg-pink-50 p-4">
                <p className="text-sm font-bold text-pink-900">Registros da gestação</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {perfil.gestanteAtual && <button type="button" onClick={() => setPeriodoGestacao("atual")} className={`rounded-lg px-4 py-2 text-xs font-bold ${periodoGestacao === "atual" ? "bg-pink-700 text-white" : "bg-white text-pink-900"}`}>Gestação atual</button>}
                  {perfil.jaFoiGestante && <button type="button" onClick={() => { setPeriodoGestacao("anterior"); setAnoFiltro("todos"); }} className={`rounded-lg px-4 py-2 text-xs font-bold ${periodoGestacao === "anterior" ? "bg-pink-700 text-white" : "bg-white text-pink-900"}`}>Gestações anteriores</button>}
                </div>
                {periodoGestacao === "anterior" && anosGestacoesAnteriores.length > 0 && (
                  <label className="mt-3 block max-w-xs text-xs font-semibold text-pink-900">
                    Escolha o ano da gestação
                    <select className={campo} value={anoFiltro} onChange={(e) => setAnoFiltro(e.target.value)}>
                      <option value="todos">Todas as gestações anteriores</option>
                      {anosGestacoesAnteriores.map((ano) => <option key={ano} value={ano}>{ano}</option>)}
                    </select>
                  </label>
                )}
              </section>
            )}

            <section className={`overflow-hidden rounded-[24px] border-2 ${estilo.borda} bg-white shadow-sm`}>
              <div className={`${estilo.cabecalho} px-5 py-6 text-white sm:px-8`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.17em] text-white/85">Saúde Vale+ · Carteirinha digital</p>
                    <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">{TITULOS_FASE[fase]}</h2>
                    <p className="mt-2 text-sm text-white/85">Registro individual de doses · demonstração acadêmica</p>
                  </div>
                  <div className="rounded-full bg-white/15 px-4 py-2 text-sm font-bold">{FASES.find((item) => item.codigo === fase)?.rotulo}</div>
                </div>
              </div>
              <div className={`${estilo.claro} grid gap-3 border-b p-5 text-sm sm:grid-cols-3 sm:px-8`}>
                <div><p className="text-xs text-gray-500">Nome</p><p className={`mt-1 font-bold ${estilo.destaque}`}>{perfil.nome || usuario.displayName || "Não informado"}</p></div>
                <div><p className="text-xs text-gray-500">Nascimento</p><p className={`mt-1 font-bold ${estilo.destaque}`}>{formatarData(perfil.dataNascimento ?? "")}</p></div>
                <div><p className="text-xs text-gray-500">Fase da carteirinha</p><p className={`mt-1 font-bold ${estilo.destaque}`}>{FASES.find((item) => item.codigo === fase)?.rotulo}</p></div>
              </div>
              <div className="p-4 sm:p-6">
                {carregando ? <p className="py-12 text-center text-sm text-gray-500">Carregando registros...</p> : (
                  <div className="overflow-x-auto rounded-xl border border-[#C0DAE0]">
                    <table className="w-full min-w-[780px] border-collapse text-left text-xs sm:text-sm">
                      <thead className="bg-[#D9F1F5] text-[#005F8F]">
                        <tr>
                          <th className="border-b border-r border-[#B0D7DF] p-3">Vacina</th>
                          <th className="border-b border-r border-[#B0D7DF] p-3">1ª / única</th>
                          <th className="border-b border-r border-[#B0D7DF] p-3">2ª dose</th>
                          <th className="border-b border-r border-[#B0D7DF] p-3">3ª dose</th>
                          <th className="border-b border-r border-[#B0D7DF] p-3">Reforço / anual</th>
                          <th className="border-b border-[#B0D7DF] p-3">Unidade de saúde</th>
                        </tr>
                      </thead>
                      <tbody>
                        {linhas.map((linha, indice) => (
                          <tr key={linha.codigo} className={indice % 2 ? "bg-[#F2FAFB]" : "bg-white"}>
                            <th className="border-r border-t border-[#C0DAE0] p-3 font-bold text-[#111827]">{linha.nome}</th>
                            {[0, 1, 2, 3].map((coluna) => {
                              const registrosColuna = linha.registros.filter((registro) => colunaDaDose(registro.dose) === coluna);
                              return <td key={coluna} className="border-r border-t border-[#C0DAE0] p-2 align-top">
                                {registrosColuna.length ? registrosColuna.map((registro) => {
                                  const situacao = situacaoRegistro(registro);
                                  return <div key={registro.id} className="my-1 rounded-md bg-white/80 px-2 py-1">
                                    <p className="font-semibold">{formatarData(registro.dataAplicacao || registro.dataPrevista)}</p>
                                    <p className={`mt-1 text-[10px] ${situacao.cor}`}>{situacao.texto}</p>
                                  </div>;
                                }) : <span className="text-gray-400">—</span>}
                              </td>;
                            })}
                            <td className="border-t border-[#C0DAE0] p-3 text-xs text-gray-600">{[...new Set(linha.registros.map((r) => r.unidade).filter(Boolean))].join(", ") || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <p className="mt-4 text-xs leading-5 text-gray-500">Traços representam ausência de registro neste sistema, não necessariamente vacina atrasada. Os registros de vacinação são administrados exclusivamente pela equipe responsável no Firebase; o paciente tem acesso somente à consulta.</p>
                {fase === "Gestante" && <p className="mt-2 text-xs text-pink-700">A visualização de gestações anteriores não modifica a avaliação da fase de vida atual.</p>}
              </div>
            </section>

            <section className="mt-6 rounded-2xl border border-[#D1D5DB] bg-white p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-2xl">
                  <h2 className="text-xl font-extrabold text-[#005F8F]">Comprovante de Bom Cidadão</h2>
                  <p className="mt-1 text-sm text-gray-600">Documento de simulação do TCC, liberado somente quando o checklist demonstrativo da faixa etária atual estiver completo.</p>
                  <p className="mt-2 text-xs font-bold text-amber-800">SIMULAÇÃO ACADÊMICA — SEM VALIDADE OFICIAL</p>
                </div>
                <button type="button" disabled={!podeEmitir || emitindo} onClick={baixarComprovante}
                  className="rounded-xl bg-[#005F8F] px-5 py-3 text-sm font-extrabold text-white hover:bg-[#007DB8] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600">
                  {emitindo ? "Gerando PDF..." : "Baixar comprovante em PDF"}
                </button>
              </div>
              {!contextoAtual && <p className="mt-4 rounded-lg bg-[#F5F7FA] p-3 text-sm text-[#374151]">O comprovante considera a faixa etária atual, não uma carteirinha histórica. Selecione a opção marcada como “Atual” acima.</p>}
              {contextoAtual && !avaliacao.apto && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="font-bold text-amber-900">Emissão indisponível</p>
                <p className="mt-1 text-sm text-amber-800">{avaliacao.motivo}</p>
                {avaliacao.itens.some((item) => !item.completo) && <ul className="mt-3 list-inside list-disc space-y-1 text-xs text-amber-900">
                  {avaliacao.itens.filter((item) => !item.completo).map((item) => <li key={`${item.requisito.codigo}-${item.requisito.periodo}`}>{item.requisito.nome}: {item.registradas} de {item.requisito.doses} registro(s) localizado(s){item.requisito.periodo === "ano" ? " no ano atual" : item.requisito.periodo === "seis-meses" ? " nos últimos seis meses" : item.requisito.periodo === "gestacao" ? " nesta gestação" : ""}</li>)}
                </ul>}
              </div>}
              {contextoAtual && avaliacao.apto && <p className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-semibold text-green-800">Checklist acadêmico completo. O PDF de demonstração está disponível.</p>}
              <p className="mt-4 text-xs leading-5 text-gray-500">O checklist é reduzido e não verifica contraindicações, indicações especiais, intervalos, campanhas nem autenticidade dos registros do banco de dados. Não serve para atestar situação vacinal real. Para comprovação oficial, procure os canais autorizados do SUS.</p>
            </section>
          </>
        )}
        <p className="mt-6 text-xs text-gray-500">Referência técnica: <a href="https://www.gov.br/saude/pt-br/vacinacao/calendario" target="_blank" rel="noreferrer" className="font-semibold text-[#005F8F] underline">Calendário Nacional de Vacinação — Ministério da Saúde</a>. Os quadros deste TCC são ilustrativos.</p>
      </main>
      <Footer />
    </div>
  );
}