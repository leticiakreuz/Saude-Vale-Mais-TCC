import "server-only";

import {
    cert,
    getApps,
    initializeApp,
} from "firebase-admin/app";

import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Configurações privadas do Firebase Admin
const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;

const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY
    ?.trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\\n/g, "\n");

// Inicializar o Firebase Admin
function inicializarFirebaseAdmin() {
    // Evitar inicializações duplicadas
    const aplicativos = getApps();

    if (aplicativos.length > 0) {
        return aplicativos[0];
    }

    // Verificar as variáveis de ambiente
    if (!projectId || !clientEmail || !privateKey) {
        throw new Error(
            "As variáveis de ambiente do Firebase Admin não foram configuradas."
        );
    }

    // Inicializar o aplicativo
    return initializeApp({
        credential: cert({
            projectId,
            clientEmail,
            privateKey,
        }),
    });
}

// Instância do Firebase Admin
const adminApp = inicializarFirebaseAdmin();

// Autenticação
export const adminAuth = getAuth(adminApp);

// Banco de dados Firestore
export const adminDb = getFirestore(adminApp);