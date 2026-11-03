const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const { createRequire } = require("node:module");
const raiz = path.resolve(__dirname, "..");
const requireReal = createRequire(path.join(raiz, "package.json"));

// Simula uma transação serializável; não substitui o Emulator Suite.
function ambiente() {
  const documentos = new Map();
  let sequencia = 0, fila = Promise.resolve();
  const clone = valor => valor === undefined ? undefined : structuredClone(valor);
  function ref(caminho) {
    const partes = caminho.split("/");
    return { path: caminho, id: partes.at(-1), parent: { parent: partes.length > 2 ? ref(partes.slice(0, -2).join("/")) : null }, collection: nome => colecao(caminho + "/" + nome), get: async () => snapshot(caminho) };
  }
  function snapshot(caminho) { const valor = clone(documentos.get(caminho)); return { exists: valor !== undefined, id: caminho.split("/").at(-1), ref: ref(caminho), data: () => clone(valor) }; }
  function colecao(caminho, filtros = []) {
    return { path: caminho, doc: id => ref(caminho + "/" + (id ?? "auto" + ++sequencia)),
      where: (campo, op, valor) => colecao(caminho, [...filtros, [campo, op, valor]]),
      limit: () => colecao(caminho, filtros),
      get: async () => { const docs = [...documentos.keys()].filter(k => k.startsWith(caminho + "/") && k.split("/").length === caminho.split("/").length + 1).map(snapshot).filter(d => filtros.every(([c, op, v]) => op === "==" ? d.data()[c] === v : op === ">=" ? d.data()[c] >= v : d.data()[c] <= v)); return { docs, size: docs.length }; },
    };
  }
  const db = {
    collection: colecao,
    runTransaction: callback => {
      const trabalho = fila.then(async () => {
        const operacoes = []; let escrevendo = false;
        const tx = {
          get: async alvo => { assert.equal(escrevendo, false, "Todas as leituras devem preceder as gravações no Firestore."); return alvo.get(); },
          set: (alvo, valor, opcoes) => { escrevendo = true; operacoes.push(() => documentos.set(alvo.path, clone(opcoes?.merge ? { ...documentos.get(alvo.path), ...valor } : valor))); },
          update: (alvo, valor) => { escrevendo = true; operacoes.push(() => { assert.ok(documentos.has(alvo.path)); documentos.set(alvo.path, { ...documentos.get(alvo.path), ...clone(valor) }); }); },
          create: (alvo, valor) => { escrevendo = true; operacoes.push(() => { assert.ok(!documentos.has(alvo.path)); documentos.set(alvo.path, clone(valor)); }); },
        };
        const resultado = await callback(tx);
        operacoes.forEach(op => op());
        return resultado;
      });
      fila = trabalho.catch(() => {});
      return trabalho;
    },
  };
  const tokens = new Map();
  const auth = { verifyIdToken: async token => { if (!tokens.has(token)) throw new Error("invalid token"); return tokens.get(token); }, verifySessionCookie: async token => { if (!tokens.has(token)) throw new Error("invalid session"); return tokens.get(token); } };
  const cache = new Map();
  function carregar(arquivo) {
    const absoluto = path.resolve(raiz, arquivo);
    if (cache.has(absoluto)) return cache.get(absoluto).exports;
    const modulo = { exports: {} }; cache.set(absoluto, modulo);
    const codigo = ts.transpileModule(fs.readFileSync(absoluto, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
    const importar = nome => {
      if (nome === "server-only") return {};
      if (nome === "@/lib/firebaseAdmin") return { adminDb: db, adminAuth: auth };
      if (nome === "firebase-admin/firestore") return { FieldValue: { serverTimestamp: () => "server-time" } };
      if (nome === "next/headers") return { cookies: async () => ({ get: () => ({ value: "sessao" }) }) };
      if (nome.startsWith("@/") || nome.startsWith(".")) { const alvo = nome.startsWith("@/") ? path.join(raiz, nome.slice(2)) : path.resolve(path.dirname(absoluto), nome); const extensao = [".ts", ".tsx"].find(e => fs.existsSync(alvo + e)); return carregar(path.relative(raiz, alvo + (extensao ?? ""))); }
      return requireReal(nome);
    };
    new vm.Script("(function(require,module,exports){" + codigo + "\n})", { filename: absoluto }).runInThisContext()(importar, modulo, modulo.exports);
    return modulo.exports;
  }
  const modelos = carregar("lib/profissionais/modelos.ts"), regras = carregar("lib/profissionais/agendaRegras.ts"), datas = carregar("lib/profissionais/datas.ts");
  const unidade = "UBS Acadêmica Vale";
  function profissional(uid, cargo, nomeAgenda) {
    const p = { uid, nome: uid, email: uid + "@saudevale.example", nomeAgenda, registro: "DEMO", unidadeReferencia: unidade, ativo: true, cargo, permissoes: [...modelos.PADRAO[cargo]], versao: 1 };
    documentos.set("profissionais/" + uid, structuredClone(p));
    documentos.set("vinculosAgenda/" + regras.chave(unidade, nomeAgenda), { uid, unidadeReferencia: unidade, nomeAgenda });
    tokens.set(uid, { uid, profissional: true, cargo, unidadeReferencia: unidade, versaoProfissional: 1, auth_time: Date.now() / 1000 });
    return p;
  }
  const recepcao = profissional("recepcao", "recepcao", "Recepção Demonstração");
  const medico = profissional("medico", "medico", "Dr. Rafael Martins");
  const dentista = profissional("dentista", "odontologia", "Dra. Camila Souza");
  const enfermagem = profissional("enfermagem", "enfermagem", "Enfermagem Demonstração");
  const admin = profissional("admin", "administracao", "Administração Demonstração");
  documentos.set("usuarios/paciente1", { nome: "Paciente Demonstração 1", unidadeReferencia: unidade });
  documentos.set("usuarios/paciente2", { nome: "Paciente Demonstração 2", unidadeReferencia: unidade });
  const data = new Date(datas.hojeBrasil() + "T12:00:00Z");
  do { data.setUTCDate(data.getUTCDate() + 1); } while ([0, 6].includes(data.getUTCDay()));
  const dia = data.toISOString().slice(0, 10);
  const alterar = carregar("lib/profissionais/agendamentos.ts").alterarAgendamento;
  const pedido = (extra = {}) => ({ acao: "reservar", pacienteId: "paciente1", profissionalId: "medico", dia, horario: "08:30", servico: "Consulta médica", ...extra });
  return { documentos, carregar, tokens, modelos, regras, datas, recepcao, medico, dentista, enfermagem, admin, alterar, pedido, dia };
}

test("Datas são validadas no fuso brasileiro, rejeitando fins de semana e datas inexistentes", () => {
  const a = ambiente();
  assert.equal(a.datas.hojeBrasil(new Date("2026-11-03T01:00:00Z")), "2026-11-02");
  assert.equal(a.datas.dataAgendavel("2026-11-03", "2026-11-02"), true);
  assert.equal(a.datas.dataAgendavel("2026-11-07", "2026-11-02"), false);
  assert.equal(a.datas.dataAgendavel("2026-11-23", "2026-11-02"), false);
  assert.equal(a.datas.dataReal("2026-02-30"), false);
});
test("Paciente não ganha acesso profissional com cargo falsificado no perfil", async () => {
  const a = ambiente(); a.tokens.set("paciente", { uid: "paciente1", cargo: "administracao" });
  a.documentos.set("usuarios/paciente1", { cargo: "administracao", permissoes: ["profissionais.gerenciar"] });
  await assert.rejects(a.carregar("lib/profissionais/autorizacao.ts").autorizar(new Request("http://localhost", { headers: { Authorization: "Bearer paciente" } })), /não autorizado/);
});
test("Claims divergentes, profissional inativo e sessão de outra função são recusados", async () => {
  const a = ambiente(), auth = a.carregar("lib/profissionais/autorizacao.ts");
  await assert.rejects(auth.profissionalDoToken({ ...a.tokens.get("medico"), unidadeReferencia: "Outra UBS" }), /inativo ou mudou/);
  a.documentos.get("profissionais/medico").ativo = false;
  await assert.rejects(auth.profissionalDoToken(a.tokens.get("medico")), /inativo ou mudou/);
  a.tokens.set("sessao", a.tokens.get("recepcao"));
  await assert.rejects(auth.autorizarPagina("medico"), /outra função/);
});
test("Recepção não emite receitas nem consulta vacinas; administração não tem acesso clínico", async () => {
  const a = ambiente(), auth = a.carregar("lib/profissionais/autorizacao.ts");
  for (const permissao of ["receita.emitir", "vacina.ler", "profissionais.gerenciar"]) await assert.rejects(auth.profissionalDoToken(a.tokens.get("recepcao"), permissao), /não tem permissão/);
  assert.equal(a.modelos.permite(a.admin, "vacina.ler"), false);
  assert.equal(a.modelos.permite(a.enfermagem, "receita.emitir"), false);
  const rota = a.carregar("app/api/profissional/registros/route.ts");
  const r = await rota.POST(new Request("http://localhost", { method: "POST", headers: { Authorization: "Bearer recepcao", "Content-Type": "application/json" }, body: JSON.stringify({ tipo: "medicamento" }) }));
  assert.equal(r.status, 403);
});
test("Duas reservas concorrentes para o mesmo horário produzem uma única consulta", async () => {
  const a = ambiente();
  const resultados = await Promise.allSettled([a.alterar(a.recepcao, a.pedido()), a.alterar(a.recepcao, a.pedido({ pacienteId: "paciente2" }))]);
  assert.equal(resultados.filter(r => r.status === "fulfilled").length, 1);
  assert.equal([...a.documentos].filter(([k]) => /^usuarios\/[^/]+\/agendamentos\/[^/]+$/.test(k)).length, 1);
  assert.equal([...a.documentos].filter(([k]) => k.startsWith("auditoria/")).length, 1);
});
test("Uma consulta ativa impede uma segunda reserva para o mesmo paciente", async () => {
  const a = ambiente(); await a.alterar(a.recepcao, a.pedido());
  await assert.rejects(a.alterar(a.recepcao, a.pedido({ horario: "10:30" })), /consulta ativa/);
});
test("Remarcação libera o horário anterior e mantém a consulta e o controle vinculados", async () => {
  const a = ambiente(), criada = await a.alterar(a.recepcao, a.pedido());
  await a.alterar(a.recepcao, a.pedido({ acao: "remarcar", agendamentoId: criada.agendamentoId, statusEsperado: "agendado", horario: "10:30" }));
  const anterior = a.regras.chave(a.recepcao.unidadeReferencia, a.medico.nomeAgenda, a.dia, "08:30"), nova = a.regras.chave(a.recepcao.unidadeReferencia, a.medico.nomeAgenda, a.dia, "10:30");
  assert.equal(a.documentos.get("horariosReservados/" + anterior).status, "cancelado");
  assert.equal(a.documentos.get("horariosReservados/" + nova).status, "reservado");
  assert.equal(a.documentos.get("usuarios/paciente1/agendamentos/" + criada.agendamentoId).reservaId, nova);
  assert.equal(a.documentos.get("usuarios/paciente1/controleAgendamento/ativo").agendamentoId, criada.agendamentoId);
});
test("Falha na remarcação por conflito preserva integralmente o agendamento anterior", async () => {
  const a = ambiente(), criada = await a.alterar(a.recepcao, a.pedido());
  await a.alterar(a.recepcao, a.pedido({ pacienteId: "paciente2", horario: "10:30" }));
  const antes = structuredClone([...a.documentos]);
  await assert.rejects(a.alterar(a.recepcao, a.pedido({ acao: "remarcar", agendamentoId: criada.agendamentoId, statusEsperado: "agendado", horario: "10:30" })), /reservado/);
  assert.deepEqual([...a.documentos], antes);
});
test("Outra UBS, escala bloqueada e profissional inativo não podem receber reservas", async () => {
  const a = ambiente();
  a.documentos.get("usuarios/paciente1").unidadeReferencia = "Outra UBS";
  await assert.rejects(a.alterar(a.recepcao, a.pedido()), /não vinculado/);
  a.documentos.get("usuarios/paciente1").unidadeReferencia = a.recepcao.unidadeReferencia;
  a.documentos.set("escalas/" + a.regras.chave(a.recepcao.unidadeReferencia, a.medico.nomeAgenda, a.dia), { horarios: ["08:30"], bloqueios: ["08:30"], servicos: ["Consulta médica"], ativo: true });
  await assert.rejects(a.alterar(a.recepcao, a.pedido()), /bloqueado/);
  a.documentos.delete("escalas/" + a.regras.chave(a.recepcao.unidadeReferencia, a.medico.nomeAgenda, a.dia));
  a.documentos.get("profissionais/medico").ativo = false;
  await assert.rejects(a.alterar(a.recepcao, a.pedido()), /indisponível/);
});
test("Médico só altera sua própria agenda e não registra atendimento futuro", async () => {
  const a = ambiente(), criada = await a.alterar(a.recepcao, a.pedido());
  await assert.rejects(a.alterar(a.dentista, { acao: "confirmar", pacienteId: "paciente1", agendamentoId: criada.agendamentoId, statusEsperado: "agendado" }), /própria agenda/);
  await assert.rejects(a.alterar(a.medico, { acao: "presente", pacienteId: "paciente1", agendamentoId: criada.agendamentoId, statusEsperado: "agendado" }), /data futura/);
});
test("Estado anterior e autorização são conferidos novamente na transação", async () => {
  const a = ambiente(), criada = await a.alterar(a.recepcao, a.pedido());
  await a.alterar(a.medico, { acao: "confirmar", pacienteId: "paciente1", agendamentoId: criada.agendamentoId, statusEsperado: "agendado" });
  await assert.rejects(a.alterar(a.medico, { acao: "confirmar", pacienteId: "paciente1", agendamentoId: criada.agendamentoId, statusEsperado: "agendado" }), /mudou/);
  a.documentos.get("profissionais/recepcao").versao++;
  await assert.rejects(a.alterar(a.recepcao, a.pedido({ pacienteId: "paciente2", horario: "10:30" })), /autorização mudou/);
});
test("Conclusão libera o controle ativo e registra auditoria sem prontuário", async () => {
  const a = ambiente(), criada = await a.alterar(a.recepcao, a.pedido());
  const c = a.documentos.get("usuarios/paciente1/agendamentos/" + criada.agendamentoId); c.dia = a.datas.hojeBrasil(); c.status = "presente";
  await a.alterar(a.medico, { acao: "concluir", pacienteId: "paciente1", agendamentoId: criada.agendamentoId, statusEsperado: "presente" });
  assert.equal(a.documentos.get("usuarios/paciente1/controleAgendamento/ativo").agendamentoId, null);
  assert.equal(a.documentos.get("usuarios/paciente1/agendamentos/" + criada.agendamentoId).status, "concluido");
  assert.equal([...a.documentos].filter(([k]) => k.startsWith("auditoria/")).length, 2);
});
