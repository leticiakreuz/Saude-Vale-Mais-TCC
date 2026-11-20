"use client";
import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../app/firebase";
import Icone from "./publico/Icone";

const linksCidadao = [
  ["/dashboard", "Início", "casa"],
  ["/agendamentos", "Agendamentos", "agenda"],
  ["/medicamentos", "Medicamentos", "medicamento"],
  ["/vacinacao", "Vacinação", "vacina"],
  ["/perfil", "Meu perfil", "pessoa"],
];
const linksPublicos = [
  ["/", "Início", "casa"],
  ["/#servicos", "Serviços", "sus"],
  ["/#como-funciona", "Como funciona", "simples"],
  ["/sobre-sus", "Sobre o SUS", "escudo"],
];

export default function Navigation() {
  const pathname = usePathname();
  const [usuarioLogado, setUsuarioLogado] = useState(false);
  const [carregou, setCarregou] = useState(false);
  useEffect(() => onAuthStateChanged(auth, user => {
    setUsuarioLogado(Boolean(user));
    setCarregou(true);
  }), []);
  const links = usuarioLogado ? linksCidadao : linksPublicos;

  return (
    <nav aria-label="Navegação principal" className="hidden border-b border-sky-100 bg-[#F5F7FA] md:block">
      <div className="mx-auto flex min-h-14 max-w-7xl items-center justify-center gap-7 px-6">
        {carregou && links.map(([url, nome]) => (
          <Link href={url} key={url} aria-current={pathname === url ? "page" : undefined}
            className="py-3 text-sm font-semibold text-[#111827] hover:text-[#007DB8]">{nome}</Link>
        ))}
      </div>
    </nav>
  );
}

export function MenuMovel({ configuracoes }) {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);
  const menuId = useId();
  const botaoMenu = useRef(null);
  useEffect(() => setAberto(false), [pathname]);
  const links = [...linksCidadao, [configuracoes, "Configurações", "configuracoes"]];

  function fecharComEscape(evento) {
    if (evento.key !== "Escape" || !aberto) return;
    setAberto(false);
    botaoMenu.current?.focus();
  }

  return (
    <nav aria-label="Navegação principal" onKeyDown={fecharComEscape} className="md:hidden">
      <button ref={botaoMenu} type="button" aria-expanded={aberto} aria-controls={menuId}
        onClick={() => setAberto(v => !v)} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-white/70 bg-[#005F8F] px-3 text-sm font-bold text-white hover:bg-[#004B70] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4" aria-hidden="true">
          <path d={aberto ? "m6 6 12 12M18 6 6 18" : "M4 6h16M4 12h16M4 18h16"} />
        </svg>
        {aberto ? "Fechar" : "Menu"}
      </button>
      <ul id={menuId} hidden={!aberto} className={aberto ? "absolute inset-x-4 top-full z-30 ml-auto mt-2 grid max-h-[calc(100dvh-7rem)] max-w-sm gap-2 overflow-y-auto rounded-2xl border border-sky-100 bg-white p-2 shadow-lg min-[400px]:grid-cols-2" : "hidden"}>
        {links.map(([url, nome, icone]) => {
          const atual = pathname === url;
          return <li key={nome}>
            <Link href={url} aria-current={atual ? "page" : undefined} onClick={() => setAberto(false)}
              className={`flex min-h-12 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005F8F] ${atual ? "border-sky-300 bg-sky-100 font-extrabold text-[#005F8F]" : "border-slate-200 bg-slate-50 text-slate-800 hover:border-sky-300 hover:bg-sky-50"}`}>
              <Icone nome={icone} className="h-5 w-5 shrink-0 text-[#005F8F]" />
              <span className="flex-1">{nome}</span>
              {atual && <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-[#005F8F]" />}
            </Link>
          </li>;
        })}
      </ul>
    </nav>
  );
}
