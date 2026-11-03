"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/app/firebase";
import { dadosCadastro, idadeCadastro, type DadosCadastro } from "@/lib/cadastro/validacao";

const vazio: DadosCadastro = { nome:"", cpf:"", telefone:"", dataNascimento:"", numeroSUS:"", emailResponsavel:"", cep:"", rua:"", numero:"", bairro:"", cidade:"Blumenau", uf:"SC" };
const campo = "mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900";

export default function FormularioCadastro() {
  const router = useRouter();
  const [dados, setDados] = useState(vazio);
  const [etapa, setEtapa] = useState(0);
  const [erro, setErro] = useState("");
  const [erroEndereco, setErroEndereco] = useState("");
  const [unidade, setUnidade] = useState("");
  const [consultando, setConsultando] = useState(false);
  const [consultandoCep, setConsultandoCep] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [identidadeFixa, setIdentidadeFixa] = useState(false);
  const cepVersao = useRef(0);

  useEffect(() => {
    let ativo = true;
    const cancelar = onAuthStateChanged(auth, async usuario => {
      if (!usuario) { router.replace("/login"); return; }
      try {
        const d = (await getDoc(doc(db, "usuarios", usuario.uid))).data() ?? {};
        if (!ativo) return;
        setDados(Object.fromEntries(Object.keys(vazio).map(k => [k, typeof d[k] === "string" ? d[k] : k === "numeroSUS" ? String(d.cartaoSus ?? "") : vazio[k as keyof DadosCadastro]])) as DadosCadastro);
        setIdentidadeFixa(d.cadastroVersao === 2);
      } catch {
        if (ativo) setErro("Não foi possível carregar seu perfil. Recarregue a página.");
      } finally {
        if (ativo) setCarregando(false);
      }
    });
    return () => { ativo = false; cancelar(); };
  }, [router]);

  const idade = idadeCadastro(dados.dataNascimento);
  function alterar(chave: keyof DadosCadastro, valor: string) {
    setDados(d => ({ ...d, [chave]: valor }));
    setErro("");
    if (["cep", "rua", "numero", "bairro"].includes(chave)) { setUnidade(""); setErroEndereco(""); }
    if (chave === "cep") {
      cepVersao.current++;
      setConsultandoCep(false);
      setDados(d => ({ ...d, cep: valor, rua:"", bairro:"", cidade:"Blumenau", uf:"SC" }));
    }
  }

  async function cep() {
    const valor = dados.cep.replace(/\D/g, ""), versao = ++cepVersao.current;
    if (valor.length !== 8) { setErroEndereco("Informe um CEP com oito números."); return; }
    setConsultandoCep(true); setErroEndereco(""); setUnidade("");
    try {
      const r = await fetch("/api/endereco", { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify({ cep:valor }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.erro);
      if (versao === cepVersao.current) setDados(a => ({ ...a, cep:d.cep, rua:d.rua, bairro:d.bairro, cidade:d.cidade, uf:d.uf }));
    } catch (e) {
      if (versao === cepVersao.current) setErroEndereco(e instanceof Error ? e.message : "Não foi possível consultar o CEP.");
    } finally {
      if (versao === cepVersao.current) setConsultandoCep(false);
    }
  }

  useEffect(() => {
    setUnidade("");
    if (etapa !== 1 || !/^\d{8}$/.test(dados.cep) || !dados.rua || !dados.bairro || !/^[1-9]\d{0,5}$/.test(dados.numero)) { setConsultando(false); return; }
    const controle = new AbortController();
    setConsultando(true); setErroEndereco("");
    const tempo = setTimeout(async () => {
      try {
        const r = await fetch("/api/endereco", { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify(dados), signal:controle.signal });
        const d = await r.json();
        if (!r.ok) throw new Error(d.erro);
        if (!controle.signal.aborted) setUnidade(d.unidadeReferencia);
      } catch (e) {
        if (!controle.signal.aborted) setErroEndereco(e instanceof Error ? e.message : "Não foi possível identificar sua UBS.");
      } finally {
        if (!controle.signal.aborted) setConsultando(false);
      }
    }, 500);
    return () => { clearTimeout(tempo); controle.abort(); };
  }, [dados.cep, dados.rua, dados.bairro, dados.numero, etapa]);

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setErro("");
    if (etapa === 0) { setEtapa(1); return; }
    try {
      dadosCadastro(dados);
      if (!unidade || consultando) throw new Error("Aguarde a identificação da UBS para concluir.");
      setSalvando(true);
      const token = await auth.currentUser?.getIdToken();
      if (!token) { router.replace("/login"); return; }
      const r = await fetch("/api/perfil", { method:"POST", headers:{ "Content-Type":"application/json", Authorization:"Bearer " + token }, body:JSON.stringify(dados) });
      const retorno = await r.json();
      if (!r.ok) throw new Error(retorno.erro);
      router.replace("/dashboard");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível concluir.");
    } finally {
      setSalvando(false);
    }
  }

  function input(chave: keyof DadosCadastro, titulo: string, tipo = "text", max = 160) {
    const fixo = identidadeFixa && ["cpf", "dataNascimento"].includes(chave);
    return <label key={chave} className="block text-sm font-bold text-slate-800">{titulo}<input className={campo} name={chave} type={tipo} value={dados[chave]} required maxLength={max} readOnly={fixo} onChange={e => alterar(chave, e.target.value)} {...(tipo === "date" ? { max:new Date().toISOString().slice(0,10) } : {})}/></label>;
  }

  if (carregando) return <p role="status">Carregando seu cadastro…</p>;
  return <form method="post" onSubmit={enviar} className="space-y-5">
    <fieldset disabled={salvando} className="space-y-5">
      <p className="text-sm text-slate-600">Todos os campos exibidos são obrigatórios. Etapa {etapa + 1} de 2.</p>
      <h2 className="text-xl font-bold text-[#005F8F]">{etapa === 0 ? "Seus dados" : "Seu endereço e sua UBS"}</h2>
      {etapa === 0 && <div className="grid gap-5 sm:grid-cols-2">
        {input("nome", "Nome completo")}{input("cpf", "CPF", "text", 14)}
        {input("dataNascimento", "Data de nascimento", "date")}{input("telefone", "Telefone com DDD", "tel", 20)}
        {input("numeroSUS", "Número do Cartão SUS", "text", 25)}
        {idade !== null && idade < 10 && input("emailResponsavel", "E-mail do responsável", "email")}
      </div>}
      {etapa === 1 && <>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="text-sm font-bold text-slate-800">CEP de Blumenau<input name="cep" inputMode="numeric" autoComplete="postal-code" value={dados.cep} onChange={e => alterar("cep", e.target.value.replace(/\D/g, "").slice(0,8))} onBlur={cep} required pattern="[0-9]{8}" className={campo}/><button type="button" onClick={cep} disabled={consultandoCep} className="min-h-12 py-2 font-bold text-[#005F8F] underline">{consultandoCep ? "Consultando…" : "Consultar CEP"}</button></label>
          {input("numero", "Número da residência", "text", 6)}{input("rua", "Rua ou avenida")}{input("bairro", "Bairro")}
          <label className="text-sm font-bold text-slate-800">Cidade<input value="Blumenau" readOnly className={campo}/></label>
          <label className="text-sm font-bold text-slate-800">Estado<input value="SC" readOnly className={campo}/></label>
        </div>
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-5">
          <p className="font-bold text-[#005F8F]">Sua unidade de saúde</p>
          <p role="status" className="mt-2">{consultando ? "Identificando a UBS pela rua e número…" : unidade || "Preencha o endereço para identificar sua UBS."}</p>
          <p className="mt-3 text-xs text-slate-600">Tabela territorial municipal de 2022, consultada em novembro de 2026. Confirme com a unidade para atendimento presencial.</p>
        </div>
        {erroEndereco && <p role="alert" className="text-sm font-semibold text-red-800">{erroEndereco}</p>}
      </>}
      {erro && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{erro}</p>}
      <div className="flex flex-wrap gap-3">
        {etapa > 0 && <button type="button" className="sv-button sv-button-outline" onClick={() => { setEtapa(0); setErro(""); }}>← Voltar</button>}
        <button type="submit" disabled={etapa === 1 && (!unidade || consultando || consultandoCep)} className="sv-button flex-1">{salvando ? "Salvando…" : etapa === 0 ? "Continuar →" : "Concluir e acessar minha área"}</button>
      </div>
    </fieldset>
  </form>;
}
