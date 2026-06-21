// ── SQLite Database Manager ──────────────────────────────────
// Handles initialization, migrations, and provides the singleton DB connection

import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

const DB_NAME = 'nn_billing.db';
const SCHEMA_VERSION = 1;

let _db: any = null;

export async function getDb(): Promise<any> {
  if (_db) return _db;

  if (Platform.OS === 'web' && (window as any).electronAPI) {
    const electronDb = {
      execAsync: async (sql: string) => {
        await (window as any).electronAPI.dbRun(sql);
      },
      getFirstAsync: async <T>(sql: string, ...params: any[]): Promise<T | null> => {
        const p = Array.isArray(params[0]) ? params[0] : params;
        const res = await (window as any).electronAPI.dbAll(sql, p);
        if (res.success && res.rows.length > 0) return res.rows[0];
        return null;
      },
      getAllAsync: async <T>(sql: string, ...params: any[]): Promise<T[]> => {
        const p = Array.isArray(params[0]) ? params[0] : params;
        const res = await (window as any).electronAPI.dbAll(sql, p);
        if (res.success) return res.rows;
        return [];
      },
      runAsync: async (sql: string, ...params: any[]) => {
        const p = Array.isArray(params[0]) ? params[0] : params;
        const res = await (window as any).electronAPI.dbRun(sql, p);
        if (!res.success) throw new Error(res.error);
        return { changes: res.changes, lastInsertRowId: res.lastInsertRowid };
      },
      closeAsync: async () => {},
    };
    _db = electronDb;
    await runMigrations(_db);
    return _db;
  }

  _db = await SQLite.openDatabaseAsync(DB_NAME);
  await _db.execAsync('PRAGMA journal_mode = WAL;');
  await _db.execAsync('PRAGMA foreign_keys = ON;');
  await runMigrations(_db);
  return _db;
}

export async function closeDb(): Promise<void> {
  if (_db) {
    if (_db.closeAsync) await _db.closeAsync();
    _db = null;
  }
}

