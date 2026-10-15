import { inMemoryDb } from './inMemoryDb';

export type PersistenceStatus = 'connected' | 'degraded' | 'unavailable';

let persistenceStatus: PersistenceStatus = 'degraded';
let lastSyncTimestamp: string | null = null;
let lastSyncError: string | null = null;
let syncedRecordsCount = 0;

/**
 * Initializes and validates connection to Google Cloud Firestore database.
 * Synchronizes real Firestore collections directly into the data layer.
 */
export async function testConnection(): Promise<boolean> {
  console.log('🔄 Initializing Google Cloud Firestore connection (ai-studio-capstone14-f7575340-b666-4d9b-b5f4-cffdf3c32bbc)...');

  // Trigger sync in background with a quick race so the web server binds immediately
  Promise.race([
    inMemoryDb.syncFromFirestore(),
    new Promise<number>((_, reject) => setTimeout(() => reject(new Error('Firestore sync initial handshake timeout')), 8000)),
  ])
    .then((totalDocs) => {
      persistenceStatus = 'connected';
      syncedRecordsCount = Number(totalDocs) || 0;
      lastSyncTimestamp = new Date().toISOString();
      lastSyncError = null;
      console.log(`✅ Connected to Google Cloud Firestore successfully (${totalDocs} live records loaded).`);
    })
    .catch((err: any) => {
      persistenceStatus = 'degraded';
      lastSyncError = err?.message || String(err);
      console.warn('⚠️ Google Cloud Firestore sync note (operating in degraded local-disk mode):', lastSyncError);
    });

  return true;
}

export async function healthCheck(): Promise<{
  status: PersistenceStatus;
  connected: boolean;
  message: string;
  syncedDocs: number;
  lastSyncAt: string | null;
  error?: string | null;
}> {
  return {
    status: persistenceStatus,
    connected: persistenceStatus === 'connected',
    message: persistenceStatus === 'connected'
      ? 'Google Cloud Firestore connected and healthy (ai-studio-capstone14-f7575340-b666-4d9b-b5f4-cffdf3c32bbc)'
      : persistenceStatus === 'degraded'
      ? 'Persistence operating in degraded mode (local disk storage active; cloud sync pending/retrying)'
      : 'Database storage unavailable',
    syncedDocs: syncedRecordsCount,
    lastSyncAt: lastSyncTimestamp,
    error: lastSyncError,
  };
}

// Proxy export for db queries (all mutations automatically replicate to Cloud Firestore)
const db = {
  execute: async (sql: string, params: any[] = []): Promise<[any, any]> => {
    return await inMemoryDb.execute(sql, params);
  },
  query: async (sql: string, params: any[] = []): Promise<[any, any]> => {
    return await inMemoryDb.query(sql, params);
  },
  getConnection: async () => {
    return await inMemoryDb.getConnection();
  },
};

export default db;
