"use client";
import { useEffect, useState } from "react";
import { EVENTO_ACESSIBILIDADE, lerPreferencias, salvarPreferencias } from "@/lib/acessibilidade";
export default function ModoEssencial() {
  const [ativo, setAtivo] = useState(false);
  useEffect(() => {
    const atualizar = () => setAtivo(lerPreferencias().modoEssencial);
    atualizar();
    window.addEventListener(EVENTO_ACESSIBILIDADE, atualizar); window.addEventListener("storage", atualizar);
    return () => { window.removeEventListener(EVENTO_ACESSIBILIDADE, atualizar); window.removeEventListener("storage", atualizar); };
  }, []);
  return <button type="button" className="modo-essencial" onClick={() => salvarPreferencias({ ...lerPreferencias(), modoEssencial: !ativo })} aria-pressed={ativo}>Aa <span>Modo Simples {ativo ? "ativado" : ""}</span></button>;
}
