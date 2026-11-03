const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),ts=require("typescript"),vm=require("node:vm");
const raiz=path.resolve(__dirname,".."),cache=new Map();
function carregar(rel,alternativos={}) {
  const arquivo=path.resolve(raiz,rel);
  if(cache.has(arquivo))return cache.get(arquivo);
  if(arquivo.endsWith(".json"))return JSON.parse(fs.readFileSync(arquivo,"utf8"));
  const m={exports:{}};
  const requireTeste=nome=>{
    if(nome in alternativos)return alternativos[nome];
    if(nome==="server-only")return {};
    if(nome.startsWith("@/")||nome.startsWith(".")){
      let destino=nome.startsWith("@/")?path.resolve(raiz,nome.slice(2)):path.resolve(path.dirname(arquivo),nome);
      if(!path.extname(destino))destino+=".ts";
      return carregar(path.relative(raiz,destino),alternativos);
    }
    return require(nome);
  };
  const codigo=ts.transpileModule(fs.readFileSync(arquivo,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  new vm.Script("(function(require,module,exports){"+codigo+"\n})",{filename:arquivo}).runInThisContext()(requireTeste,m,m.exports);
  cache.set(arquivo,m.exports);return m.exports;
}
const v=carregar("lib/cadastro/validacao.ts"),t=carregar("lib/cadastro/territorio.ts");
const exemplo={nome:"Pessoa Fictícia QA",cpf:"52998224725",telefone:"47999999999",dataNascimento:"1990-01-01",numeroSUS:"700000000000003",emailResponsavel:"",cep:"89010001",rua:"Rua 15 de Novembro",numero:"100",bairro:"Centro",cidade:"Blumenau",uf:"SC"};
test("Cadastro rejeita todos os dados obrigatórios ausentes, mesmo fora do formulário",()=>{
  for(const campo of Object.keys(exemplo).filter(c=>c!=="emailResponsavel"))assert.throws(()=>v.dadosCadastro({...exemplo,[campo]:""}),undefined,campo);
  assert.equal(v.dadosCadastro(exemplo).cidade,"Blumenau");
});
test("CPF, nascimento impossível/futuro, telefone e CNS são verificados",()=>{
  for(const dados of [{cpf:"11111111111"},{cpf:"52998224726"},{dataNascimento:"2020-02-30"},{dataNascimento:"2999-01-01"},{telefone:"00000000000"},{numeroSUS:"123"}])assert.throws(()=>v.dadosCadastro({...exemplo,...dados}));
});
test("Outra cidade e estado não concluem cadastro; criança exige responsável",()=>{
  assert.throws(()=>v.dadosCadastro({...exemplo,cidade:"Gaspar"}));
  assert.throws(()=>v.dadosCadastro({...exemplo,uf:"PR"}));
  assert.throws(()=>v.dadosCadastro({...exemplo,dataNascimento:new Date().toISOString().slice(0,10)}));
});
test("Um perfil incompleto ou com marcador falsificado sem dados não libera acesso",()=>{
  assert.equal(v.cadastroCompleto({cadastroVersao:2,unidadeReferencia:"ESF forjada"}),false);
  assert.equal(v.cadastroCompleto({...exemplo,unidadeReferencia:"ESF Teste"}),false);
  assert.equal(v.cadastroCompleto({...exemplo,cadastroVersao:2,unidadeReferencia:"USF HEINZ SCHRADER - CENTRO"}),true);
});
test("Rua e número respeitam a divisa oficial, inclusive acentos e prefixos",()=>{
  assert.equal(t.unidadeDoEndereco("Rua 1º de Janeiro","1555"),"ESF GERMANO PUFF");
  assert.equal(t.unidadeDoEndereco("Rua 1° de Janeiro","1556"),"ESF ANGELO DE CAETANO II");
  assert.equal(t.unidadeDoEndereco("Rua 15 de Novembro","100"),"USF HEINZ SCHRADER - CENTRO");
});
test("Ruas desconhecidas, número ausente e trechos ambíguos não recebem UBS aproximada",()=>{
  for(const [rua,n] of [["Rua Inexistente QA","10"],["1 DE JANEIRO",""],["1 DE JANEIRO","0"],["FREDERICO JENSEN","10000"],["PROFESSOR JACOB INEICHEN","4000"]])assert.throws(()=>t.unidadeDoEndereco(rua,n));
});
test("Nomes de rua partidos em duas linhas no PDF foram recompostos",()=>{
  assert.equal(t.unidadeDoEndereco("Rua Cícero Bernardo Macedo Guimarães","50"),"ESF AUREA PFUETZENREUTER I");
  assert.throws(()=>t.unidadeDoEndereco("Guimaraes","50"));
});
test("Frederico Jensen respeita as faixas pares e ímpares expressas no PDF",()=>{
  assert.equal(t.unidadeDoEndereco("Rua Frederico Jensen","2727"),"ESF HAROLD EWALD");
  assert.equal(t.unidadeDoEndereco("Rua Frederico Jensen","2728"),"ESF ARMANDO ODEBRECHT II");
  assert.equal(t.unidadeDoEndereco("Rua Frederico Jensen","3033"),"ESF HAROLD EWALD");
  assert.equal(t.unidadeDoEndereco("Rua Frederico Jensen","3360"),"ESF ARMANDO ODEBRECHT II");
});
test("Criação inicial exige somente os dados básicos anteriores, com CPF e e-mail válidos",()=>{
  assert.deepEqual(v.dadosConta({...exemplo,email:"QA@example.invalid"}),{nome:exemplo.nome,cpf:exemplo.cpf,email:"qa@example.invalid"});
  for(const dados of [{nome:"Pessoa"},{cpf:"11111111111"},{email:"inválido"}])assert.throws(()=>v.dadosConta({...exemplo,email:"qa@example.invalid",...dados}));
});

test("API não cria conta sem nome e CPF, mesmo recebendo e-mail e senha",async()=>{
  let criados=0;
  const api=carregar("app/api/cadastro/route.ts",{"@/lib/firebaseAdmin":{adminAuth:{createUser:async()=>{criados++;return {uid:"qa"};}},adminDb:{}}});
  const r=await api.POST(new Request("http://localhost:3100/api/cadastro",{method:"POST",headers:{origin:"http://localhost:3100","Content-Type":"application/json"},body:JSON.stringify({email:"qa@example.invalid",senha:"SenhaTeste123",confirmarSenha:"SenhaTeste123"})}));
  assert.equal(r.status,400);assert.equal(criados,0);
});
test("Falha ao salvar o perfil remove a conta provisória e nunca a habilita",async()=>{
  cache.delete(path.resolve(raiz,"app/api/cadastro/route.ts"));
  const eventos=[];
  const api=carregar("app/api/cadastro/route.ts",{
    "@/lib/cadastro/endereco":{resolverEndereco:async()=>({unidadeReferencia:"UBS calculada"})},
    "@/lib/firebaseAdmin":{adminAuth:{createUser:async d=>{eventos.push(["criar",d.disabled]);return {uid:"somente-qa"};},updateUser:async(_,d)=>eventos.push(["estado",d.disabled]),deleteUser:async()=>eventos.push(["remover",true])},adminDb:{collection:()=>({doc:()=>({create:async()=>{throw new Error("Falha simulada de gravação");},delete:async()=>{}})})}}
  });
  const r=await api.POST(new Request("http://localhost:3100/api/cadastro",{method:"POST",headers:{origin:"http://localhost:3100","Content-Type":"application/json"},body:JSON.stringify({...exemplo,email:"qa@example.invalid",senha:"SenhaTeste123",confirmarSenha:"SenhaTeste123"})}));
  assert.equal(r.status,500);assert.deepEqual(eventos,[["criar",true],["estado",true],["remover",true]]);
});
test("Conta inicial não libera serviços nem aceita cargo, endereço ou UBS enviados pelo cliente",async()=>{
  cache.delete(path.resolve(raiz,"app/api/cadastro/route.ts"));
  const eventos=[];let perfil;
  const api=carregar("app/api/cadastro/route.ts",{
    "@/lib/firebaseAdmin":{adminAuth:{createUser:async d=>{eventos.push(["criar",d.disabled]);return {uid:"somente-qa"};},updateUser:async(_,d)=>eventos.push(["estado",d.disabled])},adminDb:{collection:()=>({doc:()=>({create:async d=>{perfil=d;eventos.push(["perfil",true]);}})})}}
  });
  const r=await api.POST(new Request("http://localhost:3100/api/cadastro",{method:"POST",headers:{origin:"http://localhost:3100","Content-Type":"application/json"},body:JSON.stringify({...exemplo,email:"qa@example.invalid",senha:"SenhaTeste123",confirmarSenha:"SenhaTeste123",cargo:"administracao",unidadeReferencia:"forjada"})}));
  assert.equal(r.status,201);assert.deepEqual(eventos,[["criar",true],["perfil",true],["estado",false]]);
  assert.equal(perfil.cargo,undefined);assert.equal(perfil.unidadeReferencia,undefined);assert.equal(perfil.rua,undefined);assert.equal(perfil.cadastroVersao,1);assert.equal(v.cadastroCompleto(perfil),false);
});
