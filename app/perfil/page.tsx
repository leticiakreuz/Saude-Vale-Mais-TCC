"use client";

import { Suspense, useEffect, useState } from "react";
import type { FormEvent, InputHTMLAttributes } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { addDoc, collection, doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import Header from "../../componentes/Header";
import Navigation from "../../componentes/Navigation";
import Footer from "../../componentes/Footer";
import { auth, db } from "../firebase";

type Perfil = {
  uid?: string; nome?: string; email?: string; cpf?: string; telefone?: string;
  dataNascimento?: string; numeroSUS?: string; cartaoSus?: string; dataEmissaoSUS?: string; emailResponsavel?: string; cep?: string;
  rua?: string; numero?: string; bairro?: string; cidade?: string; uf?: string;
  unidade?: string; unidadeReferencia?: string; acessibilidade?: string[];
};
type Secao = "inicio" | "pessoais" | "endereco" | "sus" | "acessibilidade" | "reclamacoes";

const OBRIGATORIOS: (keyof Perfil)[] = ["nome", "cpf", "telefone", "dataNascimento", "numeroSUS", "cep", "rua", "numero", "bairro", "cidade"];
const rotulos: Partial<Record<keyof Perfil, string>> = {
  nome: "nome completo", cpf: "CPF", telefone: "telefone", dataNascimento: "data de nascimento",
  numeroSUS: "Cartão SUS", cep: "CEP", rua: "rua ou avenida", numero: "número do endereço", bairro: "bairro", cidade: "cidade",
};
const somenteNumeros = (v: string) => v.replace(/\D/g, "");
const normalizar = (p: Perfil): Perfil => ({ ...p, numeroSUS: p.numeroSUS ?? p.cartaoSus ?? "", cartaoSus: p.cartaoSus ?? p.numeroSUS ?? "", unidade: p.unidade ?? p.unidadeReferencia ?? "", unidadeReferencia: p.unidadeReferencia ?? p.unidade ?? "" });
function calcularIdade(dataNascimento?: string) {
  if (!dataNascimento) return null;
  const nascimento = new Date(`${dataNascimento}T12:00:00`);
  if (Number.isNaN(nascimento.getTime())) return null;
  const hoje = new Date();
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const aindaNaoFezAniversario = hoje.getMonth() < nascimento.getMonth() || (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() < nascimento.getDate());
  if (aindaNaoFezAniversario) idade -= 1;
  return idade >= 0 ? idade : null;
}

function formatarTelefone(v: string) {
  const n = somenteNumeros(v).slice(0, 11);
  if (n.length <= 2) return n;
  if (n.length <= 6) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
  return n.length <= 10 ? `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}` : `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
}

function ConteudoPerfil() {
  const router = useRouter();
  const search = useSearchParams();
  const mostrarPendencias = search.get("pendencias") === "1";
  const [secao, setSecao] = useState<Secao>("inicio");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [consultandoCep, setConsultandoCep] = useState(false);
  const [perfil, setPerfil] = useState<Perfil>({});
  const [email, setEmail] = useState("");
  const idade = calcularIdade(perfil.dataNascimento);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [tipoManifestacao, setTipoManifestacao] = useState("Reclamação");
  const [assunto, setAssunto] = useState("");
  const [descricao, setDescricao] = useState("");
  const [enviandoManifestacao, setEnviandoManifestacao] = useState(false);
  const [manifestacoes, setManifestacoes] = useState(0);

  useEffect(() => {
    const cancelar = onAuthStateChanged(auth, async (usuario) => {
      if (!usuario) { router.replace("/login"); return; }
      setEmail(usuario.email ?? "");
      try {
        const ref = doc(db, "usuarios", usuario.uid);
        const snap = await getDoc(ref);
        const dados = snap.exists() ? snap.data() as Perfil : {};
        setPerfil(normalizar({ ...dados, uid: usuario.uid, email: usuario.email ?? dados.email ?? "", nome: dados.nome ?? usuario.displayName ?? "" }));
        // A contagem é consultada de forma segura; caso as regras ainda não permitam, o perfil continua funcionando.
        try {
          const lista = await import("firebase/firestore");
          const registros = await lista.getDocs(collection(db, "usuarios", usuario.uid, "reclamacoes"));
          setManifestacoes(registros.size);
        } catch { setManifestacoes(0); }
      } catch (e) {
        console.error("Erro ao carregar perfil:", e);
        setErro("Não foi possível carregar seus dados. Tente novamente.");
      } finally { setCarregando(false); }
    });
    return () => cancelar();
  }, [router]);

  const atualizar = (campo: keyof Perfil, valor: string | string[]) => {
    setPerfil((p) => ({ ...p, [campo]: valor })); setMensagem(""); setErro("");
  };
  const consultarCep = async () => {
    const cep = somenteNumeros(perfil.cep ?? "");
    if (!cep) return;
    if (cep.length !== 8) { setErro("O CEP deve conter oito números."); return; }
    setConsultandoCep(true); setErro(""); setMensagem("");
    try {
      const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      if (!resposta.ok) throw new Error("Falha na consulta do CEP.");
      const dados = await resposta.json();
      if (dados.erro) throw new Error("CEP não encontrado.");
      if (String(dados.localidade ?? "").trim().toLowerCase() !== "blumenau" || String(dados.uf ?? "").trim().toUpperCase() !== "SC") {
        setErro("Para este cadastro, informe um CEP de Blumenau–SC.");
        setPerfil((p) => ({ ...p, rua: "", bairro: "", cidade: "", uf: "" })); return;
      }
      setPerfil((p) => ({ ...p, cep, rua: dados.logradouro || p.rua || "", bairro: dados.bairro || p.bairro || "", cidade: dados.localidade, uf: dados.uf }));
      setMensagem("CEP localizado em Blumenau–SC. Confira o endereço e complete o número.");
    } catch (e) { setErro(e instanceof Error ? e.message : "Não foi possível consultar o CEP."); }
    finally { setConsultandoCep(false); }
  };

  const salvarPerfil = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setMensagem(""); setErro("");
    const usuario = auth.currentUser;
    if (!usuario) { router.replace("/login"); return; }
    const dados = normalizar(perfil);
    const cpf = somenteNumeros(dados.cpf ?? "");
    const telefone = somenteNumeros(dados.telefone ?? "");
    const sus = somenteNumeros(dados.numeroSUS ?? "");
    const cep = somenteNumeros(dados.cep ?? "");
    if (secao === "pessoais") {
      if (!dados.nome?.trim() || !dados.dataNascimento?.trim() || !dados.cpf?.trim() || !dados.telefone?.trim()) { setErro("Preencha nome, CPF, data de nascimento e telefone."); return; }
      if (idade !== null && idade < 10 && !dados.emailResponsavel?.trim()) { setErro("Para crianças menores de 10 anos, informe o e-mail de um responsável."); return; }
      if (idade !== null && idade < 10 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.emailResponsavel ?? "")) { setErro("Informe um e-mail válido do responsável."); return; }
      if (idade !== null && idade < 10 && (dados.emailResponsavel ?? "").trim().toLowerCase() === (usuario.email ?? email).trim().toLowerCase()) { setErro("O e-mail do pai, mãe ou responsável deve ser diferente do e-mail da criança."); return; }
      if (cpf.length !== 11) { setErro("O CPF deve conter 11 números."); return; }
      if (![10, 11].includes(telefone.length)) { setErro("Informe um telefone com DDD e número válido."); return; }
    }
    if (secao === "sus" && sus.length !== 15) { setErro("O Cartão SUS deve conter 15 números."); return; }
    if (secao === "endereco") {
      const faltam = OBRIGATORIOS.filter((c) => ["cep", "rua", "numero", "bairro", "cidade"].includes(c) && !String(dados[c] ?? "").trim()).map((c) => rotulos[c] ?? String(c));
      if (faltam.length) { setErro(`Preencha os campos: ${faltam.join(", ")}.`); return; }
      if (cep.length !== 8) { setErro("Informe um CEP válido com oito números."); return; }
      if (dados.cidade?.trim().toLowerCase() !== "blumenau" || dados.uf?.trim().toUpperCase() !== "SC") { setErro("Consulte um CEP válido de Blumenau–SC antes de salvar."); return; }
    }
    try {
      setSalvando(true);
      await setDoc(doc(db, "usuarios", usuario.uid), {
        ...dados, uid: usuario.uid, email: usuario.email ?? email,
        ...(dados.cpf !== undefined ? { cpf } : {}), ...(dados.telefone !== undefined ? { telefone } : {}),
        ...(sus ? { numeroSUS: sus, cartaoSus: sus } : {}),
        ...(cep ? { cep } : {}), unidade: dados.unidade ?? dados.unidadeReferencia ?? "",
        unidadeReferencia: dados.unidadeReferencia ?? dados.unidade ?? "", perfilAtualizadoEm: serverTimestamp(),
      }, { merge: true });
      setPerfil((p) => normalizar({ ...p, ...dados, ...(cpf ? { cpf } : {}), ...(telefone ? { telefone: formatarTelefone(telefone) } : {}), ...(sus ? { numeroSUS: sus, cartaoSus: sus } : {}), ...(cep ? { cep } : {}) }));
      setMensagem("Seus dados foram salvos com sucesso.");
    } catch (e) { console.error(e); setErro("Não foi possível salvar seus dados. Verifique sua conexão e as regras do Firestore."); }
    finally { setSalvando(false); }
  };

  const enviarManifestacao = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setErro(""); setMensagem("");
    const usuario = auth.currentUser;
    if (!usuario) { router.replace("/login"); return; }
    if (!assunto.trim() || descricao.trim().length < 10) { setErro("Informe o assunto e descreva sua manifestação com pelo menos 10 caracteres."); return; }
    try {
      setEnviandoManifestacao(true);
      await addDoc(collection(db, "usuarios", usuario.uid, "reclamacoes"), { tipo: tipoManifestacao, assunto: assunto.trim(), descricao: descricao.trim(), status: "Recebida", criadaEm: serverTimestamp(), uid: usuario.uid });
      setManifestacoes((n) => n + 1); setAssunto(""); setDescricao(""); setMensagem("Sua manifestação foi registrada.");
    } catch (e) { console.error(e); setErro("Não foi possível registrar. Verifique as regras do Firestore para usuarios/{UID}/reclamacoes."); }
    finally { setEnviandoManifestacao(false); }
  };

  const perfilCompleto = OBRIGATORIOS.every((c) => String(perfil[c] ?? "").trim()) && !(idade !== null && idade < 10 && !String(perfil.emailResponsavel ?? "").trim());
  const campo = "w-full rounded-xl border border-[#D1D5DB] bg-white px-4 py-3 text-sm text-[#111827] outline-none focus:border-[#007DB8] focus:ring-2 focus:ring-[#8ED3F5]/50";
  const label = "mb-2 block text-sm font-bold text-[#111827]";
  const voltar = () => { setSecao("inicio"); setErro(""); setMensagem(""); };
  const campoTexto = (id: keyof Perfil, titulo: string, props: Record<string, unknown> = {}) => (
    <div key={String(id)}>
      <label className={label} htmlFor={String(id)}>{titulo}</label>
      <input id={String(id)} className={campo} value={String(perfil[id] ?? "")} onChange={(e) => atualizar(id, e.target.value)} {...props as InputHTMLAttributes<HTMLInputElement>} />
    </div>
  );
  const Cartao = ({ icon, titulo, descricao, cor, onClick, tag }: { icon: string; titulo: string; descricao: string; cor: string; onClick: () => void; tag?: string }) => (
    <button type="button" onClick={onClick} className="group flex w-full items-center gap-5 rounded-2xl border border-[#DCECF8] bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#8ED3F5] hover:shadow-md sm:p-7">
      <span className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-3xl ${cor}`} aria-hidden="true">{icon}</span>
      <span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-3 text-lg font-extrabold text-[#005F8F]">{titulo}{tag && <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">{tag}</span>}</span><span className="mt-1 block text-sm leading-6 text-slate-500">{descricao}</span></span>
      <span className="text-3xl text-slate-400 transition group-hover:translate-x-1 group-hover:text-[#007DB8]" aria-hidden="true">›</span>
    </button>
  );
  const tituloSecao: Record<Exclude<Secao, "inicio">, string> = { pessoais: "Dados pessoais", endereco: "Endereço", sus: "Cartão SUS", acessibilidade: "Acessibilidade", reclamacoes: "Reclamações e sugestões" };

  return <div className="min-h-screen bg-[#F5F9FC]"><Header /><Navigation />
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <section className={`relative mb-8 flex flex-wrap items-center gap-5 overflow-hidden rounded-2xl bg-gradient-to-r p-6 sm:p-8 ${perfilCompleto ? "from-[#E1F3FC] to-[#DDF8F0]" : "from-[#FDE8E8] to-[#FCE7F3]"}`}>
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-[#007DB8] text-5xl text-white">👤</div>
        <div className="min-w-0 flex-1"><h1 className="text-2xl font-extrabold text-[#003B70] sm:text-3xl">Olá{perfil.nome?.trim() ? `, ${perfil.nome.trim().split(/\s+/)[0]}` : "!"}</h1><p className="mt-2 text-sm text-slate-600 sm:text-base">Aqui você encontra e gerencia suas informações pessoais.</p></div>
        <div className={`rounded-xl border px-4 py-3 text-sm font-bold ${perfilCompleto ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}`}>{perfilCompleto ? "✓ Perfil completo" : "Perfil incompleto"}</div>
      </section>
      {mostrarPendencias && <div role="alert" className="mb-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"><strong>Complete seu perfil:</strong> preencha os dados obrigatórios antes de realizar um agendamento.</div>}
      {erro && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{erro}</div>}
      {mensagem && <div role="status" className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{mensagem}</div>}
      {carregando ? <div className="rounded-2xl bg-white p-8 text-slate-600">Carregando seus dados...</div> : secao === "inicio" ? <>
        <div className="mb-6"><h2 className="text-2xl font-extrabold text-[#003B70]">Meu perfil</h2><p className="mt-2 text-slate-500">Selecione a opção que deseja visualizar ou editar.</p></div>
        <div className="space-y-4">
          <Cartao icon="👤" titulo="Dados pessoais" descricao="Confira e atualize nome, data de nascimento, telefone, e-mail e CPF." cor="bg-sky-100 text-[#007DB8]" onClick={() => setSecao("pessoais")} />
          <Cartao icon="🏠" titulo="Endereço" descricao="Veja e atualize seu endereço, CEP e unidade de saúde de referência." cor="bg-emerald-100 text-emerald-600" onClick={() => setSecao("endereco")} />
          <Cartao icon="💳" titulo="Cartão SUS" descricao="Confira o número do seu Cartão Nacional de Saúde e mantenha seus dados atualizados." cor="bg-sky-100 text-[#007DB8]" onClick={() => setSecao("sus")} />
          <Cartao icon="♿" titulo="Acessibilidade" descricao="Informe suas necessidades para um atendimento mais inclusivo." cor="bg-violet-100 text-violet-600" tag="Novo" onClick={() => setSecao("acessibilidade")} />
          <Cartao icon="💬" titulo="Reclamações e sugestões" descricao="Envie uma reclamação, sugestão ou elogio e acompanhe suas manifestações." cor="bg-rose-100 text-rose-500" onClick={() => setSecao("reclamacoes")} />
        </div>
      </> : <>
        <button type="button" onClick={voltar} className="mb-5 inline-flex items-center gap-2 font-bold text-[#007DB8] hover:text-[#005F8F]">← Voltar ao meu perfil</button>
        <section className="rounded-2xl border border-[#DCECF8] bg-white p-5 shadow-sm sm:p-8"><h2 className="text-2xl font-extrabold text-[#003B70]">{tituloSecao[secao]}</h2>
          {secao === "pessoais" && <form className="mt-6 space-y-5" onSubmit={salvarPerfil}><div className="grid gap-5 sm:grid-cols-2">{campoTexto("nome", "Nome completo *", { required: true, autoComplete: "name" })}<div><label className={label} htmlFor="email">E-mail</label><input id="email" className={`${campo} bg-slate-50`} value={email} readOnly /></div><div><label className={label} htmlFor="cpf">CPF (não editável)</label><input id="cpf" className={`${campo} cursor-not-allowed bg-slate-100`} value={perfil.cpf ?? ""} readOnly aria-readonly="true" /></div><div><label className={label} htmlFor="dataNascimento">Data de nascimento (não editável)</label><input id="dataNascimento" className={`${campo} cursor-not-allowed bg-slate-100`} value={perfil.dataNascimento ?? ""} readOnly aria-readonly="true" /></div><div><label className={label} htmlFor="telefone">Telefone *</label><input id="telefone" className={campo} value={perfil.telefone ?? ""} onChange={(e) => atualizar("telefone", formatarTelefone(e.target.value))} required type="tel" autoComplete="tel" placeholder="(47) 99999-9999" /></div>{idade !== null && idade < 10 && <div className="sm:col-span-2"><label className={label} htmlFor="emailResponsavel">E-mail do pai, mãe ou responsável *</label><input id="emailResponsavel" type="email" className={campo} value={perfil.emailResponsavel ?? ""} onChange={(e) => atualizar("emailResponsavel", e.target.value)} required placeholder="responsavel@exemplo.com" autoComplete="email" aria-describedby="emailResponsavel-ajuda" /><p id="emailResponsavel-ajuda" className="mt-2 text-xs leading-5 text-slate-500">O e-mail do responsável deve ser diferente do e-mail da criança. Para crianças menores de 10 anos, informe um contato responsável. O envio automático de notificações por e-mail exige configuração de um serviço seguro no servidor.</p></div>}{idade !== null && idade >= 10 && idade < 12 && <p className="sm:col-span-2 rounded-xl bg-sky-50 p-3 text-sm text-sky-800">O contato do responsável pode continuar sendo utilizado durante esta etapa. A desvinculação automática aos 12 anos precisa ser configurada no servidor para ocorrer com segurança.</p>}</div><Salvar salvando={salvando} /></form>}
          {secao === "endereco" && <form className="mt-6 space-y-5" onSubmit={salvarPerfil}><p className="text-sm text-slate-500">Informe um CEP de Blumenau–SC. Os dados disponíveis serão preenchidos pela ViaCEP.</p><div className="grid gap-5 sm:grid-cols-2"><div><label className={label} htmlFor="cep">CEP *</label><input id="cep" className={campo} value={perfil.cep ?? ""} onChange={(e) => atualizar("cep", somenteNumeros(e.target.value).slice(0, 8))} onBlur={consultarCep} required inputMode="numeric" placeholder="89000000" />{consultandoCep && <p className="mt-2 text-xs text-[#007DB8]">Consultando CEP...</p>}</div>{campoTexto("numero", "Número *", { required: true })}{campoTexto("rua", "Rua ou avenida *", { required: true, autoComplete: "address-line1" })}{campoTexto("bairro", "Bairro *", { required: true })}<div><label className={label} htmlFor="cidade">Cidade *</label><input id="cidade" className={`${campo} bg-slate-50`} value={perfil.cidade ?? ""} readOnly required /></div><div><label className={label} htmlFor="uf">Estado</label><input id="uf" className={`${campo} bg-slate-50`} value={perfil.uf ?? ""} readOnly /></div><div className="sm:col-span-2"><label className={label} htmlFor="unidade">Unidade de saúde de referência</label><input id="unidade" className={`${campo} bg-slate-50`} value={perfil.unidade ?? perfil.unidadeReferencia ?? ""} readOnly placeholder="Será identificada conforme dados territoriais oficiais" /><p className="mt-2 text-xs text-slate-500">A consulta de CEP não determina sozinha a UBS responsável.</p></div></div><Salvar salvando={salvando || consultandoCep} /></form>}
          {secao === "sus" && <form className="mt-6 space-y-6" onSubmit={salvarPerfil}><p className="text-sm text-slate-500">Confira os dados do seu Cartão Nacional de Saúde. O cartão abaixo utiliza a imagem salva em <code>public/imagens/cartao-sus.png</code>.</p><div className="relative mx-auto aspect-[1000/638] w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-emerald-800 bg-cover bg-center shadow-lg" style={{ backgroundImage: "url('/imagens/cartao-sus.png')" }} role="img" aria-label="Cartão Nacional de Saúde com dados do cidadão"><div className="absolute left-[8%] top-[47%] max-w-[58%] text-[clamp(10px,1.5vw,18px)] font-medium text-white drop-shadow-md"><div className="mb-[6%] truncate">{perfil.nome?.trim() || "Nome do Usuário"}</div><div className="mb-[4%]">Nº do CNS: {perfil.numeroSUS || perfil.cartaoSus ? (perfil.numeroSUS ?? perfil.cartaoSus) : "Não informado"}</div><div>Data de emissão: {perfil.dataEmissaoSUS || "Não informada"}</div></div></div><div className="max-w-xl"><label className={label} htmlFor="numeroSUS">Número do Cartão SUS (CNS) *</label><input id="numeroSUS" className={campo} value={perfil.numeroSUS ?? perfil.cartaoSus ?? ""} onChange={(e) => atualizar("numeroSUS", somenteNumeros(e.target.value).slice(0, 15))} required inputMode="numeric" placeholder="15 números" /><p className="mt-2 text-xs text-slate-500">Digite o número conforme consta no seu cartão oficial. A imagem exibida no site é apenas uma representação visual.</p></div><Salvar salvando={salvando} /></form>}
          {secao === "acessibilidade" && <form className="mt-6 space-y-5" onSubmit={salvarPerfil}><p className="text-sm text-slate-500">Selecione as necessidades que deseja informar à equipe de atendimento. Essas informações são opcionais.</p><div className="grid gap-3 sm:grid-cols-2">{["Acessibilidade física / mobilidade", "Atendimento em Libras", "Deficiência visual", "Deficiência auditiva", "Neurodivergência ou necessidade sensorial", "Preciso de outro tipo de apoio"].map((opcao) => <label key={opcao} className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-sm text-slate-700"><input type="checkbox" checked={(perfil.acessibilidade ?? []).includes(opcao)} onChange={(e) => atualizar("acessibilidade", e.target.checked ? [...(perfil.acessibilidade ?? []), opcao] : (perfil.acessibilidade ?? []).filter((x) => x !== opcao))} className="h-4 w-4 accent-[#007DB8]" />{opcao}</label>)}</div><Salvar salvando={salvando} /></form>}
          {secao === "reclamacoes" && <div className="mt-6"><div className="mb-6 rounded-xl bg-sky-50 p-4"><p className="text-sm text-slate-600">Manifestações registradas nesta conta</p><p className="mt-1 text-3xl font-extrabold text-[#007DB8]">{manifestacoes}</p></div><form className="space-y-5" onSubmit={enviarManifestacao}><div><label className={label} htmlFor="tipoManifestacao">Tipo de manifestação</label><select id="tipoManifestacao" className={campo} value={tipoManifestacao} onChange={(e) => setTipoManifestacao(e.target.value)}><option>Reclamação</option><option>Sugestão</option><option>Elogio</option></select></div><div><label className={label} htmlFor="assunto">Assunto *</label><input id="assunto" className={campo} value={assunto} onChange={(e) => setAssunto(e.target.value)} required maxLength={100} placeholder="Resuma o assunto" /></div><div><label className={label} htmlFor="descricao">Descrição *</label><textarea id="descricao" className={campo} value={descricao} onChange={(e) => setDescricao(e.target.value)} required minLength={10} rows={5} maxLength={2000} placeholder="Conte o que aconteceu ou deixe sua sugestão." /></div><button disabled={enviandoManifestacao} className="rounded-xl bg-[#007DB8] px-6 py-3 font-bold text-white transition hover:bg-[#005F8F] disabled:opacity-60">{enviandoManifestacao ? "Enviando..." : "Enviar manifestação"}</button></form><p className="mt-4 text-xs leading-5 text-slate-500">O envio depende das regras do Firestore para a coleção usuarios/{"{UID}"}/reclamaScoes.</p></div>}
        </section>
      </>}
    </main><Footer /></div>;
}

function Salvar({ salvando }: { salvando: boolean }) {
  return <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-5"><p className="text-xs text-slate-500">* Campos obrigatórios quando aplicável.</p><button type="submit" disabled={salvando} className="rounded-xl bg-[#007DB8] px-6 py-3 font-bold text-white transition hover:bg-[#005F8F] disabled:cursor-not-allowed disabled:opacity-60">{salvando ? "Salvando..." : "Salvar alterações"}</button></div>;
}

export default function PerfilPage() {
  return <Suspense fallback={<div className="min-h-screen bg-[#F5F9FC] p-8">Carregando perfil...</div>}><ConteudoPerfil /></Suspense>;
}
