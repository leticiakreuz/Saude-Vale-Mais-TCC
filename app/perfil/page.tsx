"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import Icone, { type NomeIcone } from "@/componentes/publico/Icone";
import Header from "../../componentes/Header";
import Navigation from "../../componentes/Navigation";
import Footer from "../../componentes/Footer";
import { auth, db } from "../firebase";
import {
  lerPreferencias,
  salvarPreferencias,
  PREFERENCIAS_PADRAO,
  type PreferenciasAcessibilidade,
} from "../../componentes/AcessibilidadeGlobal";

type Perfil = {
  uid?: string;
  nome?: string;
  email?: string;
  cpf?: string;
  telefone?: string;
  dataNascimento?: string;
  numeroSUS?: string;
  cartaoSus?: string;
  dataEmissaoSUS?: string;
  emailResponsavel?: string;
  cep?: string;
  rua?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  unidade?: string;
  unidadeReferencia?: string;
  acessibilidade?: string[];
};

type Secao = "inicio" | "pessoais" | "endereco" | "sus" | "acessibilidade" | "reclamacoes";
type Manifestacao = {
  id: string;
  tipo: string;
  assunto: string;
  status: string;
  data: string;
};

const obrigatorios: (keyof Perfil)[] = [
  "nome", "cpf", "telefone", "dataNascimento", "numeroSUS", "cep", "rua", "numero", "bairro", "cidade",
];
const somenteNumeros = (valor: string) => valor.replace(/\D/g, "");
const tituloPorSecao: Record<Exclude<Secao, "inicio">, string> = {
  pessoais: "Dados pessoais",
  endereco: "Endereço e unidade de saúde",
  sus: "Cartão Nacional de Saúde",
  acessibilidade: "Preferências de acessibilidade",
  reclamacoes: "Ouvidoria — reclamações e sugestões",
};

function normalizarPerfil(p: Perfil): Perfil {
  return {
    ...p,
    numeroSUS: p.numeroSUS ?? p.cartaoSus ?? "",
    cartaoSus: p.cartaoSus ?? p.numeroSUS ?? "",
    unidade: p.unidade ?? p.unidadeReferencia ?? "",
    unidadeReferencia: p.unidadeReferencia ?? p.unidade ?? "",
  };
}

function idadeAtual(data?: string): number | null {
  if (!data || !/^\d{4}-\d{2}-\d{2}$/.test(data)) return null;
  const nascimento = new Date(`${data}T12:00:00`);
  if (Number.isNaN(nascimento.getTime())) return null;
  const hoje = new Date();
  let anos = hoje.getFullYear() - nascimento.getFullYear();
  if (hoje.getMonth() < nascimento.getMonth() ||
    (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() < nascimento.getDate())) anos--;
  return anos >= 0 ? anos : null;
}

