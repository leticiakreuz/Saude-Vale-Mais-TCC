"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/app/firebase";

const atalhos = [
  ["/acesso", "Minha área"],
  ["/agendamentos", "Agendamentos"],
  ["/medicamentos", "Medicamentos"],
  ["/vacinacao", "Vacinação"],
  ["/perfil", "Meu perfil"],
];

export default function AcoesConta({ login }: { login: string }) {
  const [conectado, setConectado] = useState(false);
  useEffect(() => onAuthStateChanged(auth, usuario => setConectado(Boolean(usuario))), []);

  return <div className="flex items-center gap-2 sm:gap-3">
    <Link href="/profissional" className="hidden rounded-lg border border-white/60 px-3 py-3 text-sm font-bold hover:bg-white/15 lg:inline-flex">Sou profissional</Link>
    {conectado ? <>
      <Link href="/acesso" className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-[#005F8F] hover:bg-sky-50">Minha área</Link>
      <details className="relative lg:hidden">
        <summary className="cursor-pointer rounded-lg border border-white/70 px-3 py-3 text-sm font-bold">Menu</summary>
        <nav aria-label="Menu para celular" className="absolute right-0 z-30 mt-3 w-60 rounded-2xl border border-slate-200 bg-white p-3 text-slate-800 shadow-xl">
          {atalhos.map(([url, nome]) => <Link key={url} href={url} onClick={e => e.currentTarget.closest("details")?.removeAttribute("open")} className="block rounded-lg px-4 py-3 text-sm font-semibold hover:bg-sky-50">{nome}</Link>)}
        </nav>
      </details>
    </> : <>
      <Link href={login} className="rounded-lg px-2 py-3 text-sm font-bold hover:bg-white/15">Entrar</Link>
      <Link href="/cadastro" className="rounded-xl bg-white px-3 py-3 text-sm font-bold text-[#005F8F] hover:bg-sky-50 sm:px-4">Criar conta</Link>
    </>}
  </div>;
}
