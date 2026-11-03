// Execute apenas no computador do responsável técnico, com credenciais do Firebase Admin.
import { createHash } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { argumentos, conectar } from "./firebase-admin-local.mjs";
try {
  const { email, unidade } = argumentos();
  if (!email || !unidade) throw new Error('Uso: npm run provisionar:admin -- --email "admin@exemplo.com" --unidade "Nome exato da UBS"');
  const { auth, db, projectId } = conectar();
  const conta = await auth.getUserByEmail(email);
  const ref = db.collection("profissionais").doc(conta.uid);
  const nomeAgenda = conta.displayName ?? "Administração da UBS";
  const permissoes = ["profissionais.gerenciar", "escalas.gerenciar", "servicos.gerenciar", "relatorios.ler"];
  const versao = await db.runTransaction(async tx => {
    const atual = await tx.get(ref);
    if (atual.exists && atual.data().unidadeReferencia !== unidade) throw new Error("O vínculo existente pertence a outra unidade. A transferência exige análise do histórico.");
    const versao = Number(atual.data()?.versao ?? 0) + 1;
    tx.set(ref, { uid: conta.uid, nome: conta.displayName ?? "Administrador da UBS", email: conta.email, cargo: "administracao", unidadeReferencia: unidade, registro: "", nomeAgenda, ativo: true, permissoes, versao, atualizadoEm: FieldValue.serverTimestamp() });
    const chave = createHash("sha256").update(JSON.stringify([unidade, nomeAgenda])).digest("hex");
    tx.set(db.collection("vinculosAgenda").doc(chave), { uid: conta.uid, unidadeReferencia: unidade, nomeAgenda });
    tx.create(db.collection("auditoria").doc(), { autorUid: "provisionamento-local", unidadeReferencia: unidade, acao: "provisionar-administrador", alvo: ref.path, criadoEm: FieldValue.serverTimestamp() });
    return versao;
  });
  await auth.setCustomUserClaims(conta.uid, { ...conta.customClaims, profissional: true, cargo: "administracao", unidadeReferencia: unidade, versaoProfissional: versao });
  console.log("Administrador provisionado no projeto " + projectId + ". Entre novamente no Saúde Vale+.");
} catch (erro) { console.error(erro.message); process.exitCode = 1; }
