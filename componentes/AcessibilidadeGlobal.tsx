"use client";
import { useEffect } from "react";
import { aplicarPreferencias, lerPreferencias, EVENTO_ACESSIBILIDADE } from "@/lib/acessibilidade";
export { lerPreferencias, salvarPreferencias, PREFERENCIAS_PADRAO, type PreferenciasAcessibilidade } from "@/lib/acessibilidade";
export default function AcessibilidadeGlobal() {
  useEffect(() => {
    const atualizar = () => aplicarPreferencias(lerPreferencias());
    atualizar();
    window.addEventListener(EVENTO_ACESSIBILIDADE, atualizar);
    window.addEventListener("storage", atualizar);
    return () => {
      window.removeEventListener(EVENTO_ACESSIBILIDADE, atualizar);
      window.removeEventListener("storage", atualizar);
    };
  }, []);
  return null;
}
