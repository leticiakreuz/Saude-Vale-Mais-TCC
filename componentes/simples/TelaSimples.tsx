import Link from "next/link";
import type { ReactNode } from "react";
import Header from "@/componentes/Header";
import Footer from "@/componentes/Footer";
import Icone, { type NomeIcone } from "@/componentes/publico/Icone";
export default function TelaSimples({ titulo, icone, children, voltar = "/dashboard" }: { titulo: string; icone: NomeIcone; children: ReactNode; voltar?: string | null }) {
  return <div className="sv-simples flex min-h-screen flex-col bg-[#F5F7FA]"><Header /><main id="conteudo" className="mx-auto w-full max-w-4xl flex-1 px-4 py-7 sm:px-6">
    {voltar && <Link href={voltar} className="mb-6 inline-flex min-h-12 items-center gap-3 rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold text-[#005F8F]"><span aria-hidden="true">←</span> Início</Link>}
    <h1 className="mb-7 flex items-center gap-4 text-3xl font-extrabold text-[#005F8F]"><Icone nome={icone} className="h-10 w-10 shrink-0" />{titulo}</h1>
    {children}
  </main><Footer /></div>;
}
