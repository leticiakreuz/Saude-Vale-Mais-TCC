import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { dadosConta, ErroCadastro } from "@/lib/cadastro/validacao";
import { corpoCadastro, falhaCadastro } from "@/lib/cadastro/http";
export const runtime="nodejs";
export async function POST(request:Request) {
  let uid:string|undefined;
  try {
    const entrada=await corpoCadastro(request,true);
    const dados=dadosConta(entrada);
    const email=dados.email;
    const senha=entrada.senha;
    if (typeof senha!=="string" || senha.length<6 || senha.length>128 || entrada.confirmarSenha!==senha) throw new ErroCadastro("Confira a senha e sua confirmação.");
    // O acesso aos serviços continua bloqueado até concluir o perfil após o login.
    const user=await adminAuth.createUser({email,password:senha,displayName:dados.nome,emailVerified:false,disabled:true});
    uid=user.uid;
    try {
      await adminDb.collection("usuarios").doc(uid).create({...dados,uid,emailVerificado:false,cadastroVersao:1,criadoEm:FieldValue.serverTimestamp()});
      await adminAuth.updateUser(uid,{disabled:false});
    } catch(e) {
      await adminAuth.updateUser(uid,{disabled:true}).catch(()=>{});
      await adminAuth.deleteUser(uid);
      await adminDb.collection("usuarios").doc(uid).delete();
      uid=undefined; throw e;
    }
    return Response.json({mensagem:"Conta criada. Depois de entrar, complete seu perfil para usar os serviços."},{status:201,headers:{"Cache-Control":"no-store"}});
  } catch(e) { return falhaCadastro(e); }
}
