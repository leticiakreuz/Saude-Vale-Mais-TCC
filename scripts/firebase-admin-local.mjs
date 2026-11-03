import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
export function conectar() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  if (!projectId) throw new Error("Defina FIREBASE_ADMIN_PROJECT_ID no ambiente ou no .env.local.");
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.trim().replace(/^["']|["']$/g, "").replace(/\\n/g, "\n");
  if ((!clientEmail || !privateKey) && !process.env.GOOGLE_APPLICATION_CREDENTIALS) throw new Error("Configure Firebase Admin ou GOOGLE_APPLICATION_CREDENTIALS. Mantenha a chave fora do repositório.");
  const app = getApps()[0] ?? initializeApp({ projectId, credential: clientEmail && privateKey ? cert({ projectId, clientEmail, privateKey }) : applicationDefault() });
  return { auth: getAuth(app), db: getFirestore(app), projectId };
}
export function argumentos() {
  const args = process.argv.slice(2), saida = {};
  for (let i = 0; i < args.length; i += 2) {
    if (!args[i].startsWith("--") || !args[i + 1]) throw new Error("Use argumentos no formato --campo valor.");
    saida[args[i].slice(2)] = args[i + 1];
  }
  return saida;
}
