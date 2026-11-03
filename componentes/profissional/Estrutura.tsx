"use client";
import Image from "next/image";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import { auth } from "@/app/firebase";
import { ROTULOS, type Profissional } from "@/lib/profissionais/modelos";
import { ABAS_ADMIN, abaAdministracao, caminhoAba } from "@/lib/profissionais/abasAdministracao";

const menus = {
  medico: [["agenda", "Minha agenda"], ["receitas", "Receitas demonstrativas"], ["escalas", "Meus horários"]],
  enfermagem: [["agenda", "Atendimentos"], ["vacinacao", "Sala de vacinação"], ["escalas", "Meus horários"]],
  odontologia: [["agenda", "Agenda odontológica"], ["historico", "Consultas realizadas"], ["receitas", "Receitas demonstrativas"], ["escalas", "Meus horários"]],
  recepcao: [["agenda", "Agenda da unidade"], ["pacientes", "Buscar paciente"], ["marcacao", "Marcar / remarcar"]],
};
export default function Estrutura({ profissional: p, children }: { profissional: Profissional; children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const parametros = useSearchParams();
  const [erro, setErro] = useState("");
  const configuracoes = pathname === "/profissional/configuracoes";
  const abaAtual = abaAdministracao(parametros.get("aba"));
  async function sair() {
    try {
      await fetch("/api/acesso", { method: "DELETE" });
      await signOut(auth);
      router.replace("/");
      router.refresh();
    } catch { setErro("Não foi possível sair. Tente novamente."); }
  }
  return (
    <div className="sv-profissional min-h-screen bg-[#F5F7FA]">
      <a href="#conteudo" className="pular-conteudo">Pular para o conteúdo</a>
      <header className="bg-[#0A5C83] text-white">
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-3 lg:px-8">
          <Link href="/" className="flex items-center" aria-label="Saúde Vale+, início">
            <Image src="/imagens/logo-saude-vale-mais-1.png" alt="Saúde Vale+" width={1024} height={512} className="h-16 w-auto object-contain sm:h-20" />
          </Link>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Link href="/profissional/configuracoes" aria-current={configuracoes ? "page" : undefined} className="rounded-lg px-3 py-3 font-semibold hover:bg-white/15">Configurações</Link>
            <button onClick={sair} className="min-h-11 rounded-lg border border-white/70 px-4 py-2 font-bold hover:bg-white/15">Sair da conta</button>
          </div>
        </div>
      </header>
      <div className="lg:grid lg:grid-cols-[245px_minmax(0,1fr)]">
        <aside className="border-b border-slate-200 bg-[#004C73] p-5 text-white lg:min-h-[calc(100vh-104px)] lg:p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-sky-200">Área profissional</p>
          <p className="mt-4 text-xl font-bold">{ROTULOS[p.cargo]}</p>
          <p className="mt-2 break-words text-sm text-sky-100">{p.unidadeReferencia}</p>
          <nav aria-label="Ferramentas da sua função" className="mt-7 flex flex-wrap gap-2 lg:grid">
            {p.cargo === "administracao" ? ABAS_ADMIN.map(([id, rotulo]) => {
              const ativa = !configuracoes && abaAtual === id;
              return <Link key={id} href={caminhoAba(id)} aria-current={ativa ? "page" : undefined} className={"rounded-lg px-3 py-3 text-sm font-semibold hover:bg-white/15 " + (ativa ? "bg-white/15 ring-1 ring-white/20" : "")}>{rotulo}</Link>;
            }) : menus[p.cargo].map(([id, rotulo]) => <Link className="rounded-lg px-3 py-3 text-sm font-semibold hover:bg-white/15" href={"/profissional/" + p.cargo + "#" + id} key={id}>{rotulo}</Link>)}
            <Link href="/profissional/configuracoes" aria-current={configuracoes ? "page" : undefined} className={"rounded-lg px-3 py-3 text-sm font-semibold hover:bg-white/15 " + (configuracoes ? "bg-white/15" : "")}>Configurações</Link>
          </nav>
          <div className="mt-8 border-t border-white/20 pt-5 text-sm">
            <p className="font-bold">{p.nome}</p>
            <p className="mt-2 text-sky-100">{p.registro || "Equipe administrativa"}</p>
            <p className="mt-5 text-xs leading-5 text-sky-100">Ambiente acadêmico · Utilize dados fictícios na demonstração.</p>
          </div>
        </aside>
        <main id="conteudo" className="min-w-0 p-4 md:p-7 lg:p-10">{erro && <p role="alert" className="mb-5 text-red-700">{erro}</p>}{children}</main>
      </div>
    </div>
  );
}