async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  // Create version tracking table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS _schema_version (
      version INTEGER PRIMARY KEY
    );
  `);

  const row = await db.getFirstAsync<{ version: number }>(
    'SELECT version FROM _schema_version LIMIT 1'
  );
  const currentVersion = row?.version || 0;

  if (currentVersion < 1) {
    await migrateToV1(db);
  }

  // Insert or update version
  if (currentVersion === 0) {
    await db.runAsync('INSERT INTO _schema_version (version) VALUES (?)', SCHEMA_VERSION);
  } else if (currentVersion < SCHEMA_VERSION) {
    await db.runAsync('UPDATE _schema_version SET version = ?', SCHEMA_VERSION);
  }
}

async function migrateToV1(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS users (
      uuid TEXT PRIMARY KEY,
      server_id TEXT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      settings_json TEXT DEFAULT '{}',
      sync_status TEXT DEFAULT 'synced',
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS customers (
      uuid TEXT PRIMARY KEY,
      server_id TEXT,
      name TEXT NOT NULL,
      phone TEXT DEFAULT '',
      email TEXT DEFAULT '',
      gstin TEXT DEFAULT '',
      addr TEXT DEFAULT '',
      city TEXT DEFAULT '',
      state TEXT DEFAULT 'Tamil Nadu',
      pincode TEXT DEFAULT '',
      state_code TEXT DEFAULT '33',
      is_active INTEGER DEFAULT 1,
      notes TEXT DEFAULT '',
      created_by TEXT,
      sync_status TEXT DEFAULT 'pending',
      device_id TEXT,
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
    CREATE INDEX IF NOT EXISTS idx_customers_sync ON customers(sync_status);

    CREATE TABLE IF NOT EXISTS products (
      uuid TEXT PRIMARY KEY,
      server_id TEXT,
      name TEXT NOT NULL,
      hsn TEXT DEFAULT '3923',
      unit TEXT DEFAULT 'Nos',
      rate REAL DEFAULT 0,
      gst_rate REAL DEFAULT 0,
      category TEXT DEFAULT 'General',
      description TEXT DEFAULT '',
      is_active INTEGER DEFAULT 1,
      stock REAL DEFAULT 0,
      created_by TEXT,
      sync_status TEXT DEFAULT 'pending',
      device_id TEXT,
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_products_sync ON products(sync_status);

    CREATE TABLE IF NOT EXISTS bills (
      uuid TEXT PRIMARY KEY,
      server_id TEXT,
      bill_no TEXT NOT NULL,
      is_draft INTEGER DEFAULT 1,
      type TEXT NOT NULL DEFAULT 'dc',
      status TEXT DEFAULT 'final',
      date TEXT NOT NULL,
      due_date TEXT,
      customer_uuid TEXT,
      cust_name TEXT DEFAULT '',
      cust_addr TEXT DEFAULT '',
      cust_phone TEXT DEFAULT '',
      cust_gst TEXT DEFAULT '',
      cust_state TEXT DEFAULT '33',
      transport TEXT DEFAULT 'By Hand',
      vehicle_no TEXT DEFAULT '',
      subtotal REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      taxable REAL DEFAULT 0,
      cgst_total REAL DEFAULT 0,
      sgst_total REAL DEFAULT 0,
      igst_total REAL DEFAULT 0,
      gst_total REAL DEFAULT 0,
      round_off REAL DEFAULT 0,
      total REAL DEFAULT 0,
      words TEXT DEFAULT 'Rupees Zero Only',
      gst_rate REAL DEFAULT 0,
      is_igst INTEGER DEFAULT 0,
      payment_mode TEXT DEFAULT '',
      paid_amount REAL DEFAULT 0,
      balance REAL DEFAULT 0,
      notes TEXT DEFAULT '',
      terms TEXT DEFAULT '',
      created_by TEXT,
      sync_status TEXT DEFAULT 'pending',
      device_id TEXT,
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_bills_date ON bills(date);
    CREATE INDEX IF NOT EXISTS idx_bills_type ON bills(type);
    CREATE INDEX IF NOT EXISTS idx_bills_sync ON bills(sync_status);
    CREATE INDEX IF NOT EXISTS idx_bills_bill_no ON bills(bill_no);

    CREATE TABLE IF NOT EXISTS bill_items (
      uuid TEXT PRIMARY KEY,
      bill_uuid TEXT NOT NULL,
      product_uuid TEXT,
      description TEXT NOT NULL,
      hsn TEXT DEFAULT '3923',
      qty REAL DEFAULT 0,
      unit TEXT DEFAULT 'Nos',
      rate REAL DEFAULT 0,
      gst_rate REAL DEFAULT 0,
      taxable REAL DEFAULT 0,
      cgst REAL DEFAULT 0,
      sgst REAL DEFAULT 0,
      igst REAL DEFAULT 0,
      amount REAL DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (bill_uuid) REFERENCES bills(uuid) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_bill_items_bill ON bill_items(bill_uuid);

    CREATE TABLE IF NOT EXISTS labors (
      uuid TEXT PRIMARY KEY,
      server_id TEXT,
      name TEXT NOT NULL,
      cover_name TEXT DEFAULT '',
      cover_price REAL DEFAULT 0,
      rate_per_piece REAL DEFAULT 0,
      total_pieces REAL DEFAULT 0,
      total_earnings REAL DEFAULT 0,
      created_by TEXT,
      sync_status TEXT DEFAULT 'pending',
      device_id TEXT,
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_labors_sync ON labors(sync_status);

    CREATE TABLE IF NOT EXISTS work_records (
      uuid TEXT PRIMARY KEY,
      labor_uuid TEXT NOT NULL,
      date TEXT NOT NULL,
      day TEXT NOT NULL,
      pieces_completed REAL DEFAULT 0,
      earning_for_day REAL DEFAULT 0,
      notes TEXT DEFAULT '',
      sync_status TEXT DEFAULT 'pending',
      device_id TEXT,
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      FOREIGN KEY (labor_uuid) REFERENCES labors(uuid) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_work_records_labor ON work_records(labor_uuid);
    CREATE INDEX IF NOT EXISTS idx_work_records_date ON work_records(date);

    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL,
      entity_uuid TEXT NOT NULL,
      operation TEXT NOT NULL,
      payload_json TEXT,
      created_at TEXT NOT NULL,
      synced_at TEXT,
      retry_count INTEGER DEFAULT 0,
      error_message TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_sync_queue_pending ON sync_queue(synced_at);

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);
}
