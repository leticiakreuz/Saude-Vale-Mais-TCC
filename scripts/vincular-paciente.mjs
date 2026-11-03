// O vínculo territorial não é editável pelo paciente no navegador.
import { FieldValue } from "firebase-admin/firestore";
import { argumentos, conectar } from "./firebase-admin-local.mjs";
try {
  const { email, unidade } = argumentos();
  if (!email || !unidade) throw new Error('Uso: npm run vincular:paciente -- --email "paciente@exemplo.com" --unidade "Nome exato da UBS"');
  const { auth, db } = conectar(), conta = await auth.getUserByEmail(email);
  const ref = db.collection("usuarios").doc(conta.uid);
  await db.runTransaction(async tx => {
    const perfil = await tx.get(ref), controle = await tx.get(ref.collection("controleAgendamento").doc("ativo"));
    if (!perfil.exists) throw new Error("Conclua primeiro o cadastro do paciente.");
    if (controle.data()?.agendamentoId) throw new Error("Confira e encerre o agendamento ativo antes de transferir a UBS do paciente.");
    tx.update(ref, { unidade: unidade.trim(), unidadeReferencia: unidade.trim(), perfilAtualizadoEm: FieldValue.serverTimestamp() });
    tx.create(db.collection("auditoria").doc(), { autorUid: "vinculo-local", unidadeReferencia: unidade.trim(), acao: "vincular-paciente", alvo: ref.path, antes: { unidadeReferencia: perfil.data().unidadeReferencia ?? null }, depois: { unidadeReferencia: unidade.trim() }, criadoEm: FieldValue.serverTimestamp() });
  });
  console.log("Vínculo do paciente atualizado.");
} catch (erro) { console.error(erro.message); process.exitCode = 1; }
