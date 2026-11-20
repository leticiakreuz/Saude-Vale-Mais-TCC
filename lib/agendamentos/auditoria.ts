import "server-only";
import { FieldValue, type Transaction } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";

export function auditoria(
  tx: Transaction,
  autor: { uid: string; unidadeReferencia: string },
  acao: string,
  alvo: string,
  antes: unknown,
  depois: unknown,
) {
  tx.create(adminDb.collection("auditoria").doc(), {
    autorUid: autor.uid,
    unidadeReferencia: autor.unidadeReferencia,
    acao,
    alvo,
    antes,
    depois,
    criadoEm: FieldValue.serverTimestamp(),
  });
}
