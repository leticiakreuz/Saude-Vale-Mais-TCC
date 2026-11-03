// Teste explícito de integração: cria somente fixtures identificadas e as remove no finally.
import assert from "node:assert/strict";
import { randomBytes, createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { initializeApp as appWeb, deleteApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, updateDoc, terminate } from "firebase/firestore";
import { conectar } from "./firebase-admin-local.mjs";
const { auth, db, projectId } = conectar();
if (projectId !== process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) throw new Error("Projetos divergentes.");
const run = Date.now().toString(36), prefixo = "svqa_" + run + "_", unidade = "UBS QA " + run;
const hash = (...partes) => createHash("sha256").update(JSON.stringify(partes)).digest("hex");
const base = process.env.SAUDE_VALE_TEST_URL ?? "http://127.0.0.1:3100";
if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(base)) throw new Error("Use somente um servidor local para o teste.");
const criados = [], apps = [], resultados = [], contas = {};
const configWeb = { apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY, projectId, authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID };
const permissoes = {
  administracao: ["profissionais.gerenciar", "escalas.gerenciar", "servicos.gerenciar", "relatorios.ler"],
  medico: ["agenda.propria", "atendimento.registrar", "receita.emitir"],
  enfermagem: ["agenda.propria", "atendimento.registrar", "vacina.ler", "vacina.escrever"],
  odontologia: ["agenda.propria", "atendimento.registrar", "receita.emitir"],
  recepcao: ["agenda.unidade", "agenda.gerenciar", "atendimento.registrar", "pacientes.buscar"],
};
const hoje = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const data = new Date(hoje + "T12:00:00Z");
do { data.setUTCDate(data.getUTCDate() + 1); } while ([0, 6].includes(data.getUTCDay()));
const dia = data.toISOString().slice(0, 10);
async function teste(nome, executar) {
  try { await executar(); resultados.push({ nome, passou: true }); console.log("OK: " + nome); }
  catch (e) { resultados.push({ nome, passou: false, erro: e.message }); console.error("FALHOU: " + nome + " — " + e.message); throw e; }
}
async function request(conta, caminho, dados, esperado = 200) {
  const resposta = await fetch(base + caminho, { method: dados ? "POST" : "GET", headers: { Authorization: "Bearer " + conta.token, ...(dados ? { "Content-Type": "application/json" } : {}) }, ...(dados ? { body: JSON.stringify(dados) } : {}) });
  const corpo = await resposta.json();
  assert.equal(resposta.status, esperado, caminho + ": " + (corpo.erro ?? resposta.status));
  return { dados: corpo, cookie: resposta.headers.get("set-cookie")?.split(";")[0] };
}
async function criar(nome, cargo) {
  const uid = prefixo + nome, email = "svqa-" + run + "-" + nome + "@example.invalid", password = randomBytes(24).toString("base64url") + "aA1!";
  await auth.createUser({ uid, email, password, displayName: "QA " + nome }); criados.push(uid);
  const perfil = { uid, nome: "QA Paciente " + run + " " + nome, email, unidadeReferencia: unidade, unidade, demonstrativo: true, cadastroVersao: 2, cpf: "52998224725", telefone: "47999999999", dataNascimento: "1990-01-01", numeroSUS: "700000000000003", cep: "89010100", rua: "Rua XV de Novembro", numero: "100", bairro: "Centro", cidade: "Blumenau", uf: "SC", emailResponsavel: "" };
  await db.collection("usuarios").doc(uid).set(perfil);
  let nomeAgenda = "QA " + nome + " " + run;
  if (cargo) {
    await db.collection("profissionais").doc(uid).set({ uid, nome: "QA " + nome, nomeAgenda, email, registro: "DEMO", cargo, ativo: true, unidadeReferencia: unidade, versao: 1, permissoes: permissoes[cargo], demonstrativo: true });
    await db.collection("vinculosAgenda").doc(hash(unidade, nomeAgenda)).set({ uid, nomeAgenda, unidadeReferencia: unidade });
    await auth.setCustomUserClaims(uid, { profissional: true, cargo, unidadeReferencia: unidade, versaoProfissional: 1 });
  }
  const app = appWeb(configWeb, uid), webAuth = getAuth(app), webDb = getFirestore(app); apps.push({ app, webAuth, webDb });
  const credencial = await signInWithEmailAndPassword(webAuth, email, password);
  return { uid, email, nomeAgenda, app, webAuth, webDb, token: await credencial.user.getIdToken(true) };
}
try {
  await mkdir(".local/firebase", { recursive: true });
  for (const cargo of Object.keys(permissoes)) contas[cargo] = await criar(cargo, cargo);
  contas.paciente = await criar("paciente"); contas.paciente2 = await criar("paciente2");
  await writeFile(".local/firebase/ultima-integracao.json", JSON.stringify({ run, unidade, uids: criados, iniciadoEm: new Date().toISOString() }, null, 2));
  await teste("login direciona os cinco cargos e o paciente", async () => {
    for (const [nome, conta] of Object.entries(contas)) {
      const r = await request(conta, "/api/acesso", {});
      assert.equal(r.dados.destino, nome.startsWith("paciente") ? "/dashboard" : "/profissional/" + nome);
      if (r.cookie) conta.cookie = r.cookie;
    }
  });
  await teste("cada página aceita a sessão de sua função", async () => {
    for (const cargo of Object.keys(permissoes)) {
      const r = await fetch(base + "/profissional/" + cargo, { headers: { Cookie: contas[cargo].cookie } });
      const html = await r.text(); assert.equal(r.status, 200); assert.ok(!html.includes("Acesso profissional protegido"), cargo);
    }
    const html = await (await fetch(base + "/profissional/medico", { headers: { Cookie: contas.recepcao.cookie } })).text();
    assert.ok(html.includes("Esta área pertence a outra função"));
  });
  await teste("administração cria escalas por cargo", async () => {
    for (const [cargo, servico] of [["medico", "Consulta médica"], ["enfermagem", "Atendimento de enfermagem"], ["odontologia", "Odontologia"]]) await request(contas.administracao, "/api/profissional/escalas", { profissionalId: contas[cargo].uid, dia, horarios: ["08:30", "10:30"], bloqueios: [], servicos: [servico], ativo: true });
  });
  await teste("busca da recepção se restringe à UBS de teste", async () => {
    const r = await request(contas.recepcao, "/api/profissional/pacientes?q=" + encodeURIComponent("QA Paciente " + run));
    assert.equal(r.dados.pacientes.length, 7); assert.ok(r.dados.pacientes.every(p => p.uid.startsWith(prefixo)));
  });
  let consulta, vencedor, segundo;
  const reserva = pacienteId => ({ acao: "reservar", pacienteId, profissionalId: contas.medico.uid, dia, horario: "08:30", servico: "Consulta médica" });
  await teste("reservas concorrentes no Firestore não duplicam o horário", async () => {
    const candidatos = [contas.paciente, contas.paciente2];
    const respostas = await Promise.all(candidatos.map(async c => { const r = await fetch(base + "/api/profissional/agendamentos", { method: "POST", headers: { Authorization: "Bearer " + contas.recepcao.token, "Content-Type": "application/json" }, body: JSON.stringify(reserva(c.uid)) }); return { status: r.status, dados: await r.json(), conta: c }; }));
    assert.deepEqual(respostas.map(r => r.status).sort(), [200, 409]);
    const sucesso = respostas.find(r => r.status === 200); consulta = sucesso.dados.agendamentoId; vencedor = sucesso.conta; segundo = candidatos.find(c => c.uid !== vencedor.uid);
  });
  await teste("remarcação libera a reserva anterior e reserva a nova", async () => {
    await request(contas.recepcao, "/api/profissional/agendamentos", { ...reserva(vencedor.uid), acao: "remarcar", agendamentoId: consulta, statusEsperado: "agendado", horario: "10:30" });
    const anterior = await db.collection("horariosReservados").doc(hash(unidade, contas.medico.nomeAgenda, dia, "08:30")).get();
    const novo = await db.collection("horariosReservados").doc(hash(unidade, contas.medico.nomeAgenda, dia, "10:30")).get();
    assert.equal(anterior.data().status, "cancelado"); assert.equal(novo.data().agendamentoId, consulta);
  });
  await teste("conflito na remarcação preserva o horário anterior", async () => {
    await request(contas.recepcao, "/api/profissional/agendamentos", reserva(segundo.uid));
    await request(contas.recepcao, "/api/profissional/agendamentos", { ...reserva(vencedor.uid), acao: "remarcar", agendamentoId: consulta, statusEsperado: "agendado", horario: "08:30" }, 409);
    assert.equal((await db.collection("usuarios").doc(vencedor.uid).collection("agendamentos").doc(consulta).get()).data().horario, "10:30");
  });
  await teste("médico confirma a própria agenda; dentista é recusado", async () => {
    const dados = { acao: "confirmar", pacienteId: vencedor.uid, agendamentoId: consulta, statusEsperado: "agendado" };
    await request(contas.odontologia, "/api/profissional/agendamentos", dados, 403);
    await request(contas.medico, "/api/profissional/agendamentos", dados);
    await request(contas.medico, "/api/profissional/agendamentos", { ...dados, acao: "presente", statusEsperado: "confirmado" }, 400);
  });
  await teste("permissões da recepção e administração não concedem acesso clínico", async () => {
    await request(contas.recepcao, "/api/profissional/registros?tipo=vacinacao", undefined, 403);
    await request(contas.recepcao, "/api/profissional/registros", { tipo: "medicamento" }, 403);
    await request(contas.administracao, "/api/profissional/agenda?dia=" + dia, undefined, 403);
    await request(contas.paciente, "/api/profissional/equipe", undefined, 403);
  });
  await teste("vacina e medicamento se refletem nas coleções do paciente", async () => {
    const pacienteRef = db.collection("usuarios").doc(vencedor.uid);
    for (const cargo of ["medico", "enfermagem"]) await pacienteRef.collection("agendamentos").doc("qa_" + cargo).set({ unidadeReferencia: unidade, medico: contas[cargo].nomeAgenda, dia: hoje, horario: "07:30", status: "concluido", userId: vencedor.uid, servico: cargo === "medico" ? "Consulta médica" : "Atendimento de enfermagem", periodo: "Manhã" });
    await request(contas.medico, "/api/profissional/registros", { tipo: "medicamento", pacienteId: vencedor.uid, agendamentoId: "qa_medico", requisicaoId: "qa_receita", nome: "Medicamento fictício QA", dosagem: "Demonstração", quantidade: "1", frequencia: "Demonstração", status: "Disponível", proximaRetirada: "" }, 201);
    await request(contas.enfermagem, "/api/profissional/registros", { tipo: "vacina", pacienteId: vencedor.uid, agendamentoId: "qa_enfermagem", codigo: "influenza", dose: "Dose QA", dataAplicacao: hoje, lote: "LOTE-FICTICIO", fase: "Adulto", periodoGestacao: "" }, 201);
    const vacinas = await pacienteRef.collection("vacinacao").get();
    assert.equal(vacinas.size, 1);
    assert.equal((await getDoc(doc(vencedor.webDb, "usuarios", vencedor.uid, "vacinacao", vacinas.docs[0].id))).data().status, "Aplicada");
    assert.equal((await getDoc(doc(vencedor.webDb, "usuarios", vencedor.uid, "medicamentos", "qa_receita"))).data().demonstrativo, true);
    assert.equal((await getDoc(doc(vencedor.webDb, "usuarios", vencedor.uid, "medicamentos", "qa_receita"))).data().unidadeRetirada, unidade);
    assert.equal((await getDoc(doc(vencedor.webDb, "usuarios", vencedor.uid, "medicamentos", "qa_receita"))).data().profissionalNome, "QA medico");
  });
  await teste("Rules publicadas permitem leitura própria e bloqueiam escrita e perfil alheio", async () => {
    await getDoc(doc(vencedor.webDb, "usuarios", vencedor.uid));
    await assert.rejects(setDoc(doc(vencedor.webDb, "usuarios", vencedor.uid, "vacinacao", "invasao"), { vacina: "QA" }), e => e.code === "permission-denied");
    await assert.rejects(updateDoc(doc(vencedor.webDb, "usuarios", vencedor.uid, "agendamentos", consulta), { status: "concluido" }), e => e.code === "permission-denied");
    await assert.rejects(getDoc(doc(vencedor.webDb, "usuarios", segundo.uid)), e => e.code === "permission-denied");
    await assert.rejects(updateDoc(doc(vencedor.webDb, "usuarios", vencedor.uid), { cargo: "administracao" }), e => e.code === "permission-denied");
    await assert.rejects(updateDoc(doc(vencedor.webDb, "usuarios", vencedor.uid), { nome: "" }), e => e.code === "permission-denied");
    await assert.rejects(updateDoc(doc(vencedor.webDb, "usuarios", vencedor.uid), { unidadeReferencia: "UBS forjada", cadastroVersao: 2 }), e => e.code === "permission-denied");
    await updateDoc(doc(vencedor.webDb, "usuarios", vencedor.uid), { gestanteAtual: false });
  });
  await teste("relatórios retornam apenas contagens da unidade", async () => {
    const r = await request(contas.administracao, "/api/profissional/relatorios?inicio=" + dia + "&fim=" + dia);
    assert.equal(r.dados.contagens.agendado, 1); assert.equal(r.dados.contagens.confirmado, 1);
    assert.ok(!r.dados.pacientes);
  });
  await teste("histórico administrativo projeta campos mínimos e respeita a UBS", async () => {
    await db.collection("usuarios").doc(segundo.uid).collection("agendamentos").doc("qa_outra_ubs").set({ dia, horario: "09:00", medico: "Profissional de outra UBS", servico: "Consulta médica", status: "agendado", unidadeReferencia: unidade + " Outra", userId: segundo.uid, anotacaoClinica: "FICTÍCIO: não retornar" });
    const r = await request(contas.administracao, "/api/profissional/historico?inicio=" + dia + "&fim=" + dia);
    assert.equal(r.dados.atendimentos.length, 2);
    for (const item of r.dados.atendimentos) {
      assert.deepEqual(Object.keys(item).sort(), ["id", "dia", "horario", "profissional", "servico", "status"].sort());
      assert.notEqual(item.profissional, "Profissional de outra UBS");
    }
    await request(contas.recepcao, "/api/profissional/historico?inicio=" + dia + "&fim=" + dia, undefined, 403);
  });
  await teste("diretório consulta outra UBS sem expor e-mail, UID ou permissões", async () => {
    const outraUnidade = unidade + " Outra";
    await db.collection("profissionais").doc(contas.odontologia.uid).update({ unidadeReferencia: outraUnidade });
    const r = await request(contas.administracao, "/api/profissional/funcionarios?unidade=" + encodeURIComponent(outraUnidade));
    assert.ok(r.dados.unidades.includes(outraUnidade));
    assert.equal(r.dados.funcionarios.length, 1);
    assert.equal(r.dados.funcionarios[0].unidadeReferencia, outraUnidade);
    assert.deepEqual(Object.keys(r.dados.funcionarios[0]).sort(), ["id", "nome", "cargo", "registro", "ativo", "unidadeReferencia"].sort());
    assert.notEqual(r.dados.funcionarios[0].id, contas.odontologia.uid);
    const propria = await request(contas.administracao, "/api/profissional/equipe");
    assert.ok(propria.dados.profissionais.every(p => p.unidadeReferencia === unidade));
    await request(contas.administracao, "/api/profissional/equipe", { email: contas.odontologia.email, nome: "Tentativa QA", nomeAgenda: contas.odontologia.nomeAgenda, registro: "DEMO", cargo: "odontologia", ativo: true, permissoes: ["agenda.propria"] }, 403);
    await request(contas.recepcao, "/api/profissional/funcionarios", undefined, 403);
    await request(contas.paciente, "/api/profissional/funcionarios", undefined, 403);
  });
  await teste("revogação do vínculo profissional bloqueia token ainda válido", async () => {
    await db.collection("profissionais").doc(contas.medico.uid).update({ ativo: false, versao: 2 });
    await request(contas.medico, "/api/profissional/agenda?dia=" + dia, undefined, 403);
  });
} catch (e) { console.error("Integração interrompida: " + e.message); process.exitCode = 1; }
finally {
  // Todos os IDs foram criados nesta execução. Nenhum usuário existente é selecionado.
  for (const c of apps) { await signOut(c.webAuth).catch(() => {}); await terminate(c.webDb).catch(() => {}); await deleteApp(c.app).catch(() => {}); }
  for (const colecao of ["auditoria", "escalas", "vinculosAgenda", "horariosReservados", "servicosAtendimento"]) {
    const docs = await db.collection(colecao).where("unidadeReferencia", "==", unidade).get();
    if (!unidade.startsWith("UBS QA ") || docs.docs.some(d => d.data().unidadeReferencia !== unidade)) throw new Error("Escopo de limpeza inválido.");
    if (docs.size) { const batch = db.batch(); docs.docs.forEach(d => batch.delete(d.ref)); await batch.commit(); }
  }
  for (const uid of criados) {
    if (!uid.startsWith(prefixo)) throw new Error("UID fora do teste.");
    await db.recursiveDelete(db.collection("usuarios").doc(uid));
    await db.collection("profissionais").doc(uid).delete();
    await auth.deleteUser(uid);
  }
  await writeFile(".local/firebase/ultima-integracao.json", JSON.stringify({ run, unidade, resultados, limpezaConcluida: true, concluidoEm: new Date().toISOString() }, null, 2));
  console.log("Fixtures removidas: " + criados.length + " contas. Conta administrativa do usuário preservada.");
}
