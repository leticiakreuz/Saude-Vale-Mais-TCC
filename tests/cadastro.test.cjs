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
      if(!path.extname(destino))destino+=fs.existsSync(destino+".ts")?".ts":".tsx";
      return carregar(path.relative(raiz,destino),alternativos);
    }
    return require(nome);
  };
  const codigo=ts.transpileModule(fs.readFileSync(arquivo,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
  new vm.Script("(function(require,module,exports){"+codigo+"\n})",{filename:arquivo}).runInThisContext()(requireTeste,m,m.exports);
  cache.set(arquivo,m.exports);return m.exports;
}
const v=carregar("lib/cadastro/validacao.ts"),t=carregar("lib/cadastro/territorio.ts");
const exemplo={nome:"Pessoa Fictícia QA",cpf:"52998224725",telefone:"47999999999",dataNascimento:"1990-01-01",numeroSUS:"700000000000003",emailResponsavel:"",cep:"89010001",rua:"Rua 15 de Novembro",numero:"100",bairro:"Centro",cidade:"Blumenau",uf:"SC"};
test("Login antes de carregar o JavaScript não permite enviar credenciais pela URL",()=>{
  const React=require("react"),{renderToStaticMarkup}=require("react-dom/server");
  const Formulario=carregar("componentes/EntrarFormulario.tsx",{"next/image":()=>null,"next/link":({children})=>React.createElement("span",null,children),"next/navigation":{useRouter:()=>({push:()=>{}})},"@/app/firebase":{auth:{}}}).default;
  const html=renderToStaticMarkup(React.createElement(Formulario));
  assert.match(html,/<form[^>]*method="post"/);
  assert.match(html.match(/<input[^>]*name="email"[^>]*>/)[0],/disabled=""/);
  assert.match(html.match(/<input[^>]*name="senha"[^>]*>/)[0],/disabled=""/);
  assert.match(html,/<button[^>]*type="submit"[^>]*disabled=""/);
});
test("CEP de Blumenau válido é separado de trecho sem UBS; não há vinculação aproximada",async()=>{
  const originalFetch=global.fetch;
  try {
    global.fetch=async()=>Response.json({logradouro:"Rua Dois de Setembro",bairro:"Itoupava Norte",localidade:"Blumenau",uf:"SC",ibge:"4202404"});
    const endereco=carregar("lib/cadastro/endereco.ts");
    assert.equal((await endereco.consultarCEP("89052-000")).cidade,"Blumenau");
    await assert.rejects(endereco.resolverEndereco({cep:"89052000",rua:"Rua Dois de Setembro",numero:"100",bairro:"Itoupava Norte"}),e=>e.status===422 && /CEP é de Blumenau/.test(e.message));
    assert.equal((await endereco.resolverEndereco({cep:"89052000",rua:"Rua Dois de Setembro",numero:"2000",bairro:"Itoupava Norte"})).unidadeReferencia,"ESF ORLANDO MARGARIDA");
    await assert.rejects(endereco.resolverEndereco({cep:"89052000",rua:"Rua São Paulo",numero:"100",bairro:"Victor Konder"}),/não corresponde ao CEP/);
    global.fetch=async()=>Response.json({erro:true});
    await assert.rejects(endereco.consultarCEP("99999999"),/CEP não encontrado/);
    global.fetch=async()=>Response.json({logradouro:"Praça da Sé",localidade:"São Paulo",uf:"SP",ibge:"3550308"});
    await assert.rejects(endereco.consultarCEP("01001000"),/Blumenau/);
    global.fetch=async()=>{throw new Error("Falha de rede simulada");};
    await assert.rejects(endereco.consultarCEP("89052000"),e=>e.status===503);
    await assert.rejects(endereco.consultarCEP("8901"),/oito números/);
  } finally {global.fetch=originalFetch;}
});
test("Cadastro rejeita todos os dados obrigatórios ausentes, mesmo fora do formulário",()=>{
  for(const campo of Object.keys(exemplo).filter(c=>!["emailResponsavel","numeroSUS"].includes(c)))assert.throws(()=>v.dadosCadastro({...exemplo,[campo]:""}),undefined,campo);
  assert.equal(v.dadosCadastro(exemplo).cidade,"Blumenau");
});
test("CPF, nascimento impossível/futuro, telefone e CNS são verificados",()=>{
  for(const dados of [{cpf:"11111111111"},{cpf:"52998224726"},{dataNascimento:"2020-02-30"},{dataNascimento:"2999-01-01"},{telefone:"00000000000"},{numeroSUS:"123"}])assert.throws(()=>v.dadosCadastro({...exemplo,...dados}));
});
test("CNS é opcional; ausente ou vazio não impede o cadastro completo",()=>{
  const semCns = {...exemplo,cadastroVersao:2,unidadeReferencia:"UBS de teste"};
  delete semCns.numeroSUS;
  assert.equal(v.dadosCadastro(semCns).numeroSUS, "");
  assert.equal(v.cadastroCompleto(semCns), true);
  assert.equal(v.cadastroCompleto({...semCns,numeroSUS:""}), true);
  for (const numeroSUS of ["abc", "123", "111111111111111"]) assert.throws(()=>v.dadosCadastro({...exemplo,numeroSUS}));
});
test("Após concluir o perfil, uma cópia antiga no cache não redireciona para completar de novo",()=>{
  let receber,opcoes;const estados=[],destinos=[];
  const Protecao=carregar("componentes/cadastro/ExigirCadastroCompleto.tsx",{
    react:{useState:inicial=>[inicial,valor=>estados.push(valor)],useEffect:efeito=>efeito()},
    "next/navigation":{usePathname:()=>"/dashboard",useRouter:()=>({replace:destino=>destinos.push(destino)})},
    "firebase/auth":{onAuthStateChanged:(_,cb)=>{cb({uid:"fixture"});return ()=>{};}},
    "firebase/firestore":{doc:()=>({}),onSnapshot:(_,config,cb)=>{opcoes=config;receber=cb;return ()=>{};}},
    "@/app/firebase":{auth:{},db:{}}
  }).default;
  Protecao({children:null});
  assert.equal(opcoes.includeMetadataChanges,true);
  receber({data:()=>({...exemplo,cadastroVersao:1}),metadata:{fromCache:true}});
  assert.deepEqual(destinos,[]);
  receber({data:()=>({...exemplo,numeroSUS:"",cadastroVersao:2,unidadeReferencia:"UBS de teste"}),metadata:{fromCache:false}});
  assert.equal(estados.at(-1),"permitido");assert.deepEqual(destinos,[]);
  receber({data:()=>({...exemplo,cadastroVersao:1}),metadata:{fromCache:false}});
  assert.deepEqual(destinos,["/completar-cadastro"]);
});
test("Sexo informado é validado e não é deduzido pelo nome ou pelos marcadores de gestação",()=>{
  assert.equal(v.sexoFeminino("Feminino"), true);
  assert.equal(v.sexoFeminino("F"), true);
  assert.equal(v.sexoFeminino(undefined), false);
  assert.equal(v.sexoFeminino("Masculino"), false);
  assert.equal(v.dadosCadastro({...exemplo,sexo:"F"}).sexo, "Feminino");
  assert.throws(()=>v.dadosCadastro({...exemplo,sexo:"inválido"}));
});
test("Marcadores gestacionais antigos não acrescentam exigências ao comprovante sem sexo feminino",()=>{
  const vacinas = carregar("lib/vacinacaoRegras.tsx");
  const gestacao = {gestanteAtual:true,semanasGestacao:25,inicioGestacao:"2026-10-01"};
  const base = vacinas.requisitosDemonstrativos(400, {});
  assert.deepEqual(vacinas.requisitosDemonstrativos(400, {...gestacao,sexo:"Masculino"}), base);
  assert.deepEqual(vacinas.requisitosDemonstrativos(400, gestacao), base);
  assert.ok(vacinas.requisitosDemonstrativos(400, {...gestacao,sexo:"Feminino"}).some(item=>item.codigo==="dtpa" && item.periodo==="gestacao"));
});
test("Dados fictícios completam o checklist do TCC sem alterar registros anteriores ou duplicar doses",()=>{
  const {gerarVacinasDemonstrativas}=carregar("lib/vacinacaoDemonstracao.ts");
  const {avaliarComprovante}=carregar("lib/vacinacaoRegras.tsx");
  const perfil={dataNascimento:"1950-04-04"},hoje=new Date("2026-11-20T12:00:00Z");
  const anteriores=[{id:"legado",vacina:"Não identificada",dose:"",dataAplicacao:"",status:"Pendente"}];
  const antes=JSON.stringify(anteriores);
  const novos=gerarVacinasDemonstrativas(perfil,anteriores,hoje);
  assert.equal(novos.length,8);
  assert.ok(novos.every(r=>r.demonstracao===true && r.lote==="DEMONSTRACAO-TCC" && /demonstração/.test(r.unidade)));
  assert.ok(novos.every(r=>r.dataAplicacao <= "2026-11-20" && r.dataAplicacao >= perfil.dataNascimento));
  assert.equal(avaliarComprovante(perfil,[...anteriores,...novos],hoje).apto,true);
  assert.deepEqual(gerarVacinasDemonstrativas(perfil,[...anteriores,...novos],hoje),[]);
  assert.equal(JSON.stringify(anteriores),antes);
  assert.throws(()=>gerarVacinasDemonstrativas(perfil,[{...novos[0],status:"Pendente"}],hoje),/Nenhum dado será sobrescrito/);
});
test("Cenários fictícios cobrem todas as vacinas das fases acessíveis e são idempotentes",()=>{
  const {gerarCarteirinhasDemonstrativas}=carregar("lib/vacinacaoDemonstracao.ts");
  const {CATALOGO_POR_FASE,avaliarComprovante}=carregar("lib/vacinacaoRegras.tsx");
  const perfil={dataNascimento:"1950-04-04"},hoje=new Date("2026-11-20T12:00:00Z");
  const novos=gerarCarteirinhasDemonstrativas(perfil,[],hoje);
  for (const fase of ["Crianca","Adolescente","Adulto","Idoso"]) for (const codigo of CATALOGO_POR_FASE[fase]) assert.ok(novos.some(r=>r.fase===fase && r.codigo===codigo && r.demonstracao),`${fase}: ${codigo}`);
  assert.equal(new Set(novos.map(r=>r.id)).size,novos.length);
  assert.equal(avaliarComprovante(perfil,novos,hoje).apto,true);
  assert.deepEqual(gerarCarteirinhasDemonstrativas(perfil,novos,hoje),[]);
  const crianca=gerarCarteirinhasDemonstrativas({dataNascimento:"2024-01-01"},[],hoje);
  assert.ok(crianca.every(r=>r.fase==="Crianca"));
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
test("Cadastro de adulto ignora e-mail de responsável que tenha ficado no perfil",()=>{
  const email = "qa@example.invalid";
  const dados = v.dadosCadastro({...exemplo, email, emailResponsavel: email});
  assert.equal(dados.emailResponsavel, "");
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
