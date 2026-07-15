import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";

let app: App | undefined;


// Configuración de la google outh. (Google Cloud)
function obtenerAppAdmin(): App {
  if (app) return app;

  const existente = getApps()[0];
  if (existente) {
    app = existente;
    return app;
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (serviceAccountJson) {
    app = initializeApp({
      credential: cert(JSON.parse(serviceAccountJson)),
    });
    return app;
  }

  if (projectId) {
    app = initializeApp({ projectId });
    return app;
  }

  throw new Error(
    "Firebase Admin no configurado. Define FIREBASE_SERVICE_ACCOUNT o NEXT_PUBLIC_FIREBASE_PROJECT_ID."
  );
}

export function obtenerFirebaseAuthAdmin(): Auth {
  return getAuth(obtenerAppAdmin());
}
