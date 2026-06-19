/**
 * Firebase initialisation for RadCalc Pro — single-center deployment (IMeNA, Côte d'Ivoire).
 *
 * Firestore is configured with persistent local cache so the app keeps working offline
 * (PWA) and syncs automatically when back online. Auth sessions persist in IndexedDB.
 *
 * Web config values are NOT secrets (they identify the project, not authorise it); access
 * is controlled by Firebase Auth + Firestore security rules (see firestore.rules).
 */
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  Firestore,
} from 'firebase/firestore';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
};

/** True when the build has a usable Firebase configuration. */
export const isFirebaseConfigured = Boolean(config.apiKey && config.projectId && config.appId);

let app: FirebaseApp | undefined;
let authInstance: Auth | undefined;
let dbInstance: Firestore | undefined;

// Optional non-default Firestore database id (this deployment reuses the existing
// AI-Studio-provisioned database rather than a billed "(default)" one).
const databaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID;

if (isFirebaseConfigured) {
  app = getApps().length ? getApps()[0] : initializeApp(config as Record<string, string>);
  authInstance = getAuth(app);
  const settings = {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    // Drop undefined fields at the SDK level (Firestore rejects them otherwise).
    ignoreUndefinedProperties: true,
  };
  try {
    dbInstance = databaseId
      ? initializeFirestore(app, settings, databaseId)
      : initializeFirestore(app, settings);
  } catch {
    // IndexedDB unavailable (private mode, disabled storage) → degrade to online-only.
    const fallback = { ignoreUndefinedProperties: true };
    dbInstance = databaseId ? initializeFirestore(app, fallback, databaseId) : initializeFirestore(app, fallback);
  }
}

// Consumers only touch these once `isFirebaseConfigured` is true (auth-gated UI), so the
// non-null assertion keeps call sites clean while the config screen handles the unset case.
export const auth = authInstance as Auth;
export const db = dbInstance as Firestore;
