import fs from 'fs';
import path from 'path';
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
  };

  constructor() {
    this.loadFromDisk();
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
      if (/WHERE LOWER\(email\)\s*=\s*LOWER\(\?\)\s+AND\s+id\s*!=\s*\?/i.test(sql)) {
        const email = String(params[0]).toLowerCase();
        const id = Number(params[1]);
        results = table.filter((u) => u.email.toLowerCase() === email && u.id !== id);
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
        return [table.filter((s) => s.id === id && s.salon_id === salonId), null];
      }
      if (/WHERE id\s*=\s*\?/i.test(sql)) {
        const id = Number(params[0]);
        return [table.filter((s) => s.id === id), null];
      }
      if (/WHERE salon_id\s*=\s*\?/i.test(sql)) {
        const salonId = Number(params[0]);
        return [table.filter((s) => s.salon_id === salonId), null];
      }
    }

    // 5. Technicians
    if (tableName === 'technicians') {
      if (/WHERE id\s*=\s*\?\s+AND\s+salon_id\s*=\s*\?/i.test(sql)) {
        const id = Number(params[0]);
        const salonId = Number(params[1]);
        return [table.filter((t) => t.id === id && t.salon_id === salonId), null];
      }
      if (/WHERE id\s*=\s*\?/i.test(sql)) {
        const id = Number(params[0]);
        return [table.filter((t) => t.id === id), null];
      }
      if (/WHERE salon_id\s*=\s*\?/i.test(sql)) {
        const salonId = Number(params[0]);
        return [table.filter((t) => t.salon_id === salonId), null];
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

      // Filter by customer_id or salon_id or technician_id
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
      if (/technician_id\s*=\s*\?/i.test(sql)) {
        const tId = Number(params[pIdx++]);
        filtered = filtered.filter((a) => a.technician_id === tId);
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
    };

    if (colMatch) {
      const columns = colMatch[1].split(',').map((c) => c.trim().replace(/[`]/g, ''));
      columns.forEach((col, index) => {
        if (index < params.length) {
          record[col] = params[index];
        }
      });
    }

    table.push(record);
    this.saveToDisk();
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
          assignments.forEach((assignment, index) => {
            const colName = assignment.split('=')[0].trim().replace(/[`]/g, '');
            if (index < params.length - 1) {
              record[colName] = params[index];
            }
          });
        }
        record.updated_at = new Date().toISOString();
        this.saveToDisk();
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
      this.tables[tableName] = table.filter((item) => item.salon_id !== salonId);
      this.saveToDisk();
      return [{ affectedRows: prevLen - this.tables[tableName].length }, null];
    }

    if (/WHERE id\s*=\s*\?/i.test(sql)) {
      const id = Number(params[0]);
      const index = table.findIndex((item) => item.id === id);
      if (index !== -1) {
        table.splice(index, 1);
        this.saveToDisk();
        return [{ affectedRows: 1 }, null];
      }
    }

    return [{ affectedRows: 0 }, null];
  }
}

export const inMemoryDb = new InMemoryDatabase();
