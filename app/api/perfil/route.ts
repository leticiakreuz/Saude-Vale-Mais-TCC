import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";
import { autenticar } from "@/lib/profissionais/autorizacao";
import { dadosCadastro, ErroCadastro } from "@/lib/cadastro/validacao";
import { resolverEndereco } from "@/lib/cadastro/endereco";
import { corpoCadastro, falhaCadastro } from "@/lib/cadastro/http";
export const runtime="nodejs";
export async function POST(request:Request) {
  try {
    const token=await autenticar(request);
    const entrada=await corpoCadastro(request);
    const ref=adminDb.collection("usuarios").doc(token.uid);
    const snap=await ref.get();
    const anterior=snap.data() ?? {};
    // Seções do perfil são mescladas e sempre validadas integralmente.
    const dados=dadosCadastro({...anterior,...entrada});
    if (anterior.cadastroVersao===2 && (dados.cpf!==anterior.cpf || dados.dataNascimento!==anterior.dataNascimento)) throw new ErroCadastro("CPF e data de nascimento já cadastrados não podem ser alterados aqui.");
    if (dados.emailResponsavel && dados.emailResponsavel.toLowerCase()===token.email?.toLowerCase()) throw new ErroCadastro("O e-mail do responsável deve ser diferente do e-mail da criança.");
    const endereco=await resolverEndereco(dados);
    const gravado={...dados,...endereco,uid:token.uid,email:token.email ?? "",cartaoSus:dados.numeroSUS,cadastroVersao:2,perfilAtualizadoEm:FieldValue.serverTimestamp()};
    await adminDb.runTransaction(async tx=>{
      const [atual,controle]=await Promise.all([tx.get(ref),tx.get(ref.collection("controleAgendamento").doc("ativo"))]);
      if (controle.data()?.agendamentoId && atual.data()?.unidadeReferencia!==endereco.unidadeReferencia) throw new ErroCadastro("Há uma consulta ativa. Confirme a transferência de UBS com a unidade antes de mudar o endereço.",409);
      // Evita sobrescrever uma edição concorrente do perfil.
      if (snap.updateTime?.toMillis()!==atual.updateTime?.toMillis()) throw new ErroCadastro("Seu perfil mudou. Recarregue a página e tente novamente.",409);
      tx.set(ref,{...gravado,...(!atual.exists ? {criadoEm:FieldValue.serverTimestamp()} : {})},{merge:true});
    });
    return Response.json({perfil:{...dados,...endereco,cadastroVersao:2},mensagem:"Cadastro completo e UBS vinculada."},{headers:{"Cache-Control":"no-store"}});
  } catch(e) { return falhaCadastro(e); }
}
