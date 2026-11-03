import { randomBytes } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { autorizar, conferirNaTransacao, corpo, ErroAcesso, interpretarProfissional, json, respostaErro, texto } from "@/lib/profissionais/autorizacao";
import { cargoValido, LIMITES, permite, type Permissao } from "@/lib/profissionais/modelos";
import { vinculoRef } from "@/lib/profissionais/agendaRegras";
import { auditoria } from "@/lib/profissionais/agendamentos";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const p = await autorizar(request);
    if (!permite(p, "profissionais.gerenciar") && !permite(p, "agenda.unidade")) throw new ErroAcesso("Acesso não autorizado.");
    const docs = await adminDb.collection("profissionais").where("unidadeReferencia", "==", p.unidadeReferencia).limit(200).get();
    const equipe = docs.docs.map(d => interpretarProfissional(d.id, d.data()));
    return json({ profissionais: permite(p, "profissionais.gerenciar") ? equipe : equipe.filter(v => v.ativo && ["medico", "enfermagem", "odontologia"].includes(v.cargo)).map(v => ({ uid: v.uid, nome: v.nome, nomeAgenda: v.nomeAgenda, cargo: v.cargo, ativo: v.ativo })) });
  } catch (erro) { return respostaErro(erro); }
}
export async function POST(request: Request) {
  try {
    const p = await autorizar(request, "profissionais.gerenciar"), dados = await corpo(request);
    const cargo = dados.cargo;
    if (!cargoValido(cargo) || cargo === "administracao") throw new ErroAcesso("Administradores são provisionados pelo responsável técnico. Escolha uma função assistencial ou de recepção.", 400);
    const email = texto(dados, "email", 200).toLowerCase(), nome = texto(dados, "nome", 120), nomeAgenda = texto(dados, "nomeAgenda", 120);
    const registro = texto(dados, "registro", 60, cargo === "recepcao");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof dados.ativo !== "boolean") throw new ErroAcesso("Confira e-mail e status.", 400);
    if (!Array.isArray(dados.permissoes) || dados.permissoes.some(v => typeof v !== "string" || !LIMITES[cargo].includes(v as Permissao))) throw new ErroAcesso("Permissões incompatíveis com o cargo.", 400);
    const permissoes = [...new Set(dados.permissoes)] as Permissao[];
    if (cargo === "enfermagem" && permissoes.includes("receita.emitir") && dados.confirmarReceitaEnfermagem !== true) throw new ErroAcesso("Confirme a autorização específica de receitas demonstrativas para enfermagem.", 400);
    let conta, nova = false;
    try { conta = await adminAuth.getUserByEmail(email); }
    catch (erro) { if ((erro as { code?: string }).code !== "auth/user-not-found") throw erro; conta = await adminAuth.createUser({ email, displayName: nome, password: randomBytes(32).toString("base64url") }); nova = true; }
    if (conta.uid === p.uid) throw new ErroAcesso("Não é permitido alterar sua própria autorização.");
    const uid = conta.uid, ref = adminDb.collection("profissionais").doc(uid);
    const versao = await adminDb.runTransaction(async tx => {
      await conferirNaTransacao(tx, p, "profissionais.gerenciar");
      const anterior = await tx.get(ref), atual = anterior.data();
      if (atual && (atual.unidadeReferencia !== p.unidadeReferencia || atual.cargo === "administracao")) throw new ErroAcesso("Você não pode alterar profissionais de outra UBS ou administradores.");
      if (atual && atual.nomeAgenda !== nomeAgenda) throw new ErroAcesso("O nome usado na agenda é permanente para preservar o histórico. Mantenha o nome de agenda cadastrado.", 400);
      const vinculo = await tx.get(vinculoRef(p.unidadeReferencia, nomeAgenda));
      if (vinculo.exists && vinculo.data()?.uid !== uid) throw new ErroAcesso("Este nome de agenda já está vinculado a outro profissional.", 409);
      const proxima = Number(atual?.versao ?? 0) + 1;
      tx.set(ref, { uid, nome, email, cargo, nomeAgenda, registro, ativo: dados.ativo, permissoes, unidadeReferencia: p.unidadeReferencia, versao: proxima, atualizadoPor: p.uid, atualizadoEm: FieldValue.serverTimestamp(), ...(anterior.exists ? {} : { criadoEm: FieldValue.serverTimestamp() }) });
      tx.set(vinculoRef(p.unidadeReferencia, nomeAgenda), { uid, unidadeReferencia: p.unidadeReferencia, nomeAgenda });
      auditoria(tx, p, anterior.exists ? "atualizar-profissional" : "cadastrar-profissional", ref.path, atual ? { cargo: atual.cargo, ativo: atual.ativo, permissoes: atual.permissoes } : null, { cargo, ativo: dados.ativo, permissoes });
      return proxima;
    });
    // A alteração de versão invalida imediatamente sessões antigas, inclusive se a sincronização de claims falhar.
    await adminAuth.setCustomUserClaims(uid, { ...conta.customClaims, profissional: true, cargo, unidadeReferencia: p.unidadeReferencia, versaoProfissional: versao });
    if (!dados.ativo) await adminAuth.revokeRefreshTokens(uid);
    const linkAtivacao = nova ? await adminAuth.generatePasswordResetLink(email) : undefined;
    return json({ mensagem: "Autorização salva. O profissional precisa entrar novamente.", uid, ...(linkAtivacao ? { linkAtivacao } : {}) });
  } catch (erro) { return respostaErro(erro); }
}
