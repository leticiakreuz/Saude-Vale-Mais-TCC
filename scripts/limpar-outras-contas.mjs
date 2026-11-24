// Uso explícito: --preservar email [--aplicar]. Sem --aplicar, apenas inventaria e salva cópia local.
import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { conectar } from "./firebase-admin-local.mjs";

const args=process.argv.slice(2), indice=args.indexOf("--preservar");
if(indice<0 || !args[indice+1]?.includes("@")) throw Error("Informe --preservar com o e-mail da conta que deve permanecer.");
const email=args[indice+1].trim().toLowerCase(), aplicar=args.includes("--aplicar");
const {auth,db,projectId}=conectar();
if(projectId!=="saude-vale-mais")throw Error("Esta limpeza é restrita ao projeto saude-vale-mais.");
const protegida=await auth.getUserByEmail(email);
if(protegida.email?.toLowerCase()!==email || protegida.disabled)throw Error("Conta preservada não confirmada ou desativada.");
const perfilProtegido=db.collection("usuarios").doc(protegida.uid);
if(!(await perfilProtegido.get()).exists)throw Error("O perfil da conta preservada não existe.");
const contas=[];let pagina;
do{const p=await auth.listUsers(1000,pagina);contas.push(...p.users);pagina=p.pageToken;}while(pagina);
const excluir=new Set(contas.filter(u=>u.uid!==protegida.uid).map(u=>u.uid));
if(excluir.size>100)throw Error("Volume inesperado; confira o plano antes de limpar.");
function serializar(v){
  if(v===null || typeof v!=="object")return v;
  if(typeof v.toDate==="function" && typeof v.seconds==="number")return {__tipo:"Timestamp",seconds:v.seconds,nanoseconds:v.nanoseconds};
  if(v instanceof Date)return {__tipo:"Date",iso:v.toISOString()};
  if(Buffer.isBuffer(v))return {__tipo:"Bytes",base64:v.toString("base64")};
  if(typeof v.path==="string" && v.firestore)return {__tipo:"DocumentReference",path:v.path};
  if(typeof v.latitude==="number" && typeof v.longitude==="number")return {__tipo:"GeoPoint",latitude:v.latitude,longitude:v.longitude};
  if(Array.isArray(v))return v.map(serializar);
  return Object.fromEntries(Object.keys(v).sort().map(k=>[k,serializar(v[k])]));
}
async function arvore(ref){
  const snap=await ref.get(), lista=[];
  if(snap.exists)lista.push({ref,snap,path:ref.path,data:snap.data()});
  for(const c of await ref.listCollections())for(const d of await c.listDocuments())lista.push(...await arvore(d));
  return lista;
}
const documentos=[];
for(const c of await db.listCollections())for(const d of await c.listDocuments())documentos.push(...await arvore(d));
const contemUid=alvo=>typeof alvo==="string" && [...excluir].some(uid=>alvo===`usuarios/${uid}`||alvo.startsWith(`usuarios/${uid}/`));
function pertenceExclusao(d){
  const [colecao,id]=d.path.split("/"),r=d.data;
  if(d.path===perfilProtegido.path || d.path.startsWith(perfilProtegido.path+"/") || r.pacienteId===protegida.uid || r.autorUid===protegida.uid || (typeof r.alvo==="string" && (r.alvo===perfilProtegido.path || r.alvo.startsWith(perfilProtegido.path+"/"))))return false;
  if(colecao==="usuarios")return excluir.has(id);
  if(colecao==="horariosReservados")return excluir.has(r.pacienteId);
  if(colecao==="profissionais")return excluir.has(id)||excluir.has(r.uid)||excluir.has(r.userId);
  if(colecao==="vinculosAgenda")return excluir.has(r.uid);
  if(colecao==="escalas")return excluir.has(r.profissionalId);
  if(colecao==="auditoria")return excluir.has(r.autorUid)||contemUid(r.alvo);
  return false;
}
const alvos=documentos.filter(pertenceExclusao);
if(alvos.some(d=>d.path===perfilProtegido.path || d.path.startsWith(perfilProtegido.path+"/") || d.data.pacienteId===protegida.uid))throw Error("Plano alcança dados protegidos. Nada foi apagado.");
const porColecao={};for(const d of alvos){const partes=d.path.split("/");const tipo=partes.length>2?`usuarios/*/${partes[2]}`:partes[0];porColecao[tipo]=(porColecao[tipo]??0)+1;}
const antes=await arvore(perfilProtegido);
const assinatura=lista=>createHash("sha256").update(JSON.stringify(lista.map(d=>({path:d.path,data:serializar(d.data)})).sort((a,b)=>a.path.localeCompare(b.path)))).digest("hex");
const assinaturaAntes=assinatura(antes);
const pasta=`.local/backups/limpeza-contas-${new Date().toISOString().replace(/[:.]/g,"-")}`;
await mkdir(pasta,{recursive:true});
await writeFile(`${pasta}/firestore.json`,JSON.stringify({projectId,criadoEm:new Date().toISOString(),documentos:documentos.map(d=>({path:d.path,data:serializar(d.data),updateTime:serializar(d.snap.updateTime)}))},null,2));
await writeFile(`${pasta}/authentication.json`,JSON.stringify({projectId,usuarios:contas.map(u=>u.toJSON())},null,2));
const plano={projeto:projectId,contaPreservada:email,contasRemover:excluir.size,documentosRemover:alvos.length,porColecao,assinaturaPerfilPreservado:assinaturaAntes,backupLocal:pasta,modo:aplicar?"aplicar":"simulação, sem alterações"};
await writeFile(`${pasta}/plano.json`,JSON.stringify({...plano,uidsRemover:[...excluir],documentosRemover:alvos.map(d=>d.path)},null,2));
console.log(JSON.stringify(plano,null,2));
if(!aplicar)process.exit(0);
// Desativa as contas alvo antes de remover seus dados. Nunca modifica a conta preservada.
for(const uid of excluir){if(uid===protegida.uid)throw Error("Conta protegida.");await auth.updateUser(uid,{disabled:true});}
// Cada exclusão exige a versão lida no inventário: alterações concorrentes não são apagadas silenciosamente.
for(let i=0;i<alvos.length;i+=200){const lote=db.batch();for(const d of alvos.slice(i,i+200))lote.delete(d.ref,{lastUpdateTime:d.snap.updateTime});await lote.commit();}
for(const uid of excluir){const ref=db.collection("usuarios").doc(uid);if((await arvore(ref)).length)throw Error("Dados novos detectados em uma conta alvo; revise a cópia local antes de continuar.");}
if(excluir.size){const remocao=await auth.deleteUsers([...excluir]);if(remocao.failureCount)throw Error(`Falha ao excluir ${remocao.failureCount} conta(s) Authentication.`);}
const restantes=await auth.listUsers(1000),perfis=await db.collection("usuarios").get(),depois=await arvore(perfilProtegido);
if(restantes.pageToken || restantes.users.length!==1 || restantes.users[0].uid!==protegida.uid || perfis.size!==1 || perfis.docs[0].id!==protegida.uid)throw Error("Conferência final das contas exige revisão.");
if(assinatura(depois)!==assinaturaAntes)throw Error("Os dados da conta preservada mudaram durante a execução; confira o backup e possíveis ações concorrentes.");
const resultado={concluido:true,contasRemovidas:excluir.size,documentosRemovidos:alvos.length,contasRestantes:1,perfilPreservadoSemAlteracoes:true,backupLocal:pasta};
await writeFile(`${pasta}/resultado.json`,JSON.stringify(resultado,null,2));console.log(JSON.stringify(resultado,null,2));
