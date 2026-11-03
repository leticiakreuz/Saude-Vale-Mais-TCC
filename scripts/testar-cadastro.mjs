// Somente fixtures próprias: não migra perfis reais e não envia mensagens.
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { conectar } from "./firebase-admin-local.mjs";
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc, terminate } from "firebase/firestore";
const { auth, db } = conectar(), base = process.env.SAUDE_VALE_TEST_URL ?? "http://127.0.0.1:3100";
if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(base)) throw new Error("Use a prévia local.");
const sufixo = Date.now().toString(36), email = "svqa-cadastro-" + sufixo + "@example.invalid", senha = randomBytes(20).toString("base64url") + "aA1!";
const dados = { nome:"Pessoa Fictícia QA Cadastro", cpf:"52998224725", telefone:"47999999999", dataNascimento:"1990-01-01", numeroSUS:"700000000000003", emailResponsavel:"", cep:"89010001", rua:"Rua 15 de Novembro", numero:"100", bairro:"Centro", cidade:"Blumenau", uf:"SC" };
let uid, app, webDb, webAuth;
async function pedido(rota, corpo, esperado, token) {
  const r = await fetch(base + rota, { method:corpo === undefined ? "GET" : "POST", headers:{ origin:base, "Content-Type":"application/json", ...(token ? { Authorization:"Bearer " + token } : {}) }, ...(corpo === undefined ? {} : { body:JSON.stringify(corpo) }) });
  const d = await r.json();
  assert.equal(r.status, esperado, JSON.stringify(d));
  return d;
}
try {
  await pedido("/api/cadastro", { email, senha, confirmarSenha:senha }, 400);
  await assert.rejects(auth.getUserByEmail(email), e => e.code === "auth/user-not-found");
  console.log("OK: criação inicial exige nome e CPF, além de e-mail e senha");

  await pedido("/api/endereco", { cep:"01001000" }, 400);
  const encontrado = await pedido("/api/endereco", dados, 200);
  assert.equal(encontrado.unidadeReferencia, "USF HEINZ SCHRADER - CENTRO");
  console.log("OK: consulta aceita Blumenau e recusa CEP de outro município");

  await pedido("/api/cadastro", { ...dados, email, senha, confirmarSenha:senha, cargo:"administracao", unidadeReferencia:"FORJADA", cadastroVersao:2 }, 201);
  const usuario = await auth.getUserByEmail(email); uid = usuario.uid;
  const perfil = (await db.collection("usuarios").doc(uid).get()).data();
  assert.equal(perfil.cadastroVersao, 1); assert.equal(perfil.unidadeReferencia, undefined); assert.equal(perfil.cargo, undefined); assert.equal(perfil.telefone, undefined); assert.equal(usuario.disabled, false);
  console.log("OK: conta criada com dados básicos, sem aceitar permissões ou UBS forjadas");

  app = initializeApp({ apiKey:process.env.NEXT_PUBLIC_FIREBASE_API_KEY, projectId:process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, authDomain:process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, appId:process.env.NEXT_PUBLIC_FIREBASE_APP_ID }, "qa-cadastro-" + sufixo);
  webAuth = getAuth(app); webDb = getFirestore(app);
  const credencial = await signInWithEmailAndPassword(webAuth, email, senha), token = await credencial.user.getIdToken();
  assert.equal((await pedido("/api/acesso", {}, 200, token)).destino, "/completar-cadastro");
  await assert.rejects(getDoc(doc(webDb, "usuarios", uid, "medicamentos", "teste")), e => e.code === "permission-denied");
  await pedido("/api/vacinacao/comprovante", {}, 403, token);
  console.log("OK: após login, perfil incompleto vai à conclusão e serviços permanecem bloqueados");

  await pedido("/api/perfil", {}, 400, token);
  await pedido("/api/perfil", { ...dados, cidade:"Gaspar" }, 400, token);
  await pedido("/api/perfil", { ...dados, cep:"01001000" }, 400, token);
  assert.equal((await pedido("/api/acesso", {}, 200, token)).destino, "/completar-cadastro");
  console.log("OK: pular campos ou informar endereço fora de Blumenau não conclui o perfil");

  await pedido("/api/perfil", { ...dados, uid:"outro", unidadeReferencia:"FORJADA" }, 200, token);
  const completo = (await db.collection("usuarios").doc(uid).get()).data();
  assert.equal(completo.cadastroVersao, 2); assert.equal(completo.unidadeReferencia, encontrado.unidadeReferencia); assert.equal(completo.uid, uid);
  assert.equal((await pedido("/api/acesso", {}, 200, token)).destino, "/dashboard");
  assert.equal((await getDoc(doc(webDb, "usuarios", uid, "medicamentos", "teste"))).exists(), false);
  await pedido("/api/perfil", { ...dados, dataNascimento:"1991-01-01" }, 400, token);
  console.log("OK: concluir os dados vincula a UBS e libera serviços; identidade já validada permanece fixa");
} finally {
  if (!uid) { try { uid = (await auth.getUserByEmail(email)).uid; } catch {} }
  if (webAuth) await signOut(webAuth).catch(() => {});
  if (webDb) await terminate(webDb).catch(() => {});
  if (app) await deleteApp(app).catch(() => {});
  if (uid) {
    const u = await auth.getUser(uid);
    if (u.email !== email || !email.startsWith("svqa-cadastro-")) throw new Error("Escopo de limpeza inválido.");
    await db.recursiveDelete(db.collection("usuarios").doc(uid));
    await auth.deleteUser(uid);
    console.log("Fixture de cadastro removida.");
  }
}
