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

  const datas = carregar("lib/datas.ts");
  const regras = carregar("lib/agendamentos/agendaRegras.ts");
  const unidade = "UBS Acadêmica Vale";
  for (const uid of ["paciente1", "paciente2"]) {
    tokens.set(uid, {uid, email: uid + "@example.invalid", profissional: true, cargo: "administracao"});
    documentos.set("usuarios/" + uid, {
      uid, email: uid + "@example.invalid", nome: "Pessoa Fictícia Teste",
      cpf: "52998224725", telefone: "47999999999", dataNascimento: "1990-01-01",
      numeroSUS: "700000000000003", emailResponsavel: "", cep: "89010001",
      rua: "Rua 15 de Novembro", numero: "100", bairro: "Centro", cidade: "Blumenau", uf: "SC",
      unidadeReferencia: unidade, cadastroVersao: 2,
    });
  }
  const data = new Date(datas.hojeBrasil() + "T12:00:00Z");
  do { data.setUTCDate(data.getUTCDate() + 1); } while ([0,6].includes(data.getUTCDay()));
  const dia = data.toISOString().slice(0,10);
  const reservar = carregar("app/api/agendamentos/reservar/route.ts").POST;
  const cancelar = carregar("app/api/agendamentos/cancelar/route.ts").POST;
  const pedido = (dados, uid = "paciente1") => new Request("http://localhost/api/agendamentos", {
    method: "POST", headers: {Authorization: "Bearer " + uid, "Content-Type": "application/json"}, body: JSON.stringify(dados),
  });
  const consulta = (extra = {}) => ({servico: "Consulta médica", periodo: "Manhã", medico: "Dr. Rafael Martins", dia, horario: "08:30", ...extra});
  return {documentos, tokens, carregar, datas, regras, unidade, dia, reservar, cancelar, pedido, consulta};
}

test("Datas de consultas respeitam o fuso brasileiro, dias úteis e o limite de 21 dias", () => {
  const a = ambiente();
  assert.equal(a.datas.hojeBrasil(new Date("2026-11-03T01:00:00Z")), "2026-11-02");
  assert.equal(a.datas.dataAgendavel("2026-11-03", "2026-11-02"), true);
  assert.equal(a.datas.dataAgendavel("2026-11-07", "2026-11-02"), false);
  assert.equal(a.datas.dataAgendavel("2026-11-23", "2026-11-02"), false);
  assert.equal(a.datas.dataReal("2026-02-30"), false);
});

test("Login sempre usa o perfil cidadão mesmo com claims profissionais antigas", async () => {
  const a = ambiente();
  const acesso = a.carregar("app/api/acesso/route.ts");
  const resposta = await acesso.POST(a.pedido({}));
  assert.equal(resposta.status, 200);
  assert.equal((await resposta.json()).destino, "/dashboard");
  assert.ok(resposta.headers.get("set-cookie").includes("sv-profissional="));
  a.documentos.set("usuarios/paciente1", {nome: "Perfil incompleto", cadastroVersao: 1});
  assert.equal((await (await acesso.POST(a.pedido({}))).json()).destino, "/completar-cadastro");
  assert.equal((await acesso.POST(new Request("http://localhost/api/acesso", {method:"POST"}))).status, 401);
});

test("Duas reservas concorrentes pelo cidadão produzem uma única consulta", async () => {
  const a = ambiente();
  const respostas = await Promise.all([a.reservar(a.pedido(a.consulta())), a.reservar(a.pedido(a.consulta(), "paciente2"))]);
  assert.deepEqual(respostas.map(r => r.status).sort(), [201,409]);
  assert.equal([...a.documentos.keys()].filter(k => k.includes("/agendamentos/")).length, 1);
});

test("Uma consulta ativa impede a segunda reserva do mesmo cidadão", async () => {
  const a = ambiente();
  assert.equal((await a.reservar(a.pedido(a.consulta()))).status, 201);
  assert.equal((await a.reservar(a.pedido(a.consulta({horario:"10:30"})))).status, 409);
});

test("Cancelamento respeita o dono da consulta e libera reserva e controle", async () => {
  const a = ambiente();
  const criada = await a.reservar(a.pedido(a.consulta()));
  const {agendamentoId} = await criada.json();
  assert.equal((await a.cancelar(a.pedido({agendamentoId}, "paciente2"))).status, 404);
  assert.equal((await a.cancelar(a.pedido({agendamentoId}))).status, 200);
  assert.equal(a.documentos.get("usuarios/paciente1/agendamentos/" + agendamentoId).status, "cancelado");
  assert.equal(a.documentos.get("usuarios/paciente1/controleAgendamento/ativo").agendamentoId, null);
  assert.equal((await a.reservar(a.pedido(a.consulta(), "paciente2"))).status, 201);
});

test("Perfil incompleto bloqueia reserva e uma escala bloqueada continua sendo respeitada", async () => {
  const a = ambiente();
  const perfil = a.documentos.get("usuarios/paciente1");
  a.documentos.set("usuarios/paciente1", {...perfil, telefone:""});
  assert.equal((await a.reservar(a.pedido(a.consulta()))).status, 403);
  a.documentos.set("usuarios/paciente1", perfil);
  const ref = a.regras.configRef(a.unidade, "Dr. Rafael Martins", a.dia);
  a.documentos.set(ref.path, {ativo: true, horarios:["08:30"], bloqueios:["08:30"], servicos:["Consulta médica"]});
  assert.equal((await a.reservar(a.pedido(a.consulta()))).status, 409);
});

test("Disponibilidade respeita horários ocupados da unidade do cidadão", async () => {
  const a = ambiente();
  await a.reservar(a.pedido(a.consulta()));
  const {GET} = a.carregar("app/api/agendamentos/disponibilidade/route.ts");
  const resposta = await GET(new Request("http://localhost/api/agendamentos/disponibilidade?medico=Dr.%20Rafael%20Martins&dia=" + a.dia, {headers:{Authorization:"Bearer paciente2"}}));
  assert.equal(resposta.status, 200);
  assert.deepEqual((await resposta.json()).horariosOcupados, ["08:30"]);
});
