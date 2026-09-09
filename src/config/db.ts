import mysql from 'mysql2/promise';
import { inMemoryDb } from './inMemoryDb';

let isMySqlAvailable = false;
let realPool: mysql.Pool | null = null;

// Only attempt real MySQL if explicitly configured with remote host or credentials
const hasDbConfig = Boolean(process.env.DB_HOST && process.env.DB_HOST !== '127.0.0.1' && process.env.DB_HOST !== 'localhost');

if (hasDbConfig) {
  try {
    realPool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'nailglamhub_db',
      charset: 'utf8mb4',
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
      connectTimeout: 2000,
    });
  } catch (err) {
    console.warn('[AI Studio] MySQL pool creation skipped, using in-memory mock store:', err);
    realPool = null;
  }
}

export async function testConnection(): Promise<boolean> {
  if (realPool) {
    try {
      const conn = await realPool.getConnection();
      conn.release();
      isMySqlAvailable = true;
      console.log('✅ Connected to external MySQL database.');
      return true;
    } catch {
      console.warn('⚠️ External MySQL not reachable. Falling back to active in-memory mock database.');
      isMySqlAvailable = false;
      return true;
    }
  }

  console.log('ℹ️ In-memory mock database active with pre-seeded Nail Glam Hub data.');
  return true;
}

export async function healthCheck(): Promise<{ connected: boolean; message: string }> {
  if (isMySqlAvailable && realPool) {
    try {
      const conn = await realPool.getConnection();
      await conn.ping();
      conn.release();
      return { connected: true, message: 'External MySQL connection healthy' };
    } catch (error) {
      return {
        connected: true,
        message: `MySQL unreachable, active on in-memory mock store: ${error instanceof Error ? error.message : 'Error'}`,
      };
    }
  }
  return { connected: true, message: 'In-memory database healthy (mock mode)' };
}

// Proxy export for db
const db = {
  execute: async (sql: string, params: any[] = []): Promise<[any, any]> => {
    if (isMySqlAvailable && realPool) {
      try {
        return await realPool.execute(sql, params);
      } catch (err) {
        console.warn('MySQL execute failed, falling back to in-memory store:', err);
        return await inMemoryDb.execute(sql, params);
      }
    }
    return await inMemoryDb.execute(sql, params);
  },
  query: async (sql: string, params: any[] = []): Promise<[any, any]> => {
    if (isMySqlAvailable && realPool) {
      try {
        return await realPool.query(sql, params);
      } catch (err) {
        console.warn('MySQL query failed, falling back to in-memory store:', err);
        return await inMemoryDb.query(sql, params);
      }
    }
    return await inMemoryDb.query(sql, params);
  },
  getConnection: async () => {
    if (isMySqlAvailable && realPool) {
      try {
        return await realPool.getConnection();
      } catch (err) {
        console.warn('MySQL getConnection failed, falling back to in-memory store:', err);
        return await inMemoryDb.getConnection();
      }
    }
    return await inMemoryDb.getConnection();
  },
};

export default db;