function formatarTelefone(valor: string): string {
  const n = somenteNumeros(valor).slice(0, 11);
  if (n.length <= 2) return n;
  if (n.length <= 6) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
  if (n.length <= 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
}

function formatarData(data?: string): string {
  if (!data) return "Não informada";
  const partes = data.split("-");
  return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : data;
}

const estiloInput = "mt-2 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none focus:border-[#007DB8] focus:ring-2 focus:ring-[#8ED3F5]";
const estiloLabel = "block text-sm font-semibold text-slate-800";
const estiloBotao = "inline-flex min-h-12 items-center justify-center rounded-xl bg-[#005F8F] px-6 py-3 text-base font-bold text-white transition hover:bg-[#004B70] focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#007DB8] disabled:opacity-60";

const itensMenu: { secao: Exclude<Secao, "inicio">; icone: NomeIcone; titulo: string; resumo: string }[] = [
  { secao: "pessoais", icone: "pessoa", titulo: "Dados pessoais", resumo: "Informações e contato" },
  { secao: "endereco", icone: "casa", titulo: "Endereço", resumo: "Localização e UBS" },
  { secao: "sus", icone: "cartao", titulo: "Cartão SUS", resumo: "Número do CNS" },
  { secao: "acessibilidade", icone: "configuracoes", titulo: "Acessibilidade", resumo: "Contraste, tema e Modo Simples" },
  { secao: "reclamacoes", icone: "mensagem", titulo: "Ouvidoria", resumo: "Reclamações, sugestões e elogios" },
];

function ConteudoPerfil() {
  const router = useRouter();
  const params = useSearchParams();
  const [secao, setSecao] = useState<Secao>("inicio");
  useEffect(() => { if (params.get("secao") === "acessibilidade") setSecao("acessibilidade"); }, [params]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [consultandoCep, setConsultandoCep] = useState(false);
  const [perfil, setPerfil] = useState<Perfil>({});
  const [email, setEmail] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [preferencias, setPreferencias] = useState<PreferenciasAcessibilidade>(PREFERENCIAS_PADRAO);
  const [tipo, setTipo] = useState("Reclamação");
  const [assunto, setAssunto] = useState("");
  const [descricao, setDescricao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [manifestacoes, setManifestacoes] = useState<Manifestacao[]>([]);
  const [historicoIndisponivel, setHistoricoIndisponivel] = useState(false);

  const idade = idadeAtual(perfil.dataNascimento);
  const perfilCompleto = obrigatorios.every(c => String(perfil[c] ?? "").trim() !== "") &&
    !(idade !== null && idade < 10 && !perfil.emailResponsavel?.trim());

  useEffect(() => {
    setPreferencias(lerPreferencias());
    let ativo = true;
    const cancelar = onAuthStateChanged(auth, async (usuario) => {
      if (!usuario) { router.replace("/login"); return; }
      if (!ativo) return;
      setEmail(usuario.email ?? "");
      try {
        const perfilSnap = await getDoc(doc(db, "usuarios", usuario.uid));
        if (!ativo) return;
        const dados = perfilSnap.exists() ? perfilSnap.data() as Perfil : {};
        setPerfil(normalizarPerfil({
          ...dados,
          uid: usuario.uid,
          nome: dados.nome ?? usuario.displayName ?? "",
          email: usuario.email ?? dados.email ?? "",
        }));
        try {
          const lista = await getDocs(collection(db, "usuarios", usuario.uid, "reclamacoes"));
          if (ativo) {
            const itens = lista.docs.map((documento) => {
              const d = documento.data();
              const data = d.criadaEm instanceof Timestamp
                ? d.criadaEm.toDate().toLocaleDateString("pt-BR") : "Data indisponível";
              return {
                id: documento.id,
                tipo: String(d.tipo ?? "Manifestação"),
                assunto: String(d.assunto ?? "Sem assunto"),
                status: String(d.status ?? "Recebida"),
                data,
              };
            });
            setManifestacoes(itens.reverse());
          }
        } catch {
          if (ativo) setHistoricoIndisponivel(true);
        }
      } catch (e) {
        console.error("Erro ao carregar perfil:", e);
        if (ativo) setErro("Não foi possível carregar os dados do perfil. Tente novamente.");
      } finally {
        if (ativo) setCarregando(false);
      }
    });
    return () => { ativo = false; cancelar(); };
  }, [router]);

  function trocarSecao(nova: Secao) {
    setSecao(nova);
    setErro("");
    setMensagem("");
  }

  function atualizar(campo: keyof Perfil, valor: string) {
    setPerfil((anterior) => ({ ...anterior, [campo]: valor }));
    setMensagem("");
    setErro("");
  }

  function alterarPreferencias(alteracoes: Partial<PreferenciasAcessibilidade>) {
    const novo = { ...preferencias, ...alteracoes };
    setPreferencias(novo);
    salvarPreferencias(novo);
  }

  async function consultarCep() {
    const cep = somenteNumeros(perfil.cep ?? "");
    if (!cep) return;
    if (cep.length !== 8) { setErro("O CEP deve conter oito números."); return; }
    setConsultandoCep(true); setErro(""); setMensagem("");
    try {
      const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      if (!resposta.ok) throw new Error("Não foi possível consultar o CEP.");
      const dados = await resposta.json();
      if (dados.erro) throw new Error("CEP não encontrado.");
      if (String(dados.localidade ?? "").trim().toLowerCase() !== "blumenau" ||
        String(dados.uf ?? "").trim().toUpperCase() !== "SC") {
        setErro("Para este cadastro, informe um CEP de Blumenau–SC.");
        setPerfil((p) => ({ ...p, rua: "", bairro: "", cidade: "", uf: "" }));
        return;
      }
      setPerfil((p) => ({
        ...p, cep,
        rua: dados.logradouro || p.rua || "",
        bairro: dados.bairro || p.bairro || "",
        cidade: dados.localidade,
        uf: dados.uf,
      }));
      setMensagem("Endereço localizado. Confira os dados e informe o número.");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível consultar o CEP.");
    } finally { setConsultandoCep(false); }
  }

  async function salvarPerfil(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault(); setErro(""); setMensagem("");
    const usuario = auth.currentUser;
    if (!usuario) { router.replace("/login"); return; }
    const dados = normalizarPerfil(perfil);
    const cpf = somenteNumeros(dados.cpf ?? "");
    const telefone = somenteNumeros(dados.telefone ?? "");
    const cns = somenteNumeros(dados.numeroSUS ?? "");
    const cep = somenteNumeros(dados.cep ?? "");

    if (secao === "pessoais") {
      if (!dados.nome?.trim() || !dados.dataNascimento?.trim() || !cpf || !telefone) {
        setErro("Preencha nome, CPF, data de nascimento e telefone."); return;
      }
      if (cpf.length !== 11) { setErro("O CPF deve conter 11 números."); return; }
      if (![10, 11].includes(telefone.length)) { setErro("Informe um telefone com DDD."); return; }
      if (idade !== null && idade < 10) {
        const responsavel = (dados.emailResponsavel ?? "").trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(responsavel)) { setErro("Informe um e-mail válido do responsável."); return; }
        if (responsavel.toLowerCase() === (usuario.email ?? email).toLowerCase()) { setErro("O e-mail do responsável deve ser diferente do e-mail da criança."); return; }
      }
    }
    if (secao === "sus" && cns.length !== 15) { setErro("O CNS deve conter 15 números."); return; }
    if (secao === "endereco") {
      if (![dados.rua, dados.numero, dados.bairro, dados.cidade].every(valor => !!valor?.trim())) {
        setErro("Preencha rua, número, bairro e cidade."); return;
      }
      if (cep.length !== 8) { setErro("Informe um CEP válido."); return; }
      if (dados.cidade?.trim().toLowerCase() !== "blumenau" || dados.uf?.trim().toUpperCase() !== "SC") {
        setErro("Consulte um CEP de Blumenau–SC antes de salvar."); return;
      }
    }

    try {
      setSalvando(true);
      await setDoc(doc(db, "usuarios", usuario.uid), {
        ...dados,
        uid: usuario.uid,
        email: usuario.email ?? email,
        ...(dados.cpf !== undefined ? { cpf } : {}),
        ...(dados.telefone !== undefined ? { telefone } : {}),
        ...(cns ? { numeroSUS: cns, cartaoSus: cns } : {}),
        ...(cep ? { cep } : {}),
        unidade: dados.unidade ?? dados.unidadeReferencia ?? "",
        unidadeReferencia: dados.unidadeReferencia ?? dados.unidade ?? "",
        perfilAtualizadoEm: serverTimestamp(),
      }, { merge: true });
      setPerfil((p) => normalizarPerfil({
        ...p, ...dados,
        ...(cpf ? { cpf } : {}),
        ...(telefone ? { telefone: formatarTelefone(telefone) } : {}),
        ...(cns ? { numeroSUS: cns, cartaoSus: cns } : {}),
        ...(cep ? { cep } : {}),
      }));
      setMensagem("Dados atualizados com sucesso.");
    } catch (e) {
      console.error(e);
      setErro("Não foi possível salvar os dados. Confira sua conexão e as regras do Firestore.");
    } finally { setSalvando(false); }
  }

  async function enviarManifestacao(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault(); setErro(""); setMensagem("");
    const usuario = auth.currentUser;
    if (!usuario) { router.replace("/login"); return; }
    if (!assunto.trim() || descricao.trim().length < 20) {
      setErro("Informe o assunto e descreva sua manifestação com pelo menos 20 caracteres."); return;
    }
    setEnviando(true);
    try {
      const documento = await addDoc(collection(db, "usuarios", usuario.uid, "reclamacoes"), {
        tipo, assunto: assunto.trim(), descricao: descricao.trim(),
        status: "Recebida", criadaEm: serverTimestamp(), uid: usuario.uid,
      });
      setManifestacoes((lista) => [{
        id: documento.id, tipo, assunto: assunto.trim(), status: "Recebida",
        data: new Date().toLocaleDateString("pt-BR"),
      }, ...lista]);
      setAssunto(""); setDescricao("");
      setMensagem("Manifestação enviada e registrada no sistema.");
    } catch (e) {
      console.error(e);
      setErro("Não foi possível registrar. Confira as regras da coleção usuarios/{UID}/reclamacoes.");
    } finally { setEnviando(false); }
  }

  function salvarBotao() {
    return <button className={estiloBotao} type="submit" disabled={salvando || consultandoCep}>{salvando ? "Salvando..." : "Salvar alterações"}</button>;
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#111827]">
      <Header />
      <Navigation />
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <div className="mb-6 flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#007DB8]">Área do cidadão</p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-[#005F8F] sm:text-4xl">Meu perfil</h1>
          </div>
          <button type="button" onClick={() => router.push("/dashboard")}
            className="min-h-12 self-start rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-[#005F8F]">
            ← Voltar ao painel
          </button>
        </div>

        {params.get("pendencias") === "1" && (
          <div role="alert" className="mb-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            Complete as informações obrigatórias do perfil antes de realizar agendamentos.
          </div>
        )}
        {erro && <p role="alert" className="mb-5 rounded-xl border border-red-300 bg-red-50 p-4 text-sm font-semibold text-red-900">{erro}</p>}
        {mensagem && <p role="status" className="mb-5 rounded-xl border border-green-300 bg-green-50 p-4 text-sm font-semibold text-green-900">{mensagem}</p>}

        {carregando ? (
          <div className="rounded-2xl bg-white p-8 text-slate-700">Carregando dados do perfil...</div>
        ) : (
          <>
            <section className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:p-7">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#E7F4FB] text-2xl font-bold text-[#005F8F]" aria-hidden="true">
                {(perfil.nome || "C").trim().split(/\s+/).slice(0, 2).map(p => p.charAt(0)).join("").toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="break-words text-xl font-extrabold text-[#111827] sm:text-2xl">{perfil.nome?.trim() || "Cidadão"}</h2>
                <p className="mt-1 break-all text-sm text-slate-600">{email || "E-mail não informado"}</p>
              </div>
              <span className={`w-fit rounded-xl border px-4 py-2 text-sm font-bold ${perfilCompleto ? "border-green-200 bg-green-50 text-green-800" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
                {perfilCompleto ? "Cadastro completo" : "Cadastro incompleto"}
              </span>
            </section>

            {secao === "inicio" ? (
              <section aria-label="Opções do perfil" className="grid gap-3 sm:grid-cols-2">
                {itensMenu.map((item) => (
                  <button
                    key={item.secao}
                    type="button"
                    onClick={() => trocarSecao(item.secao)}
                    className="flex min-h-24 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-[#007DB8] hover:shadow-md focus-visible:outline-4 focus-visible:outline-[#8ED3F5] sm:p-5"
                  >
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#E7F4FB] text-xl font-bold text-[#005F8F]" aria-hidden="true"><Icone nome={item.icone} className="h-9 w-9" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-lg font-bold text-[#005F8F]">{item.titulo}</span>
                      <span className="sv-descricao-opcional mt-1 block text-sm text-slate-600">{item.resumo}</span>
                    </span>
                    <span aria-hidden="true" className="text-2xl text-[#005F8F]">›</span>
                  </button>
                ))}
              </section>
            ) : (
              <>
                <button type="button" onClick={() => trocarSecao("inicio")}
                  className="mb-5 min-h-12 rounded-xl px-2 text-base font-bold text-[#005F8F] hover:underline">
                  ← Voltar às opções
                </button>
                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-8">
                  <h2 className="text-xl font-extrabold text-[#005F8F] sm:text-2xl">{tituloPorSecao[secao]}</h2>
                  {secao === "pessoais" && (
                    <form className="mt-6 space-y-5" onSubmit={salvarPerfil}>
                      <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                          <label htmlFor="nome" className={estiloLabel}>Nome completo *</label>
                          <input id="nome" className={estiloInput} value={perfil.nome ?? ""} onChange={e => atualizar("nome", e.target.value)} required autoComplete="name" />
                        </div>
                        <div>
                          <label htmlFor="email" className={estiloLabel}>E-mail</label>
                          <input id="email" className={estiloInput} value={email} readOnly />
                        </div>
                        <div>
                          <label htmlFor="cpf" className={estiloLabel}>CPF (somente leitura)</label>
                          <input id="cpf" className={estiloInput} value={perfil.cpf ?? ""} readOnly />
                        </div>
                        <div>
                          <label htmlFor="nascimento" className={estiloLabel}>Data de nascimento (somente leitura)</label>
                          <input id="nascimento" className={estiloInput} value={formatarData(perfil.dataNascimento)} readOnly />
                        </div>
                        <div>
                          <label htmlFor="telefone" className={estiloLabel}>Telefone *</label>
                          <input id="telefone" type="tel" className={estiloInput} value={perfil.telefone ?? ""} onChange={e => atualizar("telefone", formatarTelefone(e.target.value))} required autoComplete="tel" placeholder="(47) 99999-9999" />
                        </div>
                        {idade !== null && idade < 10 && (
                          <div>
                            <label htmlFor="responsavel" className={estiloLabel}>E-mail do responsável *</label>
                            <input id="responsavel" type="email" className={estiloInput} value={perfil.emailResponsavel ?? ""} onChange={e => atualizar("emailResponsavel", e.target.value)} required />
                            <p className="mt-2 text-sm text-slate-600">Deve ser diferente do e-mail da criança.</p>
                          </div>
                        )}
                      </div>
                      {idade !== null && idade >= 10 && idade < 12 && (
                        <p className="rounded-xl bg-sky-50 p-4 text-sm text-sky-900">A desvinculação automática de responsáveis aos 12 anos depende de configuração segura no servidor.</p>
                      )}
                      {salvarBotao()}
                    </form>
                  )}
                  {secao === "endereco" && (
                    <form className="mt-6 space-y-5" onSubmit={salvarPerfil}>
                      <p className="text-sm text-slate-600 sv-descricao-opcional">Informe um CEP de Blumenau–SC para consultar os dados disponíveis na ViaCEP.</p>
                      <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                          <label htmlFor="cep" className={estiloLabel}>CEP *</label>
                          <input id="cep" className={estiloInput} value={perfil.cep ?? ""} onChange={e => atualizar("cep", somenteNumeros(e.target.value).slice(0, 8))} onBlur={consultarCep} required inputMode="numeric" placeholder="89000000" />
                          {consultandoCep && <p role="status" className="mt-2 text-sm">Consultando CEP...</p>}
                        </div>
                        <div>
                          <label htmlFor="numero" className={estiloLabel}>Número *</label>
                          <input id="numero" className={estiloInput} value={perfil.numero ?? ""} onChange={e => atualizar("numero", e.target.value)} required />
                        </div>
                        {([["rua", "Rua ou avenida"], ["bairro", "Bairro"]] as const).map(([chave, titulo]) => (
                          <div key={chave}>
                            <label htmlFor={chave} className={estiloLabel}>{titulo} *</label>
                            <input id={chave} className={estiloInput} value={perfil[chave] ?? ""} onChange={e => atualizar(chave, e.target.value)} required />
                          </div>
                        ))}
                        <div>
                          <label htmlFor="cidade" className={estiloLabel}>Cidade</label>
                          <input id="cidade" className={estiloInput} value={perfil.cidade ?? ""} readOnly />
                        </div>
                        <div>
                          <label htmlFor="uf" className={estiloLabel}>Estado</label>
                          <input id="uf" className={estiloInput} value={perfil.uf ?? ""} readOnly />
                        </div>
                        <div className="sm:col-span-2">
                          <label htmlFor="ubs" className={estiloLabel}>Unidade de saúde de referência</label>
                          <input id="ubs" className={estiloInput} value={perfil.unidadeReferencia ?? perfil.unidade ?? ""} readOnly placeholder="Não identificada" />
                          <p className="mt-2 text-sm text-slate-600">O CEP sozinho não determina a UBS responsável.</p>
                        </div>
                      </div>
                      {salvarBotao()}
                    </form>
                  )}
                  {secao === "sus" && (
                    <form className="mt-6 space-y-6" onSubmit={salvarPerfil}>
                      <div className="relative mx-auto aspect-[1000/638] w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-emerald-800 bg-cover bg-center shadow-lg" style={{ backgroundImage: "url('/imagens/cartao-sus.png')" }} role="img" aria-label="Representação visual do Cartão Nacional de Saúde">
                        <div className="absolute left-[8%] top-[47%] max-w-[58%] text-[clamp(10px,1.5vw,18px)] font-semibold text-white drop-shadow-md">
                          <div className="mb-[6%] truncate">{perfil.nome?.trim() || "Nome do cidadão"}</div>
                          <div className="mb-[4%]">Nº CNS: {perfil.numeroSUS || perfil.cartaoSus || "Não informado"}</div>
                          <div>Emissão: {perfil.dataEmissaoSUS || "Não informada"}</div>
                        </div>
                      </div>
                      <div>
                        <label htmlFor="cns" className={estiloLabel}>Número do Cartão SUS (CNS) *</label>
                        <input id="cns" className={estiloInput} value={perfil.numeroSUS ?? perfil.cartaoSus ?? ""} onChange={e => atualizar("numeroSUS", somenteNumeros(e.target.value).slice(0, 15))} required inputMode="numeric" placeholder="15 números" />
                        <p className="mt-2 text-sm text-slate-600">A imagem é ilustrativa e não substitui o cartão oficial.</p>
                      </div>
                      {salvarBotao()}
                    </form>
                  )}
                  {secao === "acessibilidade" && (
                    <div className="mt-6 space-y-6">
                      <p className="text-sm leading-6 text-slate-600 sv-descricao-opcional">Personalize a leitura e a navegação. As alterações acontecem imediatamente e ficam salvas neste navegador.</p>
                      <fieldset className="rounded-2xl border border-slate-200 p-4 sm:p-5">
                        <legend className="px-2 text-lg font-extrabold text-[#005F8F]">Fundo do aplicativo</legend>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          {([{ valor: "claro", rotulo: "Fundo branco" }, { valor: "escuro", rotulo: "Fundo preto" }] as const).map(opcao => (
                            <button key={opcao.valor} type="button" aria-pressed={preferencias.tema === opcao.valor}
                              onClick={() => alterarPreferencias({ tema: opcao.valor })}
                              className={`flex min-h-20 items-center gap-4 rounded-xl border-2 p-4 text-left ${preferencias.tema === opcao.valor ? "border-[#007DB8] ring-2 ring-[#8ED3F5]" : "border-slate-300"}`}>
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-300" style={{ backgroundColor: opcao.valor === "claro" ? "#fff" : "#0b0b0b", color: opcao.valor === "claro" ? "#000" : "#fff" }} aria-hidden="true">Aa</span>
                              <span className="text-base font-bold">{opcao.rotulo} {preferencias.tema === opcao.valor ? "✓" : ""}</span>
                            </button>
                          ))}
                        </div>
                      </fieldset>
                      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                        <div>
                          <h3 className="text-lg font-extrabold text-[#005F8F]">Alto contraste</h3>
                          <p className="mt-1 text-sm text-slate-600 sv-descricao-opcional">Destaca campos, bordas e o foco dos botões.</p>
                        </div>
                        <button type="button" role="switch" aria-checked={preferencias.altoContraste}
                          onClick={() => alterarPreferencias({ altoContraste: !preferencias.altoContraste })}
                          className={`min-h-12 min-w-36 rounded-xl px-5 py-3 font-bold ${preferencias.altoContraste ? "bg-[#005F8F] text-white" : "border-2 border-slate-300 bg-white text-slate-800"}`}>
                          {preferencias.altoContraste ? "Ativado" : "Desativado"}
                        </button>
                      </div>
                      <div className="rounded-2xl border-2 border-[#8ED3F5] bg-[#EEF8FD] p-4 sm:p-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h3 className="text-lg font-extrabold text-[#005F8F]">Modo Simples</h3>
                            <p className="mt-1 text-sm leading-6 text-slate-700 sv-descricao-opcional">Letras maiores, botões de fácil toque, menos descrições e atalhos diretos para os principais serviços. Disponível para qualquer idade.</p>
                          </div>
                          <button type="button" role="switch" aria-checked={preferencias.modoEssencial}
                            onClick={() => alterarPreferencias({ modoEssencial: !preferencias.modoEssencial })}
                            className={`min-h-12 min-w-36 rounded-xl px-5 py-3 font-bold ${preferencias.modoEssencial ? "bg-[#005F8F] text-white" : "border-2 border-[#005F8F] bg-white text-[#005F8F]"}`}>
                            {preferencias.modoEssencial ? "Ativado" : "Ativar"}
                          </button>
                        </div>
                        <p className="mt-4 text-sm font-semibold text-[#005F8F]">Atalhos: Início · Consultas · Remédios · Vacinas · Perfil</p>
                      </div>
                      <button type="button" className="min-h-12 rounded-xl border-2 border-slate-300 bg-white px-5 py-3 font-bold text-[#005F8F]"
                        onClick={() => alterarPreferencias(PREFERENCIAS_PADRAO)}>
                        Restaurar aparência padrão
                      </button>
                    </div>
                  )}
                  {secao === "reclamacoes" && (
                    <div className="mt-6 space-y-7">
                      <p className="text-sm leading-6 text-slate-600">Use este espaço para registrar reclamações, sugestões ou elogios sobre a plataforma. O registro não é encaminhado automaticamente à Ouvidoria do SUS.</p>
                      <form className="space-y-5" onSubmit={enviarManifestacao}>
                        <div>
                          <label htmlFor="tipo" className={estiloLabel}>Tipo de manifestação</label>
                          <select id="tipo" className={estiloInput} value={tipo} onChange={e => setTipo(e.target.value)}>
                            <option>Reclamação</option><option>Sugestão</option><option>Elogio</option>
                          </select>
                        </div>
                        <div>
                          <label htmlFor="assunto" className={estiloLabel}>Assunto *</label>
                          <input id="assunto" className={estiloInput} value={assunto} onChange={e => setAssunto(e.target.value)} required maxLength={100} placeholder="Ex.: Melhoria na navegação" />
                        </div>
                        <div>
                          <label htmlFor="descricao" className={estiloLabel}>Mensagem *</label>
                          <textarea id="descricao" className={`${estiloInput} min-h-40 resize-y`} value={descricao} onChange={e => setDescricao(e.target.value)} required minLength={20} maxLength={2000} placeholder="Descreva sua experiência ou sugestão (mínimo de 20 caracteres)." />
                          <p className="mt-2 text-xs text-slate-600">{descricao.length}/2000 caracteres. Evite incluir dados de saúde sensíveis.</p>
                        </div>
                        <button type="submit" disabled={enviando} className={estiloBotao}>{enviando ? "Enviando..." : "Enviar manifestação"}</button>
                      </form>
                      <section aria-label="Minhas manifestações" className="border-t border-slate-200 pt-6">
                        <h3 className="text-lg font-extrabold text-[#005F8F]">Minhas manifestações</h3>
                        {historicoIndisponivel && <p className="mt-3 text-sm text-amber-800">Não foi possível carregar o histórico. Confira as permissões do Firestore.</p>}
                        {!historicoIndisponivel && manifestacoes.length === 0 && <p className="mt-3 text-sm text-slate-600">Nenhuma manifestação registrada nesta conta.</p>}
                        <div className="mt-4 space-y-3">
                          {manifestacoes.map(item => (
                            <div key={item.id} className="flex flex-col gap-2 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-[#005F8F]">{item.tipo}</p>
                                <p className="mt-1 break-words font-semibold">{item.assunto}</p>
                                <p className="mt-1 text-xs text-slate-600">{item.data}</p>
                              </div>
                              <span className="w-fit rounded-full bg-sky-50 px-3 py-1 text-sm font-semibold text-[#005F8F]">{item.status}</span>
                            </div>
                          ))}
                        </div>
                        <p className="mt-4 text-xs text-slate-600">A situação é a registrada no Firebase. O envio não garante análise ou resposta por uma equipe.</p>
                      </section>
                    </div>
                  )}
                </section>
              </>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default function PerfilPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F5F7FA] p-8">Carregando perfil...</div>}>
      <ConteudoPerfil />
    </Suspense>
  );
}
