import "server-only";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

// Inicialização adiada: importar uma rota no build não exige uma chave privada.
function servicos() {
  let app = getApps()[0];
  if (!app) {
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.trim().replace(/^["']|["']$/g, "").replace(/\\n/g, "\n");
    if (!projectId || !clientEmail || !privateKey) throw new Error("Firebase Admin não configurado. Confira as variáveis de ambiente do servidor.");
    app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  }
  return { auth: getAuth(app), db: getFirestore(app) };
}
function adiar<T extends object>(obter: () => T): T {
  return new Proxy({} as T, { get(_alvo, chave) { const instancia = obter(); const valor = Reflect.get(instancia, chave); return typeof valor === "function" ? valor.bind(instancia) : valor; } });
}
// Compatibilidade com os imports das APIs já existentes.
export const adminAuth: Auth = adiar(() => servicos().auth);
export const adminDb: Firestore = adiar(() => servicos().db);
