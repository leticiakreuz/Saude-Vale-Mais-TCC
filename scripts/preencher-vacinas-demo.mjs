// Somente demonstração do TCC: preserva os registros existentes e exige --aplicar.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import ts from "typescript";
import { FieldValue } from "firebase-admin/firestore";
import { conectar } from "./firebase-admin-local.mjs";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const exigir = createRequire(import.meta.url), cache = new Map();
function carregar(relativo) {
  const arquivo = path.resolve(raiz, relativo);
  if (cache.has(arquivo)) return cache.get(arquivo);
  const modulo = {exports: {}};
  const importar = nome => {
    if (!nome.startsWith(".") && !nome.startsWith("@/")) return exigir(nome);
    let destino = nome.startsWith("@/") ? path.resolve(raiz, nome.slice(2)) : path.resolve(path.dirname(arquivo), nome);
    if (!path.extname(destino)) destino += fs.existsSync(destino + ".ts") ? ".ts" : ".tsx";
    return carregar(destino);
  };
  const codigo = ts.transpileModule(fs.readFileSync(arquivo, "utf8"), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  new vm.Script("(function(require,module,exports){" + codigo + "\n})", {filename:arquivo}).runInThisContext()(importar, modulo, modulo.exports);
  cache.set(arquivo, modulo.exports);
  return modulo.exports;
}
const {gerarVacinasDemonstrativas,gerarCarteirinhasDemonstrativas} = carregar("lib/vacinacaoDemonstracao.ts");
const {avaliarComprovante} = carregar("lib/vacinacaoRegras.tsx");
const args = process.argv.slice(2), indiceEmail = args.indexOf("--email");
const email = args[indiceEmail + 1]?.trim().toLowerCase();
if (indiceEmail < 0 || !email?.includes("@")) throw new Error("Informe --email da conta autorizada. Use --aplicar para gravar.");
const {auth,db,projectId} = conectar();
if (projectId !== "saude-vale-mais") throw new Error("Este script é restrito ao projeto acadêmico saude-vale-mais.");
const usuario = await auth.getUserByEmail(email);
if (usuario.email?.toLowerCase() !== email) throw new Error("Conta diferente da solicitada.");
const ref = db.collection("usuarios").doc(usuario.uid), vacinas = ref.collection("vacinacao");
const dataBrasil = new Date().toLocaleDateString("en-CA", {timeZone:"America/Sao_Paulo"});
const hoje = new Date(dataBrasil + "T12:00:00Z");
const mapear = snapshot => snapshot.docs.map(d => ({...d.data(), id:d.id}));
const gravar = args.includes("--aplicar");
const gerar = args.includes("--todas-as-fases") ? gerarCarteirinhasDemonstrativas : gerarVacinasDemonstrativas;
const resultado = await db.runTransaction(async tx => {
  const [perfilDoc,registrosDoc] = await Promise.all([tx.get(ref),tx.get(vacinas)]);
  if (!perfilDoc.exists) throw new Error("Perfil não encontrado.");
  const perfil = perfilDoc.data(), registros = mapear(registrosDoc);
  const novos = gerar(perfil, registros, hoje);
  if (gravar) for (const {id,...registro} of novos) tx.create(vacinas.doc(id), {...registro,origem:"Dados fictícios autorizados para demonstração do TCC",criadoEm:FieldValue.serverTimestamp()});
  return {conta:email,fase:avaliarComprovante(perfil,registros,hoje).faseAtual,modo:gravar?"aplicado":"simulação sem gravação",registrosPreservados:registros.length,registrosCriados:novos.length,porFase:Object.fromEntries([...new Set(novos.map(r=>r.fase))].map(fase=>[fase,novos.filter(r=>r.fase===fase).length])),novos:novos.map(r=>({id:r.id,fase:r.fase,vacina:r.vacina,dose:r.dose,data:r.dataAplicacao})),checklistApto:avaliarComprovante(perfil,[...registros,...novos],hoje).apto};
});
if (gravar) {
  const [perfil,registros] = await Promise.all([ref.get(),vacinas.get()]);
  if (!avaliarComprovante(perfil.data(),mapear(registros),hoje).apto) throw new Error("A conferência após a gravação não confirmou o checklist.");
}
console.log(JSON.stringify(resultado,null,2));
