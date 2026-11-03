import { createHash } from "node:crypto";
import { FieldPath } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";
import { autorizar, ErroAcesso, json, respostaErro } from "@/lib/profissionais/autorizacao";
import { cargoValido } from "@/lib/profissionais/modelos";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const administrador = await autorizar(request, "profissionais.gerenciar");
    const parametros = new URL(request.url).searchParams;
    const unidade = parametros.get("unidade")?.trim() || administrador.unidadeReferencia;
    if (unidade.length > 200) throw new ErroAcesso("UBS inválida.", 400);

    // Diretório solicitado: somente dados profissionais básicos. E-mails e permissões não saem desta API.
    const unidadesDocs = await adminDb.collection("profissionais")
      .select("unidadeReferencia").limit(5001).get();
    if (unidadesDocs.size > 5000) throw new ErroAcesso("O diretório precisa de paginação adicional de unidades.", 503);
    const unidades = [...new Set([administrador.unidadeReferencia, ...unidadesDocs.docs
      .map(d => d.data().unidadeReferencia)
      .filter((v): v is string => typeof v === "string" && Boolean(v.trim()))])]
      .sort((a, b) => a.localeCompare(b, "pt-BR"));
    if (unidade !== "*" && !unidades.includes(unidade)) throw new ErroAcesso("UBS não encontrada no diretório.", 404);

    let consulta = adminDb.collection("profissionais").orderBy(FieldPath.documentId());
    if (unidade !== "*") consulta = consulta.where("unidadeReferencia", "==", unidade);
    const cursor = parametros.get("cursor");
    if (cursor) {
      if (!/^[A-Za-z0-9_-]{1,200}$/.test(cursor)) throw new ErroAcesso("Página inválida.", 400);
      const id = Buffer.from(cursor, "base64url").toString("utf8");
      if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) throw new ErroAcesso("Página inválida.", 400);
      consulta = consulta.startAfter(id);
    }
    const documentos = await consulta.select("nome", "cargo", "registro", "ativo", "unidadeReferencia").limit(101).get();
    const pagina = documentos.docs.slice(0, 100);
    const funcionarios = pagina.flatMap(documento => {
      const dados = documento.data();
      if (!cargoValido(dados.cargo) || typeof dados.unidadeReferencia !== "string") return [];
      return [{
        id: createHash("sha256").update(documento.id).digest("hex"),
        nome: String(dados.nome ?? "Profissional"),
        cargo: dados.cargo,
        registro: String(dados.registro ?? ""),
        ativo: dados.ativo === true,
        unidadeReferencia: dados.unidadeReferencia,
      }];
    });
    return json({
      unidades, unidadeSelecionada: unidade, funcionarios,
      proximaPagina: documentos.size > 100 ? Buffer.from(pagina[pagina.length - 1].id).toString("base64url") : null,
    });
  } catch (erro) { return respostaErro(erro); }
}
