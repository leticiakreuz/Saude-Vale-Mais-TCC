"use client";
import { useSyncExternalStore } from "react";
import { EVENTO_ACESSIBILIDADE, lerPreferencias } from "./acessibilidade";
function assinar(atualizar: () => void) {
  window.addEventListener(EVENTO_ACESSIBILIDADE, atualizar);
  window.addEventListener("storage", atualizar);
  return () => { window.removeEventListener(EVENTO_ACESSIBILIDADE, atualizar); window.removeEventListener("storage", atualizar); };
}
export default function useModoSimples() {
  return useSyncExternalStore(assinar, () => lerPreferencias().modoEssencial, () => false);
}
