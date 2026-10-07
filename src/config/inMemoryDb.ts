import fs from 'fs';
import path from 'path';
import { db as firestoreDb } from '../lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import {
  seedCategories,
  seedUsers,
  seedSalons,
  seedServices,
  seedTechnicians,
  seedWorkingHours,
  seedAppointments,
  seedReviews,
  seedReels,
  seedPromotions,
  seedAnnouncements,
  seedProducts,
  seedProductOrders,
} from '../data/seedData';

const DB_FILE = path.join(process.cwd(), 'src', 'data', 'persisted_db.json');

function cleanForFirestore(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) return obj.map(cleanForFirestore);
  if (typeof obj === 'object') {
    const res: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined) {
        res[k] = cleanForFirestore(v);
      }
    }
    return res;
  }
  return obj;
}

class InMemoryDatabase {
  private tables: Record<string, any[]> = {
    business_categories: JSON.parse(JSON.stringify(seedCategories)),
    users: JSON.parse(JSON.stringify(seedUsers)),
    salons: JSON.parse(JSON.stringify(seedSalons)),
    services: JSON.parse(JSON.stringify(seedServices)),
    technicians: JSON.parse(JSON.stringify(seedTechnicians)),
    working_hours: JSON.parse(JSON.stringify(seedWorkingHours)),
    appointments: JSON.parse(JSON.stringify(seedAppointments)),
    reviews: JSON.parse(JSON.stringify(seedReviews)),
    reels: JSON.parse(JSON.stringify(seedReels)),
    promotions: JSON.parse(JSON.stringify(seedPromotions)),
    announcements: JSON.parse(JSON.stringify(seedAnnouncements)),
    products: JSON.parse(JSON.stringify(seedProducts)),
    product_orders: JSON.parse(JSON.stringify(seedProductOrders)),
    transactions: [],
    email_logs: [],
  };

  constructor() {
    this.loadFromDisk();
  }

  public reloadFromDisk(): boolean {
    return this.loadFromDisk();
  }

