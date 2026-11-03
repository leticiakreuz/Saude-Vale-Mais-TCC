"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../app/firebase";
export default function Navigation() {
  const pathname = usePathname();
  const [usuarioLogado, setUsuarioLogado] = useState(false);
  const [carregou, setCarregou] = useState(false);
  const [aberto, setAberto] = useState(false);
  useEffect(() => onAuthStateChanged(auth, user => { setUsuarioLogado(Boolean(user)); setCarregou(true); setAberto(false); }), []);
  useEffect(() => setAberto(false), [pathname]);
  const links = usuarioLogado
    ? [["/dashboard", "Início"], ["/agendamentos", "Agendamentos"], ["/medicamentos", "Medicamentos"], ["/vacinacao", "Vacinação"], ["/perfil", "Meu perfil"]]
    : [["/", "Início"], ["/#servicos", "Serviços"], ["/#como-funciona", "Como funciona"], ["/sobre-sus", "Sobre o SUS"]];
  return <nav aria-label="Navegação principal" className="border-y border-[#D1D5DB] bg-[#F5F7FA]"><div className="mx-auto max-w-7xl px-4 sm:px-6">
    {!carregou ? <div className="h-14" aria-label="Carregando navegação" /> : <>
      <div className="hidden min-h-14 items-center justify-center gap-7 md:flex">{links.map(([url, nome]) => <Link href={url} key={url} aria-current={pathname === url ? "page" : undefined} className="py-3 text-sm font-semibold text-[#111827] hover:text-[#007DB8]">{nome}</Link>)}</div>
      <div className="flex min-h-14 items-center justify-between md:hidden"><span className="text-sm font-bold text-[#005F8F]">Minha área</span><button type="button" aria-expanded={aberto} onClick={() => setAberto(v => !v)} className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 font-bold text-[#005F8F]">{aberto ? "Fechar" : "Menu"}</button></div>
      {aberto && <div className="grid border-t border-slate-200 py-3 md:hidden">{links.map(([url, nome]) => <Link key={url} href={url} onClick={() => setAberto(false)} className="rounded-lg px-3 py-3 font-semibold text-[#005F8F] hover:bg-white">{nome}</Link>)}</div>}
    </>}
  </div></nav>;
}
