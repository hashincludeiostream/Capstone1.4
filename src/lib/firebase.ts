import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  getDocFromServer,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import rawConfig from '../../firebase-applet-config.json';

// Permanent default configuration for Google Cloud Project gen-lang-client-0593264091.
// This guarantees that when this project is exported, shared, or imported across different
// Google AI Studio accounts or developers, it seamlessly connects to the live database
// without requiring repeated manual provisioning or setup steps.
export const PERMANENT_FIREBASE_CONFIG = {
  projectId: 'gen-lang-client-0593264091',
  appId: '1:497060162179:web:724eac523fe2ba79ff49b6',
  apiKey: 'AIzaSyDy-J8AsXi4611lIgNnsGk41juwfF8le50',
  authDomain: 'gen-lang-client-0593264091.firebaseapp.com',
  firestoreDatabaseId: 'ai-studio-capstone14-f7575340-b666-4d9b-b5f4-cffdf3c32bbc',
  storageBucket: 'gen-lang-client-0593264091.firebasestorage.app',
  messagingSenderId: '497060162179',
  measurementId: '',
  oAuthClientId: '497060162179-7ndqclbv7ni7g6r7apen070a5lg8cmvb.apps.googleusercontent.com',
  recaptchaSiteKey: '',
};

export const activeFirebaseConfig = {
  projectId: rawConfig?.projectId || PERMANENT_FIREBASE_CONFIG.projectId,
  appId: rawConfig?.appId || PERMANENT_FIREBASE_CONFIG.appId,
  apiKey: rawConfig?.apiKey || PERMANENT_FIREBASE_CONFIG.apiKey,
  authDomain: rawConfig?.authDomain || PERMANENT_FIREBASE_CONFIG.authDomain,
  firestoreDatabaseId: rawConfig?.firestoreDatabaseId || PERMANENT_FIREBASE_CONFIG.firestoreDatabaseId,
  storageBucket: rawConfig?.storageBucket || PERMANENT_FIREBASE_CONFIG.storageBucket,
  messagingSenderId: rawConfig?.messagingSenderId || PERMANENT_FIREBASE_CONFIG.messagingSenderId,
  measurementId: rawConfig?.measurementId ?? PERMANENT_FIREBASE_CONFIG.measurementId,
  oAuthClientId: rawConfig?.oAuthClientId || PERMANENT_FIREBASE_CONFIG.oAuthClientId,
  recaptchaSiteKey: rawConfig?.recaptchaSiteKey ?? PERMANENT_FIREBASE_CONFIG.recaptchaSiteKey,
};

// Initialize Firebase App instance safely (singleton)
export const app = getApps().length > 0 ? getApp() : initializeApp(activeFirebaseConfig);

// Initialize Firestore with specific database ID from configuration
export const db = activeFirebaseConfig.firestoreDatabaseId
  ? getFirestore(app, activeFirebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const auth = getAuth(app);

// Connection verification on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firebase] Client is operating in offline-cached mode.');
    }
  }
}
testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export {
  collection,
  doc,
  getDocs,
  getDoc,
  getDocFromServer,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  orderBy,
  serverTimestamp,
};
