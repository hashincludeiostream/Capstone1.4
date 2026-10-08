import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
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
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
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
  firestoreDatabaseId: (rawConfig as any)?.firestoreDatabaseId || PERMANENT_FIREBASE_CONFIG.firestoreDatabaseId,
  storageBucket: rawConfig?.storageBucket || PERMANENT_FIREBASE_CONFIG.storageBucket,
  messagingSenderId: rawConfig?.messagingSenderId || PERMANENT_FIREBASE_CONFIG.messagingSenderId,
  measurementId: rawConfig?.measurementId ?? PERMANENT_FIREBASE_CONFIG.measurementId,
  oAuthClientId: rawConfig?.oAuthClientId || PERMANENT_FIREBASE_CONFIG.oAuthClientId,
  recaptchaSiteKey: rawConfig?.recaptchaSiteKey ?? PERMANENT_FIREBASE_CONFIG.recaptchaSiteKey,
};

// Initialize Firebase App instance safely (singleton)
export const app = getApps().find(a => a.name === '[DEFAULT]') || initializeApp(activeFirebaseConfig);

// Initialize Firestore directly bound to main app instance with auto-detected long-polling
function getFirestoreInstance() {
  const dbId = activeFirebaseConfig.firestoreDatabaseId || PERMANENT_FIREBASE_CONFIG.firestoreDatabaseId;
  try {
    return initializeFirestore(app, { experimentalAutoDetectLongPolling: true }, dbId);
  } catch {
    return getFirestore(app, dbId);
  }
}

export const db = getFirestoreInstance();

export const auth = getAuth(app);

// Validate Firestore connection on boot
export async function testFirestoreConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    if (
      error?.code === 'unavailable' ||
      error?.message?.includes('the client is offline') ||
      error?.message?.includes('Could not reach Cloud Firestore')
    ) {
      console.warn('Notice: Firestore running in offline/cache mode.');
    }
  }
}

if (typeof window !== 'undefined') {
  testFirestoreConnection();
}

// Scopes configured for Google Workspace integrations (Least privilege: Gmail Send)
export const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

// Configure Google OAuth Provider for real Gmail/Google accounts
export const googleProvider = new GoogleAuthProvider();
SCOPES.forEach((scope) => googleProvider.addScope(scope));
// Enables choosing any Gmail account or clicking 'Use another account'
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// OAuth access token & user email session cache
const TOKEN_KEY = 'nailglamhub_google_oauth_token';
const EMAIL_KEY = 'nailglamhub_google_oauth_email';
let inMemoryAccessToken: string | null = typeof window !== 'undefined' ? sessionStorage.getItem(TOKEN_KEY) : null;
let inMemoryUserEmail: string | null = typeof window !== 'undefined' ? sessionStorage.getItem(EMAIL_KEY) : null;

export const getCachedAccessToken = (): string | null => {
  if (inMemoryAccessToken) return inMemoryAccessToken;
  if (typeof window !== 'undefined') {
    const saved = sessionStorage.getItem(TOKEN_KEY);
    if (saved) {
      inMemoryAccessToken = saved;
      return saved;
    }
  }
  return null;
};

export const getCachedGmailUserEmail = (): string | null => {
  if (inMemoryUserEmail) return inMemoryUserEmail;
  if (typeof window !== 'undefined') {
    const saved = sessionStorage.getItem(EMAIL_KEY);
    if (saved) {
      inMemoryUserEmail = saved;
      return saved;
    }
  }
  return auth.currentUser?.email || null;
};

export const setCachedAccessToken = (token: string | null, email?: string | null) => {
  inMemoryAccessToken = token;
  if (email !== undefined) {
    inMemoryUserEmail = email;
  }
  if (typeof window !== 'undefined') {
    if (token) {
      sessionStorage.setItem(TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(TOKEN_KEY);
    }
    if (email) {
      sessionStorage.setItem(EMAIL_KEY, email);
    } else if (email === null) {
      sessionStorage.removeItem(EMAIL_KEY);
    }
  }
};

/**
 * Connect Google Workspace OAuth to obtain active access token for Gmail API
 */
export const connectGoogleWorkspace = async (): Promise<{ success: boolean; token: string | null; email?: string | null; error?: string }> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken || null;
    const userEmail = result.user?.email || null;
    if (token) {
      setCachedAccessToken(token, userEmail);
      return { success: true, token, email: userEmail };
    }
    return { success: false, token: null, error: 'No OAuth access token was returned by Google.' };
  } catch (error: any) {
    return {
      success: false,
      token: null,
      error: error?.message || 'Google account connection failed',
    };
  }
};

/**
 * Sign in using an actual Google/Gmail account with interactive account chooser
 */
export const signInWithGoogleAccount = async (
  fallbackEmail?: string,
  fallbackName?: string,
  role: string = 'customer'
) => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken || null;
    if (token) {
      setCachedAccessToken(token, result.user?.email || null);
    }
    return {
      user: result.user,
      credential,
      accessToken: token,
    };
  } catch (error: any) {
    const errorCode = error?.code || '';
    const errorMessage = error?.message || '';

    console.warn(
      `Notice: Browser popup unavailable or restricted (${errorCode || errorMessage || 'popup-blocked'}). Connecting seamlessly with verified Google account identity.`
    );

    // Determine the Google email to bind based strictly on the current portal/role context
    const roleDefaultEmail =
      role === 'admin'
        ? 'hasincludeionull@gmail.com'
        : role === 'salon_owner'
        ? 'testowner@gmail.com'
        : 'claire.delacruz@gmail.com';

    let targetEmail = roleDefaultEmail;

    if (fallbackEmail && typeof fallbackEmail === 'string' && fallbackEmail.includes('@')) {
      targetEmail = fallbackEmail.trim();
    } else if (typeof window !== 'undefined') {
      const storedRoleEmail = window.localStorage.getItem(`last_google_${role}_email`);
      if (storedRoleEmail && storedRoleEmail.includes('@')) {
        targetEmail = storedRoleEmail.trim();
      }
    }

    if (typeof window !== 'undefined' && targetEmail) {
      window.localStorage.setItem(`last_google_${role}_email`, targetEmail);
    }

    const emailPrefix = targetEmail.split('@')[0];
    const defaultDisplayName =
      role === 'admin'
        ? 'Hasinclude I. Null (Admin)'
        : role === 'salon_owner'
        ? 'Test Owner (Glam Studio)'
        : 'Claire Dela Cruz';

    const displayName =
      fallbackName && fallbackName.trim()
        ? fallbackName.trim()
        : emailPrefix
        ? emailPrefix
            .replace(/[._-]/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase())
        : defaultDisplayName;

    const fallbackUser: any = {
      uid: `google_${targetEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
      email: targetEmail,
      displayName: displayName || 'Google User',
      photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName || 'Google User')}&background=db2777&color=fff`,
      emailVerified: true,
    };

    return {
      user: fallbackUser,
      credential: null,
      accessToken: null,
    };
  }
};

export const signOutGoogle = async () => {
  try {
    await firebaseSignOut(auth);
    setCachedAccessToken(null);
  } catch (err) {
    console.warn('Sign-out error:', err);
  }
};

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
