// ── Customer Repository ──────────────────────────────────────
// SQLite CRUD for customers with sync queue integration

import { getDb } from '../database';
import { Customer, generateUUID, getDeviceId, nowISO } from '../../utils';
import { enqueueSyncOp } from './syncQueueRepository';

function rowToCustomer(row: any): Customer {
  return {
    uuid: row.uuid,
    serverId: row.server_id || undefined,
    name: row.name,
    phone: row.phone || '',
    email: row.email || '',
    gstin: row.gstin || '',
    addr: row.addr || '',
    city: row.city || '',
    state: row.state || 'Tamil Nadu',
    pincode: row.pincode || '',
    stateCode: row.state_code || '33',
    isActive: row.is_active === 1,
    notes: row.notes || '',
    createdBy: row.created_by || undefined,
    syncStatus: row.sync_status || 'pending',
    deviceId: row.device_id || undefined,
    createdAt: row.created_at || '',
    updatedAt: row.updated_at || '',
    deletedAt: row.deleted_at || undefined,
  };
}

export async function getAllCustomers(includeDeleted = false): Promise<Customer[]> {
  const db = await getDb();
  const where = includeDeleted ? '' : 'WHERE deleted_at IS NULL';
  const rows = await db.getAllAsync(`SELECT * FROM customers ${where} ORDER BY name ASC`);
  return rows.map(rowToCustomer);
}

export async function searchCustomers(query: string): Promise<Customer[]> {
  const db = await getDb();
  const q = `%${query}%`;
  const rows = await db.getAllAsync(
    `SELECT * FROM customers WHERE deleted_at IS NULL AND (name LIKE ? OR phone LIKE ? OR gstin LIKE ?) ORDER BY name ASC`,
    [q, q, q]
  );
  return rows.map(rowToCustomer);
}

export async function getCustomerByUuid(uuid: string): Promise<Customer | null> {
  const db = await getDb();
  const row = await db.getFirstAsync('SELECT * FROM customers WHERE uuid = ?', [uuid]);
  return row ? rowToCustomer(row) : null;
}

export async function getCustomerByServerId(serverId: string): Promise<Customer | null> {
  const db = await getDb();
  const row = await db.getFirstAsync('SELECT * FROM customers WHERE server_id = ?', [serverId]);
  return row ? rowToCustomer(row) : null;
}

export async function createCustomer(data: Partial<Customer>): Promise<Customer> {
  const db = await getDb();
  const now = nowISO();
  const uuid = data.uuid || generateUUID();
  const deviceId = getDeviceId();

  await db.runAsync(
    `INSERT INTO customers (uuid, server_id, name, phone, email, gstin, addr, city, state, pincode, state_code, is_active, notes, created_by, sync_status, device_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
    [uuid, data.serverId || null, data.name || '', data.phone || '', data.email || '',
     data.gstin || '', data.addr || '', data.city || '', data.state || 'Tamil Nadu',
     data.pincode || '', data.stateCode || '33', data.isActive !== false ? 1 : 0,
     data.notes || '', data.createdBy || null, deviceId, now, now]
  );

  const customer = (await getCustomerByUuid(uuid))!;
  await enqueueSyncOp('customer', uuid, 'create', customer);
  return customer;
}

export async function updateCustomer(uuid: string, data: Partial<Customer>): Promise<Customer | null> {
  const db = await getDb();
  const now = nowISO();
  const existing = await getCustomerByUuid(uuid);
  if (!existing) return null;

  await db.runAsync(
    `UPDATE customers SET
      name = ?, phone = ?, email = ?, gstin = ?, addr = ?, city = ?,
      state = ?, pincode = ?, state_code = ?, is_active = ?, notes = ?,
      sync_status = 'pending', updated_at = ?
     WHERE uuid = ?`,
    [data.name ?? existing.name, data.phone ?? existing.phone, data.email ?? existing.email,
     data.gstin ?? existing.gstin, data.addr ?? existing.addr, data.city ?? existing.city,
     data.state ?? existing.state, data.pincode ?? existing.pincode,
     data.stateCode ?? existing.stateCode, (data.isActive ?? existing.isActive) ? 1 : 0,
     data.notes ?? existing.notes, now, uuid]
  );

  const updated = (await getCustomerByUuid(uuid))!;
  await enqueueSyncOp('customer', uuid, 'update', updated);
  return updated;
}

export async function deleteCustomer(uuid: string): Promise<boolean> {
  const db = await getDb();
  const now = nowISO();
  const result = await db.runAsync(
    `UPDATE customers SET deleted_at = ?, sync_status = 'pending', updated_at = ? WHERE uuid = ?`,
    [now, now, uuid]
  );
  if (result.changes > 0) {
    await enqueueSyncOp('customer', uuid, 'delete', { uuid, deletedAt: now });
  }
  return result.changes > 0;
}

export async function getCustomerCount(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM customers WHERE deleted_at IS NULL'
  );
  return row?.count || 0;
}

export async function upsertCustomerFromServer(data: any): Promise<void> {
  const db = await getDb();
  const now = nowISO();
  const existing = data._id ? await getCustomerByServerId(data._id) : null;

  if (existing) {
    await db.runAsync(
      `UPDATE customers SET
        name = ?, phone = ?, email = ?, gstin = ?, addr = ?, city = ?,
        state = ?, pincode = ?, state_code = ?, is_active = ?, notes = ?,
        server_id = ?, sync_status = 'synced', updated_at = ?
       WHERE uuid = ?`,
      [data.name, data.phone || '', data.email || '', data.gstin || '',
       data.addr || '', data.city || '', data.state || 'Tamil Nadu',
       data.pincode || '', data.stateCode || '33', data.isActive !== false ? 1 : 0,
       data.notes || '', data._id, data.updatedAt || now, existing.uuid]
    );
  } else {
    const uuid = data.uuid || generateUUID();
    await db.runAsync(
      `INSERT OR IGNORE INTO customers (uuid, server_id, name, phone, email, gstin, addr, city, state, pincode, state_code, is_active, notes, created_by, sync_status, device_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?, ?, ?)`,
      [uuid, data._id, data.name, data.phone || '', data.email || '',
       data.gstin || '', data.addr || '', data.city || '', data.state || 'Tamil Nadu',
       data.pincode || '', data.stateCode || '33', data.isActive !== false ? 1 : 0,
       data.notes || '', data.createdBy || null, 'server',
       data.createdAt || now, data.updatedAt || now]
    );
  }
}
