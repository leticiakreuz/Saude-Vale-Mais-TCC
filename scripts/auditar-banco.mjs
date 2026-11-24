// Auditoria somente leitura. O relatório detalhado fica em .local, fora do Git.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import ts from "typescript";
import { getSecurityRules } from "firebase-admin/security-rules";
import { conectar } from "./firebase-admin-local.mjs";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url), cache = new Map();
function carregar(rel) {
  let arquivo = path.resolve(raiz, rel);
  if (!path.extname(arquivo)) arquivo += fs.existsSync(arquivo + ".ts") ? ".ts" : ".tsx";
  if (cache.has(arquivo)) return cache.get(arquivo);
  if (arquivo.endsWith(".json")) return JSON.parse(fs.readFileSync(arquivo, "utf8"));
  const m = { exports: {} };
  const req = nome => nome.startsWith("@/") ? carregar(nome.slice(2)) : nome.startsWith(".") ? carregar(path.relative(raiz, path.resolve(path.dirname(arquivo), nome))) : require(nome);
  const codigo = ts.transpileModule(fs.readFileSync(arquivo, "utf8"), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
  new vm.Script("(function(require,module,exports){" + codigo + "\n})", {filename:arquivo}).runInThisContext()(req, m, m.exports);
  cache.set(arquivo,m.exports); return m.exports;
}
const { cadastroCompleto, sexoFeminino } = carregar("lib/cadastro/validacao.ts");
const { unidadeDoEndereco } = carregar("lib/cadastro/territorio.ts");
const { avaliarComprovante } = carregar("lib/vacinacaoRegras.tsx");
const { auth, db, projectId } = conectar();
if (projectId !== "saude-vale-mais") throw Error("Projeto diferente do TCC.");
const hoje = new Intl.DateTimeFormat("en-CA", {timeZone:"America/Sao_Paulo"}).format(new Date());
const emailPrincipal = process.argv[process.argv.indexOf("--email") + 1]?.toLowerCase();
const relatorio = {data:hoje, projeto:projectId, modo:"somente leitura", colecoes:{}, contas:{}, totais:{}, problemas:{}, principal:null, candidatosTeste:[], detalhes:[]};
function problema(tipo, referencia) {relatorio.problemas[tipo]=(relatorio.problemas[tipo]??0)+1;relatorio.detalhes.push({tipo,referencia});}
function contar(tipo, n=1) {relatorio.totais[tipo]=(relatorio.totais[tipo]??0)+n;}
const contas = new Map(); let pagina;
do {const lote=await auth.listUsers(1000,pagina);for(const u of lote.users)contas.set(u.uid,u);pagina=lote.pageToken;}while(pagina);
relatorio.contas.authentication=contas.size;
const perfis = await db.collection("usuarios").get();
relatorio.contas.perfis=perfis.size;
for (const c of await db.listCollections()) relatorio.colecoes[c.id]=(await c.count().get()).data().count;
const reservas = await db.collection("horariosReservados").get();
const mapaReservas = new Map(reservas.docs.map(d=>[d.id,d.data()]));
const consultas = new Map(), controles = new Map(), cpfs = new Map();
const ativo = d => !["cancelado","concluido","concluído","finalizado","falta"].includes(String(d.status??"").toLowerCase());
for (const p of perfis.docs) {
  const d=p.data(), u=contas.get(p.id), subcolecoes=await p.ref.listCollections();
  const resumo={perfil:p.id,completo:cadastroCompleto(d),subcolecoes:{},testeAutomatico:false};
  if(!u)problema("perfil_sem_auth",p.ref.path);
  if(d.uid!==p.id)problema("uid_ausente_ou_divergente",p.ref.path);
  if(u?.email && String(d.email??"").toLowerCase()!==u.email.toLowerCase())problema("email_ausente_ou_divergente",p.ref.path);
  contar(resumo.completo?"perfis_completos":"perfis_incompletos");
  if(d.cpf){const n=String(d.cpf).replace(/\D/g,"");if(cpfs.has(n))problema("cpf_repetido",p.ref.path);else cpfs.set(n,p.id);}
  if(d.gestanteAtual && !sexoFeminino(d.sexo))problema("gestacao_legada_sem_sexo_feminino",p.ref.path);
  if(d.inicioGestacao && d.inicioGestacao>hoje)problema("inicio_gestacao_futuro",p.ref.path);
  if(d.rua && d.numero && d.unidadeReferencia){try{if(unidadeDoEndereco(d.rua,String(d.numero))!==d.unidadeReferencia)problema("ubs_diverge_tabela_territorial",p.ref.path);}catch{problema("endereco_sem_trecho_unico_na_tabela",p.ref.path);}}
  if(u?.email && /^svqa-[^@]+@example\.invalid$/i.test(u.email)) {resumo.testeAutomatico=true;relatorio.candidatosTeste.push({uid:p.id,email:u.email,criadoEm:u.metadata.creationTime});}
  const vacinas=[]; const agendamentos=[];
  for(const c of subcolecoes){const snap=await c.get();resumo.subcolecoes[c.id]=snap.size;contar(c.id,snap.size);
    for(const doc of snap.docs){const r=doc.data();
      if(c.id==="medicamentos"){
        if(![r.profissionalNome,r.medicoNome,r.nomeMedico,r.medico].some(v=>typeof v==="string"&&v.trim()))problema("medicamento_sem_prescritor",doc.ref.path);
        if(![r.unidadeRetirada,r.unidade,r.unidadeReferencia].some(v=>typeof v==="string"&&v.trim()))problema("medicamento_sem_unidade_retirada",doc.ref.path);
        if(r.proximaRetirada && r.proximaRetirada<hoje)problema("medicamento_com_retirada_passada",doc.ref.path);
        if(r.demonstrativo===true)contar("medicamentos_demo");
      }
      if(c.id==="vacinacao"){vacinas.push({...r,id:doc.id});if(r.demonstracao===true)contar("vacinas_demo");if(!r.vacina || !r.dose)problema("vacina_sem_identificacao",doc.ref.path);}
      if(c.id==="agendamentos"){
        consultas.set(doc.ref.path,r);agendamentos.push({...r,id:doc.id});
        if(ativo(r) && r.dia<hoje)problema("consulta_aberta_em_data_passada",doc.ref.path);
        if(ativo(r) && !r.reservaId)problema("consulta_ativa_sem_reserva",doc.ref.path);
        if(r.reservaId && ativo(r)){const reserva=mapaReservas.get(r.reservaId);if(!reserva || reserva.pacienteId!==p.id || reserva.agendamentoId!==doc.id || reserva.status!=="reservado")problema("consulta_reserva_inconsistente",doc.ref.path);}
      }
      if(c.id==="controleAgendamento" && doc.id==="ativo")controles.set(p.id,r);
    }
  }
  const abertas=agendamentos.filter(ativo);
  if(abertas.length>1)problema("mais_de_uma_consulta_ativa",p.ref.path);
  const controle=controles.get(p.id);
  if(controle?.agendamentoId && !abertas.some(a=>a.id===controle.agendamentoId))problema("controle_sem_consulta_ativa_correspondente",p.ref.path);
  if(abertas.length && !abertas.some(a=>a.id===controle?.agendamentoId))problema("consulta_ativa_sem_controle",p.ref.path);
  if(u?.email?.toLowerCase()===emailPrincipal){const a=avaliarComprovante(d,vacinas,new Date(hoje+"T12:00:00Z"));relatorio.principal={...resumo,checklistAcademicoApto:a.apto,faseAtual:a.faseAtual,consultasAbertas:abertas.length,claimsProfissionaisAntigas:!!u.customClaims?.cargo};}
}
for(const [uid,u] of contas){if(!perfis.docs.some(p=>p.id===uid))problema("auth_sem_perfil",`auth/${uid}`);if(u.disabled)contar("contas_desativadas");if(u.customClaims?.cargo)contar("claims_profissionais_legadas");}
for(const r of reservas.docs){const d=r.data();if(d.status!=="reservado")continue;const alvo=`usuarios/${d.pacienteId}/agendamentos/${d.agendamentoId}`;const c=consultas.get(alvo);if(!c || !ativo(c) || c.reservaId!==r.id)problema("reserva_sem_consulta_ativa_correspondente",r.ref.path);}
for(const c of ["profissionais","vinculosAgenda"]){const snap=await db.collection(c).get();for(const d of snap.docs){const r=d.data();if(c==="vinculosAgenda" && typeof r.uid==="string" && !(await db.collection("profissionais").doc(r.uid).get()).exists)problema("vinculo_sem_profissional",d.ref.path);}}
try{const regras=await getSecurityRules().getFirestoreRuleset();const fonte=regras.source.map(s=>s.content).join("\n");relatorio.regrasPublicadasIguaisAoArquivo=fonte.trim()===fs.readFileSync(path.join(raiz,"firestore.rules"),"utf8").trim();fs.mkdirSync(path.join(raiz,".local/firebase"),{recursive:true});fs.writeFileSync(path.join(raiz,".local/firebase/firestore.rules.atual"),fonte);}catch(e){relatorio.leituraRegras=e.code??e.name;}
const destino=path.join(raiz,".local",`revisao-banco-${hoje}.json`);fs.mkdirSync(path.dirname(destino),{recursive:true});fs.writeFileSync(destino,JSON.stringify(relatorio,null,2));
console.log(JSON.stringify({...relatorio,detalhes:undefined,candidatosTeste:relatorio.candidatosTeste.length,principal:relatorio.principal?{...relatorio.principal,perfil:undefined}:null,relatorioPrivado:path.relative(raiz,destino)},null,2));
