"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth } from "../app/firebase";
import { MenuMovel } from "./Navigation";

export default function Header() {
  const router = useRouter();
  const caminho = usePathname();
  const configuracoes = { pathname: "/perfil", query: { secao: "acessibilidade", voltar: caminho } };

  const [usuario, setUsuario] = useState<User | null>(null);
  const [carregouAuth, setCarregouAuth] = useState(false);
  const [saindo, setSaindo] = useState(false);

  useEffect(() => {
    const cancelarObservador = onAuthStateChanged(auth, (usuarioAtual) => {
      setUsuario(usuarioAtual);
      setCarregouAuth(true);
    });

    return () => cancelarObservador();
  }, []);

  const sair = async () => {
    try {
      setSaindo(true);
      await fetch("/api/acesso", { method: "DELETE" });
      await signOut(auth);
      router.replace("/");
    } catch (error) {
      console.error("Erro ao sair da conta:", error);
      window.alert("Não foi possível sair da conta. Tente novamente.");
    } finally {
      setSaindo(false);
    }
  };

  return (
    <header className="w-full bg-[#0A5C83]">
      <div className="relative mx-auto flex min-h-[88px] max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:min-h-[100px] sm:px-8 lg:px-12">
        {/* LOGO */}
        <Link
          href={usuario ? "/dashboard" : "/"}
          className="flex min-w-0 shrink-0 items-center"
          aria-label="Saúde Vale+ - Página inicial"
        >
          <Image
            src="/imagens/logo-saude-vale-mais-1.png"
            alt="Saúde Vale+"
            width={1545}
            height={744}
            priority
            className="sv-logo-clara h-14 w-auto max-w-[190px] object-contain sm:h-[72px] sm:max-w-[230px]"
          />
          <Image src="/imagens/logo-saude-vale-mais-escura.png" alt="Saúde Vale+" width={1774} height={887} className="sv-logo-escura h-14 w-auto max-w-[190px] object-contain sm:h-[72px] sm:max-w-[230px]" />
        </Link>

        {/* AÇÕES DA CONTA */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link href={configuracoes} className={`rounded-lg px-2 py-3 text-xs font-bold text-white hover:bg-white/15 sm:text-sm ${usuario ? "hidden md:inline-flex" : ""}`}>Configurações</Link>
          {usuario && <MenuMovel configuracoes={configuracoes} />}
          {!carregouAuth ? (
            <div className="h-10 w-20" aria-label="Carregando conta" />
          ) : usuario ? (
            <button
              type="button"
              onClick={sair}
              disabled={saindo}
              className="rounded-xl border border-white/70 px-4 py-2.5 font-[family-name:var(--font-inter)] text-sm font-bold text-white transition hover:bg-white hover:text-[#005F8F] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saindo ? "Saindo..." : "Sair"}
            </button>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-xl border border-white/70 px-3 py-2.5 font-[family-name:var(--font-inter)] text-xs font-bold text-white transition hover:bg-white hover:text-[#005F8F] sm:px-4 sm:text-sm"
              >
                Entrar
              </Link>

              <Link
                href="/cadastro"
                className="rounded-xl bg-white px-3 py-2.5 font-[family-name:var(--font-inter)] text-xs font-bold text-[#005F8F] transition hover:bg-[#EAF7FC] sm:px-4 sm:text-sm"
              >
                Criar conta
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
