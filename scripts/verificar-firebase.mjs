import { mkdir, writeFile } from "node:fs/promises";
import { getSecurityRules } from "firebase-admin/security-rules";
import { conectar } from "./firebase-admin-local.mjs";
try {
  const { auth, db, projectId } = conectar();
  if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID !== projectId) throw new Error("Os IDs públicos e administrativos apontam para projetos diferentes.");
  await auth.listUsers(1);
  console.log("Firebase Authentication: conexão verificada.");
  const colecoes = await db.listCollections();
  console.log("Cloud Firestore: conexão verificada. Coleções existentes: " + colecoes.map(c => c.id).join(", "));
  try {
    const regras = await getSecurityRules().getFirestoreRuleset();
    await mkdir(".local/firebase", { recursive: true });
    for (const arquivo of regras.source) await writeFile(".local/firebase/firestore.rules.atual", arquivo.content, "utf8");
    console.log("Rules publicadas: cópia de referência salva em .local/firebase/firestore.rules.atual.");
  } catch (e) { console.log("Leitura das Rules publicadas indisponível para esta credencial: " + (e.code ?? e.name)); }
} catch (e) { console.error("Verificação do Firebase falhou: " + (e.code ?? e.message)); process.exitCode = 1; }
