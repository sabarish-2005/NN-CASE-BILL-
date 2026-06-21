import { getDb } from '../database';

export const settingsRepository = {
  async getSetting(key: string): Promise<string | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<{ value: string }>(
      'SELECT value FROM settings WHERE key = ?', [key]
    );
    return row ? row.value : null;
  },

  async setSetting(key: string, value: string): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      `INSERT INTO settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      [key, value]
    );
  },

  async setMultiple(entries: Record<string, string>): Promise<void> {
    const db = await getDb();
    for (const [key, value] of Object.entries(entries)) {
      await db.runAsync(
        `INSERT INTO settings (key, value) VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        [key, value]
      );
    }
  },

  async getAllSettings(): Promise<Record<string, string>> {
    const db = await getDb();
    const rows = await db.getAllAsync<{ key: string; value: string }>(
      'SELECT key, value FROM settings'
    );
    const settings: Record<string, string> = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    return settings;
  },

  async deleteSetting(key: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM settings WHERE key = ?', [key]);
  },

  // ── Counts for Storage section ─────────────────────────────
  async getRecordCounts(): Promise<{ bills: number; customers: number; products: number; labors: number }> {
    const db = await getDb();
    const bills = await db.getFirstAsync<{ c: number }>('SELECT COUNT(*) as c FROM bills WHERE deleted_at IS NULL');
    const customers = await db.getFirstAsync<{ c: number }>('SELECT COUNT(*) as c FROM customers WHERE deleted_at IS NULL');
    const products = await db.getFirstAsync<{ c: number }>('SELECT COUNT(*) as c FROM products WHERE deleted_at IS NULL');
    const labors = await db.getFirstAsync<{ c: number }>('SELECT COUNT(*) as c FROM labors WHERE deleted_at IS NULL');
    return {
      bills: bills?.c ?? 0,
      customers: customers?.c ?? 0,
      products: products?.c ?? 0,
      labors: labors?.c ?? 0,
    };
  },

  // ── Sync Queue operations ──────────────────────────────────
  async clearSyncedFromQueue(): Promise<number> {
    const db = await getDb();
    const result = await db.runAsync('DELETE FROM sync_queue WHERE synced_at IS NOT NULL');
    return result.changes;
  },

  // ── Reset all app data ─────────────────────────────────────
  async resetAllData(): Promise<void> {
    const db = await getDb();
    await db.execAsync(`
      DELETE FROM bill_items;
      DELETE FROM bills;
      DELETE FROM customers;
      DELETE FROM products;
      DELETE FROM work_records;
      DELETE FROM labors;
      DELETE FROM sync_queue;
      DELETE FROM settings;
    `);
  },

  // ── Sync Log ───────────────────────────────────────────────
  async ensureSyncLogTable(): Promise<void> {
    const db = await getDb();
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS sync_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        pushed INTEGER DEFAULT 0,
        pulled INTEGER DEFAULT 0,
        conflicts INTEGER DEFAULT 0,
        status TEXT DEFAULT 'success'
      );
    `);
  },

  async addSyncLog(entry: { pushed: number; pulled: number; conflicts: number; status: string }): Promise<void> {
    await this.ensureSyncLogTable();
    const db = await getDb();
    await db.runAsync(
      `INSERT INTO sync_log (timestamp, pushed, pulled, conflicts, status) VALUES (datetime('now'), ?, ?, ?, ?)`,
      [entry.pushed, entry.pulled, entry.conflicts, entry.status]
    );
  },

  async getRecentSyncLogs(limit = 5): Promise<Array<{ id: number; timestamp: string; pushed: number; pulled: number; conflicts: number; status: string }>> {
    await this.ensureSyncLogTable();
    const db = await getDb();
    return await db.getAllAsync(
      'SELECT * FROM sync_log ORDER BY id DESC LIMIT ?', [limit]
    );
  },
};
