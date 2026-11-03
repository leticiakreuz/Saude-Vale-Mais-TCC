import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { DecodedIdToken } from "firebase-admin/auth";
import type { Transaction } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { cargoValido, permite, type Cargo, type Permissao, type Profissional } from "./modelos";

export class ErroAcesso extends Error { constructor(message: string, public status = 403) { super(message); } }
export async function autenticar(request: Request): Promise<DecodedIdToken> {
  const cabecalho = request.headers.get("authorization");
  if (!cabecalho?.startsWith("Bearer ")) throw new ErroAcesso("Entre na sua conta para continuar.", 401);
  try { return await adminAuth.verifyIdToken(cabecalho.slice(7).trim(), true); }
  catch (erro) { if (erro instanceof Error && erro.message.includes("não configurado")) throw new ErroAcesso(erro.message, 503); throw new ErroAcesso("Sua sessão expirou. Entre novamente.", 401); }
}
export function interpretarProfissional(uid: string, dados: Record<string, unknown> | undefined): Profissional {
  if (!dados || !cargoValido(dados.cargo) || !Array.isArray(dados.permissoes) || dados.permissoes.some(v => typeof v !== "string") || typeof dados.unidadeReferencia !== "string" || !dados.unidadeReferencia.trim() || typeof dados.versao !== "number" || !Number.isInteger(dados.versao) || dados.versao < 1) throw new ErroAcesso("Cadastro profissional não autorizado.");
  return { uid, nome: String(dados.nome ?? ""), email: String(dados.email ?? ""), cargo: dados.cargo, unidadeReferencia: dados.unidadeReferencia, registro: String(dados.registro ?? ""), nomeAgenda: String(dados.nomeAgenda ?? dados.nome ?? ""), ativo: dados.ativo === true, permissoes: dados.permissoes, versao: dados.versao };
}
export async function profissionalDoToken(token: DecodedIdToken, permissao?: Permissao): Promise<Profissional> {
  const snap = await adminDb.collection("profissionais").doc(token.uid).get();
  const p = interpretarProfissional(token.uid, snap.data());
  if (!p.ativo || token.profissional !== true || token.cargo !== p.cargo || token.unidadeReferencia !== p.unidadeReferencia || token.versaoProfissional !== p.versao) throw new ErroAcesso("Seu acesso profissional está inativo ou mudou. Entre novamente.");
  if (permissao && !permite(p, permissao)) throw new ErroAcesso("Sua função não tem permissão para essa ação.");
  return p;
}
export async function autorizar(request: Request, permissao?: Permissao) { return profissionalDoToken(await autenticar(request), permissao); }
export async function conferirNaTransacao(tx: Transaction, p: Profissional, permissao: Permissao) {
  const atual = interpretarProfissional(p.uid, (await tx.get(adminDb.collection("profissionais").doc(p.uid))).data());
  if (atual.versao !== p.versao || atual.cargo !== p.cargo || atual.nomeAgenda !== p.nomeAgenda || atual.unidadeReferencia !== p.unidadeReferencia || !permite(atual, permissao)) throw new ErroAcesso("A autorização mudou. Entre novamente.");
}
export async function autorizarPagina(cargo?: Cargo): Promise<Profissional> {
  const cookie = (await cookies()).get("sv-profissional")?.value;
  if (!cookie) throw new ErroAcesso("Entre na área profissional para continuar.", 401);
  let token: DecodedIdToken;
  try { token = await adminAuth.verifySessionCookie(cookie, true); } catch { throw new ErroAcesso("Sua sessão expirou. Entre novamente.", 401); }
  const p = await profissionalDoToken(token);
  if (cargo && p.cargo !== cargo) throw new ErroAcesso("Esta área pertence a outra função.");
  return p;
}
export function respostaErro(erro: unknown) {
  if (erro instanceof ErroAcesso) return NextResponse.json({ erro: erro.message }, { status: erro.status, headers: { "Cache-Control": "no-store" } });
  if (erro && typeof erro === "object" && "code" in erro && erro.code === 9 && erro instanceof Error && erro.message.includes("index")) return NextResponse.json({ erro: "A busca está sendo preparada no Firebase. Aguarde a conclusão dos índices e tente novamente." }, { status: 503, headers: { "Cache-Control": "no-store", "Retry-After": "30" } });
  console.error("Falha na operação profissional", erro instanceof Error ? erro.message : "Erro desconhecido");
  return NextResponse.json({ erro: "Não foi possível concluir. Confira a configuração e tente novamente." }, { status: 500 });
}
export function json(dados: unknown, status = 200) { return NextResponse.json(dados, { status, headers: { "Cache-Control": "private, no-store" } }); }
export async function corpo(request: Request): Promise<Record<string, unknown>> {
  try { const valor = await request.json(); if (!valor || typeof valor !== "object" || Array.isArray(valor)) throw new Error(); return valor; } catch { throw new ErroAcesso("Envie dados válidos.", 400); }
}
export function texto(dados: Record<string, unknown>, campo: string, max = 150, opcional = false): string {
  const valor = dados[campo]; if (opcional && (valor === undefined || valor === "")) return "";
  if (typeof valor !== "string" || !valor.trim() || valor.trim().length > max || /[\x00-\x1f]/.test(valor)) throw new ErroAcesso("Confira o campo: " + campo + ".", 400);
  return valor.trim();
}
export function identificador(dados: Record<string, unknown>, campo: string) { const id = texto(dados, campo, 128); if (!/^[a-zA-Z0-9_-]+$/.test(id)) throw new ErroAcesso("Identificador inválido.", 400); return id; }
