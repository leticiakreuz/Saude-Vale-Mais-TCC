"use client";
import { auth } from "@/app/firebase";
export async function api<T = Record<string, unknown>>(caminho: string, dados?: unknown, metodo?: string): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new Error("Sua sessão expirou. Entre novamente.");
  const token = await user.getIdToken();
  const resposta = await fetch("/api/profissional/" + caminho, { method: metodo ?? (dados ? "POST" : "GET"), headers: { Authorization: "Bearer " + token, ...(dados ? { "Content-Type": "application/json" } : {}) }, ...(dados ? { body: JSON.stringify(dados) } : {}), cache: "no-store" });
  const resultado = await resposta.json();
  if (!resposta.ok) throw new Error(resultado.erro ?? "Não foi possível concluir a ação.");
  return resultado as T;
}