  private loadFromDisk(): boolean {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        if (raw.trim()) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            for (const key of Object.keys(this.tables)) {
              if (Array.isArray(parsed[key]) && parsed[key].length > 0) {
                this.tables[key] = parsed[key];
              }
            }
            console.log(`[Database] Successfully loaded persisted records from disk (${DB_FILE})`);
            return true;
          }
        }
      }
    } catch (err) {
      console.warn('[Database] Failed to load persisted database from disk:', err);
    }
    return false;
  }

  private saveToDisk() {
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.tables, null, 2), 'utf-8');
    } catch (err) {
      console.warn('[Database] Failed to save database to disk:', err);
    }
  }

  /**
   * Pulls all live records from Cloud Firestore to ensure real-time parity with Firebase.
   */
  public async syncFromFirestore(): Promise<number> {
    const collectionsToSync: { table: string; col: string }[] = [
      { table: 'business_categories', col: 'categories' },
      { table: 'users', col: 'users' },
      { table: 'salons', col: 'salons' },
      { table: 'services', col: 'services' },
      { table: 'technicians', col: 'technicians' },
      { table: 'working_hours', col: 'working_hours' },
      { table: 'appointments', col: 'appointments' },
      { table: 'reviews', col: 'reviews' },
      { table: 'reels', col: 'reels' },
      { table: 'promotions', col: 'promotions' },
      { table: 'announcements', col: 'announcements' },
      { table: 'products', col: 'products' },
      { table: 'product_orders', col: 'product_orders' },
      { table: 'transactions', col: 'transactions' },
      { table: 'email_logs', col: 'email_logs' },
    ];

    let totalLoaded = 0;
    for (const { table, col } of collectionsToSync) {
      try {
        const snap = await getDocs(collection(firestoreDb, col));
        if (!snap.empty) {
          const docs: any[] = [];
          snap.forEach((d) => {
            const data = d.data();
            const idVal = data.id !== undefined ? (isNaN(Number(data.id)) ? data.id : Number(data.id)) : (isNaN(Number(d.id)) ? d.id : Number(d.id));
            docs.push({ ...data, id: idVal });
          });
          if (docs.length > 0) {
            this.tables[table] = docs;
            totalLoaded += docs.length;
          }
        }
      } catch (err: any) {
        console.warn(`[Firestore Sync] Could not pull collection "${col}":`, err?.message || err);
      }
    }
    console.log(`🔥 [Firestore] Successfully synchronized ${totalLoaded} live documents into database layer.`);
    this.saveToDisk();
    return totalLoaded;
  }

  /**
   * Asynchronously persists mutations to Cloud Firestore.
   */
  private syncToFirestore(tableName: string, action: 'set' | 'delete', id: number | string, data?: any) {
    try {
      const colName = tableName === 'business_categories' ? 'categories' : tableName;
      const docRef = doc(firestoreDb, colName, String(id));
      if (action === 'delete') {
        deleteDoc(docRef).catch((err) => {
          const msg = err?.message || String(err);
          if (!msg.includes('UNAVAILABLE') && !msg.includes('unavailable')) {
            console.warn(`[Firestore] Sync note for "${colName}/${id}":`, msg);
          }
        });
      } else if (data) {
        const clean = cleanForFirestore(data);
        setDoc(docRef, clean, { merge: true }).catch((err) => {
          const msg = err?.message || String(err);
          if (!msg.includes('UNAVAILABLE') && !msg.includes('unavailable')) {
            console.warn(`[Firestore] Sync note for "${colName}/${id}":`, msg);
          }
        });
      }
    } catch (err: any) {
      // Safe catch for network stream drop
    }
  }

  private getNextId(tableName: string): number {
    const table = this.tables[tableName] || [];
    const maxId = table.reduce((max, item) => (item.id > max ? item.id : max), 0);
    return maxId + 1;
  }

  public async execute(sql: string, params: any[] = []): Promise<[any, any]> {
    const cleanSql = sql.trim().replace(/\s+/g, ' ');

    // 1. SELECT
    if (/^SELECT/i.test(cleanSql)) {
      return this.handleSelect(cleanSql, params);
    }

    // 2. INSERT
    if (/^INSERT INTO/i.test(cleanSql)) {
      return this.handleInsert(cleanSql, params);
    }

    // 3. UPDATE
    if (/^UPDATE/i.test(cleanSql)) {
      return this.handleUpdate(cleanSql, params);
    }

    // 4. DELETE
    if (/^DELETE FROM/i.test(cleanSql)) {
      return this.handleDelete(cleanSql, params);
    }

    return [[], null];
  }

  public async query(sql: string, params: any[] = []): Promise<[any, any]> {
    return this.execute(sql, params);
  }

  public async getConnection(): Promise<any> {
    return {
      beginTransaction: async () => {},
      commit: async () => {},
      rollback: async () => {},
      release: () => {},
      execute: (sql: string, params?: any[]) => this.execute(sql, params),
      query: (sql: string, params?: any[]) => this.query(sql, params),
    };
  }

  private getTableName(sql: string, pattern: RegExp): string {
    const match = sql.match(pattern);
    return match ? match[1].toLowerCase().replace(/[`]/g, '') : '';
  }

  private handleSelect(sql: string, params: any[]): [any[], null] {
    const tableName = this.getTableName(sql, /FROM\s+([`\w]+)/i);
    const table = this.tables[tableName];

    if (!table) {
      return [[], null];
    }

    let results = [...table];

    // Check for specific queries
    // 1. Category name by id: SELECT category_name FROM business_categories WHERE id = ?
    if (tableName === 'business_categories' && /WHERE id\s*=\s*\?/i.test(sql)) {
      const id = Number(params[0]);
      const found = table.filter((r) => r.id === id);
      return [found.map((r) => ({ category_name: r.category_name })), null];
    }

    // 2. User queries
    if (tableName === 'users') {
      if (/WHERE LOWER\(email\)\s*=\s*LOWER\(\?\)\s+AND\s+id\s*(!=|<>)\s*\?/i.test(sql)) {
        const email = String(params[0]).toLowerCase();
        const id = Number(params[1]);
        results = table.filter((u) => (u.email || '').toLowerCase() === email && u.id !== id);
        return [results.map((u) => ({ id: u.id })), null];
      }
      if (/WHERE LOWER\(email\)\s*=\s*LOWER\(\?\)/i.test(sql)) {
        const email = String(params[0]).toLowerCase();
        results = table.filter((u) => u.email.toLowerCase() === email);
        return [results, null];
      }
      if (/WHERE id\s*=\s*\?\s+AND\s+user_type\s*=\s*'salon_owner'\s+AND\s+status\s*=\s*'active'/i.test(sql)) {
        const id = Number(params[0]);
        results = table.filter((u) => u.id === id && u.user_type === 'salon_owner' && u.status === 'active');
        return [results, null];
      }
      if (/WHERE id\s*=\s*\?/i.test(sql)) {
        const id = Number(params[0]);
        results = table.filter((u) => u.id === id);
        return [results, null];
      }
    }

    // 3. Salon queries
    if (tableName === 'salons') {
      if (/WHERE id\s*=\s*\?/i.test(sql)) {
        const id = Number(params[0]);
        results = table.filter((s) => s.id === id);
        return [results, null];
      }

      // Dynamic filter for salons in /api/salons
      if (/is_active\s*=\s*1/i.test(sql)) {
        results = results.filter((s) => Boolean(s.is_active));
      }
      if (/verification_status\s*=\s*'verified'/i.test(sql)) {
        results = results.filter((s) => s.verification_status === 'verified');
      }

      // Parse WHERE conditions with '?' in the exact order of appearance
      const matches = Array.from(sql.matchAll(/([a-zA-Z0-9_]+)\s*=\s*\?/g));
      for (let i = 0; i < matches.length; i++) {
        const col = matches[i][1].toLowerCase();
        const val = params[i];
        if (col === 'owner_id' && val !== undefined) {
          results = results.filter((s) => Number(s.owner_id) === Number(val));
        } else if (col === 'category_id' && val !== undefined) {
          results = results.filter((s) => Number(s.category_id) === Number(val));
        }
      }

      if (/(salon_name LIKE \? OR description LIKE \? OR address LIKE \?)/i.test(sql)) {
        const likeIdx = matches.length;
        const term = String(params[likeIdx] || '').replace(/%/g, '').toLowerCase();
        if (term) {
          results = results.filter((s) =>
            (s.salon_name || '').toLowerCase().includes(term) ||
            (s.description || '').toLowerCase().includes(term) ||
            (s.address || '').toLowerCase().includes(term)
          );
        }
      }
      return [results, null];
    }

    // 4. Services
    if (tableName === 'services') {
      if (/WHERE id\s*=\s*\?\s+AND\s+salon_id\s*=\s*\?/i.test(sql)) {
        const id = Number(params[0]);
        const salonId = Number(params[1]);
        return [table.filter((s) => Number(s.id) === id && Number(s.salon_id) === salonId), null];
      }
      if (/WHERE id\s*=\s*\?/i.test(sql)) {
        const id = Number(params[0]);
        return [table.filter((s) => Number(s.id) === id), null];
      }
      if (/WHERE salon_id\s*=\s*\?/i.test(sql)) {
        const salonId = Number(params[0]);
        return [table.filter((s) => Number(s.salon_id) === salonId), null];
      }
      if (/WHERE salon_id\s+IN\s*\(([^)]+)\)/i.test(sql)) {
        const ids = params.map((p) => Number(p));
        return [table.filter((s) => ids.includes(Number(s.salon_id))), null];
      }
    }

    // 5. Technicians
    if (tableName === 'technicians') {
      if (/WHERE id\s*=\s*\?\s+AND\s+salon_id\s*=\s*\?/i.test(sql)) {
        const id = Number(params[0]);
        const salonId = Number(params[1]);
        return [table.filter((t) => Number(t.id) === id && Number(t.salon_id) === salonId), null];
      }
      if (/WHERE id\s*=\s*\?/i.test(sql)) {
        const id = Number(params[0]);
        return [table.filter((t) => Number(t.id) === id), null];
      }
      if (/WHERE salon_id\s*=\s*\?/i.test(sql)) {
        const salonId = Number(params[0]);
        return [table.filter((t) => Number(t.salon_id) === salonId), null];
      }
      if (/WHERE salon_id\s+IN\s*\(([^)]+)\)/i.test(sql)) {
        const ids = params.map((p) => Number(p));
        return [table.filter((t) => ids.includes(Number(t.salon_id))), null];
      }
    }

    // 6. Working hours
    if (tableName === 'working_hours') {
      if (/WHERE salon_id\s*=\s*\?/i.test(sql)) {
        const salonId = Number(params[0]);
        return [table.filter((w) => w.salon_id === salonId), null];
      }
    }

    // 7. Appointments
    if (tableName === 'appointments') {
      if (/WHERE id\s*=\s*\?/i.test(sql)) {
        const id = Number(params[0]);
        return [table.filter((a) => a.id === id), null];
      }
      if (/WHERE transaction_reference\s*=\s*\?/i.test(sql)) {
        const ref = String(params[0]);
        return [table.filter((a) => a.transaction_reference === ref && a.transaction_reference !== ''), null];
      }
      if (/WHERE service_id\s*=\s*\?\s+AND\s+status\s+IN/i.test(sql)) {
        const sId = Number(params[0]);
        return [table.filter((a) => a.service_id === sId && ['pending', 'confirmed'].includes(a.status)), null];
      }
      if (/WHERE technician_id\s*=\s*\?\s+AND\s+status\s+IN/i.test(sql)) {
        const tId = Number(params[0]);
        return [table.filter((a) => a.technician_id === tId && ['pending', 'confirmed'].includes(a.status)), null];
      }
      if (/WHERE technician_id\s*=\s*\?\s+AND\s+appointment_date\s*=\s*\?\s+AND\s+appointment_time\s*=\s*\?/i.test(sql)) {
        const tId = Number(params[0]);
        const date = String(params[1]);
        const time = String(params[2]);
        return [
          table.filter(
            (a) =>
              a.technician_id === tId &&
              a.appointment_date === date &&
              a.appointment_time === time &&
              ['pending', 'confirmed'].includes(a.status)
          ),
          null,
        ];
      }

      // Filter by dynamic criteria: customer_id, salon_id, technician_id, date, time, status, reference
      let filtered = [...table];
      let pIdx = 0;
      if (/customer_id\s*=\s*\?/i.test(sql)) {
        const cId = Number(params[pIdx++]);
        filtered = filtered.filter((a) => a.customer_id === cId);
      }
      if (/salon_id\s*=\s*\?/i.test(sql)) {
        const sId = Number(params[pIdx++]);
        filtered = filtered.filter((a) => a.salon_id === sId);
      }
      if (/appointment_date\s*=\s*\?/i.test(sql)) {
        const aDate = String(params[pIdx++]);
        filtered = filtered.filter((a) => a.appointment_date === aDate);
      }
      if (/appointment_time\s*=\s*\?/i.test(sql)) {
        const aTime = String(params[pIdx++]);
        filtered = filtered.filter((a) => a.appointment_time === aTime);
      }
      if (/technician_id\s*=\s*\?/i.test(sql)) {
        const tId = params[pIdx++];
        if (tId !== null && tId !== undefined) {
          filtered = filtered.filter((a) => a.technician_id === Number(tId));
        }
      }
      if (/transaction_reference\s*=\s*\?/i.test(sql)) {
        const tRef = String(params[pIdx++]);
        filtered = filtered.filter((a) => a.transaction_reference === tRef);
      }
      if (/status\s+IN\s+\('pending',\s*'confirmed'\)/i.test(sql)) {
        filtered = filtered.filter((a) => ['pending', 'confirmed'].includes(a.status));
      }

      if (/SELECT\s+COUNT\(\*\)\s+as\s+(\w+)/i.test(sql)) {
        const aliasMatch = sql.match(/SELECT\s+COUNT\(\*\)\s+as\s+(\w+)/i);
        const alias = aliasMatch ? aliasMatch[1] : 'count';
        return [[{ [alias]: filtered.length, count: filtered.length, total: filtered.length, booked: filtered.length }], null];
      }

      if (/ORDER BY\s+(appointment_date|created_at)\s+DESC/i.test(sql)) {
        filtered.sort((a, b) => new Date(b.appointment_date || b.created_at).getTime() - new Date(a.appointment_date || a.created_at).getTime());
      }
      return [filtered, null];
    }

    // 8. Reviews
    if (tableName === 'reviews') {
      if (/WHERE id\s*=\s*\?/i.test(sql)) {
        const id = Number(params[0]);
        return [table.filter((r) => r.id === id), null];
      }
      if (/WHERE salon_id\s*=\s*\?/i.test(sql)) {
        const salonId = Number(params[0]);
        return [table.filter((r) => r.salon_id === salonId), null];
      }
    }

    // 9. Reels
    if (tableName === 'reels') {
      if (/WHERE id\s*=\s*\?/i.test(sql)) {
        const id = Number(params[0]);
        return [table.filter((r) => r.id === id), null];
      }
    }

    // 10. Promotions
    if (tableName === 'promotions') {
      if (/WHERE id\s*=\s*\?/i.test(sql)) {
        const id = Number(params[0]);
        return [table.filter((p) => p.id === id), null];
      }
    }

    // 11. Announcements
    if (tableName === 'announcements') {
      if (/WHERE id\s*=\s*\?/i.test(sql)) {
        const id = Number(params[0]);
        return [table.filter((a) => a.id === id), null];
      }
      let filtered = [...table];
      let pIdx = 0;
      if (/target_audience\s+IN\s+\(\?,\s*'all'\)/i.test(sql)) {
        const aud = String(params[pIdx++]);
        filtered = filtered.filter((a) => a.target_audience === 'all' || a.target_audience === aud);
      }
      if (/is_active\s*=\s*1/i.test(sql)) {
        filtered = filtered.filter((a) => Boolean(a.is_active));
      }
      return [filtered, null];
    }

    // 12. Products
    if (tableName === 'products') {
      if (/WHERE id\s*=\s*\?/i.test(sql)) {
        const id = Number(params[0]);
        return [table.filter((p) => p.id === id), null];
      }
      let filtered = [...table];
      if (/WHERE salon_id\s*=\s*\?/i.test(sql)) {
        const salonId = Number(params[0]);
        filtered = filtered.filter((p) => Number(p.salon_id) === salonId);
      }
      return [filtered, null];
    }

    // 13. Product Orders
    if (tableName === 'product_orders') {
      if (/WHERE id\s*=\s*\?/i.test(sql)) {
        const id = Number(params[0]);
        return [table.filter((o) => o.id === id), null];
      }
      let filtered = [...table];
      if (/WHERE customer_id\s*=\s*\?/i.test(sql)) {
        const customerId = Number(params[0]);
        filtered = filtered.filter((o) => Number(o.customer_id) === customerId);
      } else if (/WHERE salon_id\s*=\s*\?/i.test(sql)) {
        const salonId = Number(params[0]);
        filtered = filtered.filter((o) => Number(o.salon_id) === salonId);
      }
      return [filtered, null];
    }

    // 12. Email logs
    if (tableName === 'email_logs') {
      let filtered = [...table];
      if (/WHERE LOWER\(recipient_email\)\s*=\s*LOWER\(\?\)/i.test(sql)) {
        const email = String(params[0]).toLowerCase();
        filtered = filtered.filter((l) => (l.recipient_email || '').toLowerCase() === email);
      } else if (/WHERE recipient_role\s*=\s*\?/i.test(sql)) {
        const role = String(params[0]);
        filtered = filtered.filter((l) => l.recipient_role === role);
      }
      filtered.sort((a, b) => new Date(b.sent_at || 0).getTime() - new Date(a.sent_at || 0).getTime());
      return [filtered, null];
    }

    // Fallback for sorting
    if (/ORDER BY\s+id\s+ASC/i.test(sql)) {
      results.sort((a, b) => a.id - b.id);
    } else if (/ORDER BY\s+created_at\s+DESC/i.test(sql)) {
      results.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    }

    return [results, null];
  }

  private handleInsert(sql: string, params: any[]): [{ insertId: number; affectedRows: number }, null] {
    const tableName = this.getTableName(sql, /INTO\s+([`\w]+)/i);
    const table = this.tables[tableName] || (this.tables[tableName] = []);

    // Extract column names inside parentheses: INSERT INTO <table> (<col1>, <col2>, ...) VALUES
    const colMatch = sql.match(/INSERT\s+INTO\s+[`\w]+\s*\(([^)]+)\)/i);
    const record: any = {
      id: this.getNextId(tableName),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...(tableName === 'services' ? { is_active: true } : {}),
      ...(tableName === 'technicians' ? { is_available: true } : {}),
    };

    if (colMatch) {
      const columns = colMatch[1].split(',').map((c) => c.trim().replace(/[`]/g, ''));
      columns.forEach((col, index) => {
        if (index < params.length) {
          record[col] = params[index];
        }
      });
    }

    // Guard against duplicate appointment insertions
    if (tableName === 'appointments') {
      if (record.transaction_reference && String(record.transaction_reference).trim() !== '') {
        const existingByRef = table.find(
          (a) => a.transaction_reference && String(a.transaction_reference).trim() === String(record.transaction_reference).trim()
        );
        if (existingByRef) {
          return [{ insertId: Number(existingByRef.id), affectedRows: 0 }, null];
        }
      }

      // Check same customer, salon, date, time slot
      const existingSlot = table.find(
        (a) =>
          Number(a.customer_id) === Number(record.customer_id) &&
          Number(a.salon_id) === Number(record.salon_id) &&
          String(a.appointment_date) === String(record.appointment_date) &&
          String(a.appointment_time) === String(record.appointment_time) &&
          ['pending', 'confirmed'].includes(a.status)
      );
      if (existingSlot) {
        return [{ insertId: Number(existingSlot.id), affectedRows: 0 }, null];
      }
    }

    table.push(record);
    this.saveToDisk();
    this.syncToFirestore(tableName, 'set', record.id, record);
    return [{ insertId: record.id, affectedRows: 1 }, null];
  }

  private handleUpdate(sql: string, params: any[]): [{ affectedRows: number; changedRows: number }, null] {
    const tableName = this.getTableName(sql, /UPDATE\s+([`\w]+)/i);
    const table = this.tables[tableName] || [];

    // Check if updating by ID (last parameter is usually WHERE id = ?)
    const whereIdMatch = sql.match(/WHERE\s+id\s*=\s*\?/i);
    const whereReelMatch = sql.match(/WHERE\s+id\s*=\s*\?/i);

    if (whereIdMatch || whereReelMatch) {
      const id = Number(params[params.length - 1]);
      const record = table.find((item) => item.id === id);

      if (record) {
        // Parse SET clause: SET col1 = ?, col2 = ? ...
        const setMatch = sql.match(/SET\s+(.+?)\s+WHERE/i);
        if (setMatch) {
          const assignments = setMatch[1].split(',').map((s) => s.trim());
          let paramIdx = 0;
          assignments.forEach((assignment) => {
            const parts = assignment.split('=');
            const colName = parts[0].trim().replace(/[`]/g, '');
            const rawVal = parts.slice(1).join('=').trim();

            if (rawVal === '?') {
              if (paramIdx < params.length - 1) {
                record[colName] = params[paramIdx++];
              }
            } else if (/COALESCE\([^,]+,\s*\?\)/i.test(rawVal)) {
              const fallbackVal = paramIdx < params.length - 1 ? params[paramIdx++] : null;
              record[colName] = record[colName] ?? fallbackVal;
            } else if (/^\d+$/.test(rawVal)) {
              record[colName] = Number(rawVal);
            } else if (/^'([^']*)'$/.test(rawVal)) {
              record[colName] = rawVal.slice(1, -1);
            } else if (rawVal.toLowerCase() === 'null') {
              record[colName] = null;
            } else if (rawVal.toLowerCase() === 'true') {
              record[colName] = 1;
            } else if (rawVal.toLowerCase() === 'false') {
              record[colName] = 0;
            } else if (paramIdx < params.length - 1) {
              record[colName] = params[paramIdx++];
            }
          });
        }
        record.updated_at = new Date().toISOString();
        this.saveToDisk();
        this.syncToFirestore(tableName, 'set', record.id, record);
        return [{ affectedRows: 1, changedRows: 1 }, null];
      }
    }

    return [{ affectedRows: 0, changedRows: 0 }, null];
  }

  private handleDelete(sql: string, params: any[]): [{ affectedRows: number }, null] {
    const tableName = this.getTableName(sql, /FROM\s+([`\w]+)/i);
    const table = this.tables[tableName] || [];

    if (/WHERE salon_id\s*=\s*\?/i.test(sql)) {
      const salonId = Number(params[0]);
      const prevLen = table.length;
      const toRemove = table.filter((item) => item.salon_id === salonId);
      this.tables[tableName] = table.filter((item) => item.salon_id !== salonId);
      this.saveToDisk();
      for (const item of toRemove) {
        this.syncToFirestore(tableName, 'delete', item.id);
      }
      return [{ affectedRows: prevLen - this.tables[tableName].length }, null];
    }

    if (/WHERE id\s*=\s*\?/i.test(sql)) {
      const id = Number(params[0]);
      const index = table.findIndex((item) => item.id === id);
      if (index !== -1) {
        table.splice(index, 1);
        this.saveToDisk();
        this.syncToFirestore(tableName, 'delete', id);
        return [{ affectedRows: 1 }, null];
      }
    }

    return [{ affectedRows: 0 }, null];
  }
}

export const inMemoryDb = new InMemoryDatabase();
