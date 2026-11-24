// Quatro identidades sintéticas para demonstração. Sem --aplicar, não grava no Firebase.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";
import ts from "typescript";
import { FieldValue } from "firebase-admin/firestore";
import { conectar } from "./firebase-admin-local.mjs";

const raiz=path.resolve(path.dirname(fileURLToPath(import.meta.url)),".."), require=createRequire(import.meta.url), cache=new Map();
function carregar(rel){
  let arquivo=path.resolve(raiz,rel);if(!path.extname(arquivo))arquivo+=fs.existsSync(arquivo+".ts")?".ts":".tsx";
  if(cache.has(arquivo))return cache.get(arquivo);if(arquivo.endsWith(".json"))return JSON.parse(fs.readFileSync(arquivo,"utf8"));
  const m={exports:{}};const req=n=>n==="server-only"?{}:n.startsWith("@/")?carregar(n.slice(2)):n.startsWith(".")?carregar(path.relative(raiz,path.resolve(path.dirname(arquivo),n))):require(n);
  const js=ts.transpileModule(fs.readFileSync(arquivo,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
  new vm.Script("(function(require,module,exports){"+js+"\n})",{filename:arquivo}).runInThisContext()(req,m,m.exports);cache.set(arquivo,m.exports);return m.exports;
}
const {dadosCadastro,cadastroCompleto}=carregar("lib/cadastro/validacao.ts");
const {resolverEndereco}=carregar("lib/cadastro/endereco.ts");
const {idadeEmMeses,fasePorIdade}=carregar("lib/vacinacaoRegras.tsx");
function cpfExemplo(base){let n=base;for(let tamanho=9;tamanho<=10;tamanho++){const soma=[...n].reduce((s,d,i)=>s+Number(d)*(tamanho+1-i),0);const digito=(soma*10)%11;n+=digito===10?0:digito;}return n;}
const cenarios=[
  {id:"crianca",nome:"Sofia Almeida",dataNascimento:"2018-03-15",sexo:"Feminino",cenario:"Criança: cadastro completo com responsável",baseCpf:"000000001"},
  {id:"adolescente",nome:"Lucas Almeida",dataNascimento:"2010-06-10",sexo:"Masculino",cenario:"Adolescente: serviços e carteirinha da faixa etária",baseCpf:"000000002"},
  {id:"adulto",nome:"Marcos Almeida",dataNascimento:"1991-08-10",sexo:"Masculino",cenario:"Adulto: responsável pela conta da criança",baseCpf:"000000003"},
  {id:"gestante",nome:"Ana Almeida",dataNascimento:"1997-04-20",sexo:"Feminino",cenario:"Adulto feminino: exemplo de gestação atual",baseCpf:"000000004"},
];
const {auth,db,projectId}=conectar();if(projectId!=="saude-vale-mais")throw Error("Projeto inesperado.");
const enderecoEntrada={cep:"89035300",rua:"Rua Theodoro Holtrup",numero:"100",bairro:"Vila Nova",cidade:"Blumenau",uf:"SC"};
const endereco=await resolverEndereco(enderecoEntrada);
const hoje=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Sao_Paulo"}).format(new Date());
const inicio=new Date(hoje+"T12:00:00Z");inicio.setUTCDate(inicio.getUTCDate()-126);
const perfis=await db.collection("usuarios").get(), planos=[];
for(const [i,c] of cenarios.entries()){
  const uid=`demo-${c.id}-tcc`,email=`${c.id}@demo.saudevale.invalid`;
  const dados=dadosCadastro({...enderecoEntrada,nome:c.nome,cpf:cpfExemplo(c.baseCpf),dataNascimento:c.dataNascimento,sexo:c.sexo,telefone:`4790000000${i+1}`,numeroSUS:"",emailResponsavel:c.id==="crianca"?"adulto@demo.saudevale.invalid":""});
  const perfil={...dados,...endereco,uid,email,cartaoSus:"",cadastroVersao:2,demonstracao:true,cenarioApresentacao:c.cenario,origem:"Identidade sintética para apresentação acadêmica; não corresponde a paciente real.",gestanteAtual:c.id==="gestante",jaFoiGestante:false,semanasGestacao:c.id==="gestante"?18:null,inicioGestacao:c.id==="gestante"?inicio.toISOString().slice(0,10):null};
  if(!cadastroCompleto(perfil))throw Error(`Cenário inválido: ${c.id}`);
  if(perfis.docs.some(p=>p.id!==uid && p.data().cpf===dados.cpf))throw Error(`CPF sintético já utilizado: cenário ${c.id}. Nada foi criado.`);
  let existente=null;try{existente=await auth.getUser(uid);}catch(e){if(e.code!=="auth/user-not-found")throw e;}
  let porEmail=null;try{porEmail=await auth.getUserByEmail(email);}catch(e){if(e.code!=="auth/user-not-found")throw e;}
  const doc=await db.collection("usuarios").doc(uid).get();
  if((existente || porEmail || doc.exists) && !(existente?.email===email && (!porEmail || porEmail.uid===uid) && doc.data()?.demonstracao===true))throw Error(`Identidade já utilizada fora deste cenário: ${c.id}. Nada será sobrescrito.`);
  planos.push({c,uid,email,perfil,existente:!!existente,fase:fasePorIdade(idadeEmMeses(c.dataNascimento,new Date(hoje+"T12:00:00Z")))});
}
const aplicar=process.argv.includes("--aplicar");
console.log(JSON.stringify({projeto:projectId,modo:aplicar?"aplicar":"simulação sem gravação",contas:planos.map(p=>({id:p.uid,email:p.email,nome:p.c.nome,fase:p.fase,jaExiste:p.existente})),ubs:endereco.unidadeReferencia},null,2));
if(!aplicar)process.exit(0);
fs.mkdirSync(path.join(raiz,".local/apresentacao"),{recursive:true});
const acessosArquivo=path.join(raiz,".local/apresentacao/acessos.json");
const acessos=fs.existsSync(acessosArquivo)?JSON.parse(fs.readFileSync(acessosArquivo,"utf8")):[];
for(const p of planos){
  if(p.existente)continue;
  const senha="Tcc!"+randomBytes(9).toString("base64url")+"2";
  // Guarda o acesso somente no arquivo privado antes de criar, sem imprimir senhas.
  acessos.push({uid:p.uid,email:p.email,senha,nome:p.c.nome,cenario:p.c.cenario});fs.writeFileSync(acessosArquivo,JSON.stringify(acessos,null,2));
  await auth.createUser({uid:p.uid,email:p.email,password:senha,displayName:p.c.nome,emailVerified:false,disabled:false});
  try{await db.collection("usuarios").doc(p.uid).create({...p.perfil,criadoEm:FieldValue.serverTimestamp(),perfilAtualizadoEm:FieldValue.serverTimestamp()});}
  catch(e){await auth.updateUser(p.uid,{disabled:true});throw e;}
}
for(const p of planos){const [u,d]=await Promise.all([auth.getUser(p.uid),db.collection("usuarios").doc(p.uid).get()]);if(u.disabled || u.email!==p.email || !cadastroCompleto(d.data()) || d.data().demonstracao!==true)throw Error(`Falha na conferência: ${p.c.id}`);}
const linhas=["# Acessos de demonstração — uso privado","","Identidades fictícias do TCC. E-mails de exemplo não recebem mensagens. As senhas abaixo ficam somente neste arquivo local, ignorado pelo Git.","","| Cenário | Nome | E-mail | Senha |","| --- | --- | --- | --- |",...acessos.map(a=>`| ${a.cenario} | ${a.nome} | ${a.email} | ${a.senha} |`),"","A conta principal existente foi preservada. Nenhuma conta acima tem privilégios profissionais ou administrativos."];
fs.writeFileSync(path.join(raiz,".local/apresentacao/ACESSOS.md"),linhas.join("\n"));
console.log(JSON.stringify({concluido:true,criadas:planos.filter(p=>!p.existente).length,verificadas:planos.length,acessosPrivados:".local/apresentacao/ACESSOS.md",contaPrincipal:"preservada"},null,2));
