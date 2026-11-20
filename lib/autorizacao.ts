import "server-only";
import { NextResponse } from "next/server";
import type { DecodedIdToken } from "firebase-admin/auth";
import { adminAuth } from "@/lib/firebaseAdmin";

export class ErroAcesso extends Error {
  constructor(message: string, public status = 403) {
    super(message);
  }
}

export async function autenticar(request: Request): Promise<DecodedIdToken> {
  const cabecalho = request.headers.get("authorization");
  if (!cabecalho?.startsWith("Bearer ")) {
    throw new ErroAcesso("Entre na sua conta para continuar.", 401);
  }
  try {
    return await adminAuth.verifyIdToken(cabecalho.slice(7).trim(), true);
  } catch (erro) {
    if (erro instanceof Error && erro.message.includes("não configurado")) {
      throw new ErroAcesso(erro.message, 503);
    }
    throw new ErroAcesso("Sua sessão expirou. Entre novamente.", 401);
  }
}

export function respostaErro(erro: unknown) {
  if (erro instanceof ErroAcesso) {
    return NextResponse.json({ erro: erro.message }, {
      status: erro.status,
      headers: { "Cache-Control": "no-store" },
    });
  }
  console.error("Falha na operação", erro instanceof Error ? erro.message : "Erro desconhecido");
  return NextResponse.json({ erro: "Não foi possível concluir. Tente novamente." }, {
    status: 500,
    headers: { "Cache-Control": "no-store" },
  });
}

export function json(dados: unknown, status = 200) {
  return NextResponse.json(dados, { status, headers: { "Cache-Control": "private, no-store" } });
}
