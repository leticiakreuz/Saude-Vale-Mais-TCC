"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../app/firebase";

export default function Navigation() {
  const pathname = usePathname();

  const [usuarioLogado, setUsuarioLogado] = useState(false);
  const [carregouAuth, setCarregouAuth] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    const cancelarObservador = onAuthStateChanged(auth, (usuario) => {
      setUsuarioLogado(Boolean(usuario));
      setCarregouAuth(true);
      setMenuAberto(false);
    });

    return () => cancelarObservador();
  }, []);

  useEffect(() => {
    setMenuAberto(false);
  }, [pathname]);

  const fecharMenu = () => setMenuAberto(false);

  const classeLink =
    "rounded-xl px-3 py-3 font-[family-name:var(--font-inter)] text-sm font-semibold text-[#111827] transition hover:bg-white hover:text-[#007DB8]";

  const classeDesktop =
    "font-[family-name:var(--font-inter)] text-sm font-semibold text-[#111827] transition hover:text-[#007DB8]";

  return (
    <nav
      aria-label="Navegação principal"
      className="border-y border-[#D1D5DB] bg-[#F5F7FA]"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {!carregouAuth ? (
          <div className="h-14" aria-label="Carregando navegação" />
        ) : (
          <>
            {/* MENU PARA COMPUTADORES */}
            <div className="hidden min-h-14 items-center justify-center gap-6 lg:gap-9 md:flex">
              {usuarioLogado ? (
                <>
                  <Link href="/dashboard" className={classeDesktop}>
                    Início
                  </Link>

                  <Link href="/agendamentos" className={classeDesktop}>
                    Agendamentos
                  </Link>

                  <Link href="/medicamentos" className={classeDesktop}>
                    Medicamentos
                  </Link>

                  <Link href="/vacinacao" className={classeDesktop}>
                    Vacinação
                  </Link>

                  <Link href="/sobre-sus" className={classeDesktop}>
                    Sobre o SUS
                  </Link>

                  <Link href="/perfil" className={classeDesktop}>
                    Meu perfil
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/" className={classeDesktop}>
                    Início
                  </Link>

                  <Link href="/#servicos" className={classeDesktop}>
                    Serviços
                  </Link>

                  <Link href="/#sobre" className={classeDesktop}>
                    Sobre o projeto
                  </Link>

                  <Link href="/#como-funciona" className={classeDesktop}>
                    Como funciona
                  </Link>

                  <Link href="/sobre-sus" className={classeDesktop}>
                    Sobre o SUS
                  </Link>
                </>
              )}
            </div>

            {/* MENU PARA CELULARES */}
            <div className="flex min-h-14 items-center justify-between md:hidden">
              <span className="font-[family-name:var(--font-inter)] text-sm font-bold text-[#005F8F]">
                {usuarioLogado ? "Minha área" : "Menu"}
              </span>

              <button
                type="button"
                onClick={() => setMenuAberto((estado) => !estado)}
                className="rounded-xl border border-[#D1D5DB] bg-white px-4 py-2 font-[family-name:var(--font-inter)] font-bold text-[#005F8F] transition hover:border-[#007DB8]"
                aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
                aria-expanded={menuAberto}
              >
                {menuAberto ? "✕" : "☰"}
              </button>
            </div>

            {/* LINKS DO MENU MOBILE */}
            {menuAberto && (
              <div className="border-t border-[#D1D5DB] py-3 md:hidden">
                <div className="flex flex-col gap-1">
                  {usuarioLogado ? (
                    <>
                      <Link
                        href="/dashboard"
                        onClick={fecharMenu}
                        className={classeLink}
                      >
                        Início
                      </Link>

                      <Link
                        href="/agendamentos"
                        onClick={fecharMenu}
                        className={classeLink}
                      >
                        Agendamentos
                      </Link>

                      <Link
                        href="/medicamentos"
                        onClick={fecharMenu}
                        className={classeLink}
                      >
                        Medicamentos
                      </Link>

                      <Link
                        href="/vacinacao"
                        onClick={fecharMenu}
                        className={classeLink}
                      >
                        Vacinação
                      </Link>

                      <Link
                        href="/sobre-sus"
                        onClick={fecharMenu}
                        className={classeLink}
                      >
                        Sobre o SUS
                      </Link>

                      <Link
                        href="/perfil"
                        onClick={fecharMenu}
                        className={classeLink}
                      >
                        Meu perfil
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/"
                        onClick={fecharMenu}
                        className={classeLink}
                      >
                        Início
                      </Link>

                      <Link
                        href="/#servicos"
                        onClick={fecharMenu}
                        className={classeLink}
                      >
                        Serviços
                      </Link>

                      <Link
                        href="/#sobre"
                        onClick={fecharMenu}
                        className={classeLink}
                      >
                        Sobre o projeto
                      </Link>

                      <Link
                        href="/#como-funciona"
                        onClick={fecharMenu}
                        className={classeLink}
                      >
                        Como funciona
                      </Link>

                      <Link
                        href="/sobre-sus"
                        onClick={fecharMenu}
                        className={classeLink}
                      >
                        Sobre o SUS
                      </Link>
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </nav>
  );
}