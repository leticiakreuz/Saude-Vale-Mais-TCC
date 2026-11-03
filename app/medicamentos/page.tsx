"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Header from "@/componentes/Header";
import Navigation from "@/componentes/Navigation";
import Footer from "@/componentes/Footer";
import Icone from "@/componentes/publico/Icone";
import TelaSimples from "@/componentes/simples/TelaSimples";
import useModoSimples from "@/lib/useModoSimples";
import { formatarData } from "@/lib/profissionais/datas";
import { auth, db } from "../firebase";

type Medicamento = {
  id: string; nome: string; dosagem: string; quantidade: string; frequencia: string;
  proximaRetirada: string; status: string; observacao: string; profissionalNome: string;
  dataReceita: string; demonstrativo: boolean; unidadeRetirada: string;
};
const texto = (valor: unknown) => typeof valor === "string" ? valor : "";
function disponibilidade(m: Medicamento) {
  const status = m.status.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (status === "disponivel") return { rotulo: m.unidadeRetirada ? "Disponível na unidade" : "Disponível", simbolo: "✓", cor: "border-green-200 bg-green-50 text-green-900" };
  if (status === "indisponivel") return { rotulo: "Indisponível no momento", simbolo: "×", cor: "border-red-200 bg-red-50 text-red-900" };
  if (status === "aguardando reposicao") return { rotulo: "Aguardando reposição", simbolo: "◷", cor: "border-amber-200 bg-amber-50 text-amber-900" };
  return { rotulo: "Disponibilidade não informada", simbolo: "?", cor: "border-slate-200 bg-slate-50 text-slate-700" };
}
function dataDoRegistro(valor: unknown): string {
  if (typeof valor === "string") return valor.slice(0, 10);
  if (valor && typeof valor === "object" && "toDate" in valor && typeof valor.toDate === "function") {
    const data = valor.toDate() as Date;
    return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(data);
  }
  return "";
}
export default function MedicamentosPage() {
  const router = useRouter();
  const simples = useModoSimples();
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  useEffect(() => {
    let ativo = true, geracao = 0;
    const cancelar = onAuthStateChanged(auth, async user => {
      const atual = ++geracao;
      setMedicamentos([]); setErro(""); setCarregando(true);
      if (!user) { router.replace("/login"); return; }
      try {
        const documentos = await getDocs(collection(db, "usuarios", user.uid, "medicamentos"));
        const lista = documentos.docs.map(documento => {
          const d = documento.data();
          return {
            id: documento.id, nome: texto(d.nome), dosagem: texto(d.dosagem), quantidade: texto(d.quantidade),
            frequencia: texto(d.frequencia), proximaRetirada: texto(d.proximaRetirada),
            status: texto(d.status), observacao: texto(d.observacao), demonstrativo: d.demonstrativo === true,
            unidadeRetirada: texto(d.unidadeRetirada) || texto(d.unidade) || texto(d.unidadeReferencia),
            profissionalNome: texto(d.profissionalNome) || texto(d.medicoNome) || texto(d.nomeMedico) || texto(d.medico) || "Profissional não informado",
            dataReceita: dataDoRegistro(d.dataReceita ?? d.dataPrescricao ?? d.criadoEm),
          };
        });
        if (ativo && atual === geracao) setMedicamentos(lista);
      } catch { if (ativo && atual === geracao) setErro("Não foi possível carregar seus medicamentos."); }
      finally { if (ativo && atual === geracao) setCarregando(false); }
    });
    return () => { ativo = false; cancelar(); };
  }, [router]);
  const lista = medicamentos.filter(m => !["encerrado", "cancelado"].includes(m.status.toLowerCase()));
  const conteudo = <>
    {erro && <p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-red-800">{erro}</p>}
    {carregando ? <p role="status" className="rounded-2xl bg-white p-7">Carregando…</p> : !lista.length ? <div className="rounded-2xl border border-slate-200 bg-white p-8"><Icone nome="medicamento" className="mb-4 h-12 w-12 text-[#007DB8]" /><p className="font-semibold text-slate-600">Nenhum medicamento nesta lista.</p></div> : <div className="space-y-5">{lista.map(m => <article key={m.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-start gap-4 border-b border-slate-100 px-5 py-5 sm:px-7">
        <span className="rounded-2xl bg-sky-50 p-3 text-[#007DB8]"><Icone nome="medicamento" className="h-9 w-9" /></span>
        <div className="min-w-0 flex-1"><h2 className="text-xl font-extrabold text-[#005F8F]">{m.nome || "Medicamento"}</h2>{m.dosagem && <p className="mt-1 text-base text-slate-600">{m.dosagem}</p>}</div>
      </div>
      <div className="px-5 py-5 sm:px-7">
        <div className={"mb-6 flex items-start gap-3 rounded-xl border p-4 " + disponibilidade(m).cor}>
          <span aria-hidden="true" className="text-2xl font-bold">{disponibilidade(m).simbolo}</span>
          <div><p className="font-bold">{disponibilidade(m).rotulo}</p><p className="mt-1 text-sm">{m.unidadeRetirada || "Unidade de retirada não informada"}</p></div>
        </div>
        <div className="flex items-start gap-3"><Icone nome="pessoa" className="mt-1 h-6 w-6 shrink-0 text-[#007DB8]" /><div><p className="text-xs font-semibold text-slate-500">Receitado por</p><p className="mt-1 font-bold text-slate-800">{m.profissionalNome}</p></div></div>
        <dl className="mt-5 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-3">
          <div><dt className="text-sm text-slate-500">Quantidade</dt><dd className="mt-1 font-bold">{m.quantidade || "Não informada"}</dd></div>
          <div><dt className="text-sm text-slate-500">Frequência</dt><dd className="mt-1 font-bold">{m.frequencia || "Não informada"}</dd></div>
          <div><dt className="text-sm text-slate-500">Próxima retirada</dt><dd className="mt-1 font-bold text-[#005F8F]">{m.proximaRetirada ? formatarData(m.proximaRetirada) : "Não informada"}</dd></div>
        </dl>
        {m.dataReceita && <p className="mt-5 text-sm text-slate-500">Receita de {formatarData(m.dataReceita)}</p>}
        {m.observacao && <p className="mt-4 border-l-2 border-[#8ED3F5] pl-3 text-sm leading-6 text-slate-600">{m.observacao}</p>}
        {m.demonstrativo && <p className="mt-4 text-xs font-bold uppercase tracking-wide text-[#005F8F]">Registro demonstrativo · Sem validade de receita médica</p>}
      </div>
    </article>)}</div>}
  </>;
  if (simples) return <TelaSimples titulo="Remédios" icone="medicamento">{conteudo}</TelaSimples>;
  return <div className="flex min-h-screen flex-col bg-[#F5F7FA]"><Header /><Navigation /><main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
    <div className="mb-7 flex flex-wrap items-center justify-between gap-4"><h1 className="text-3xl font-extrabold text-[#005F8F]">Meus medicamentos</h1><Link href="/dashboard" className="sv-button sv-button-outline">← Minha área</Link></div>
    {conteudo}
  </main><Footer /></div>;
}
