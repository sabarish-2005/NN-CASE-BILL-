// ── Product Repository ───────────────────────────────────────
// SQLite CRUD for products with sync queue integration

import { getDb } from '../database';
import { Product, generateUUID, getDeviceId, nowISO } from '../../utils';
import { enqueueSyncOp } from './syncQueueRepository';

function rowToProduct(row: any): Product {
  return {
    uuid: row.uuid,
    serverId: row.server_id || undefined,
    name: row.name,
    hsn: row.hsn || '3923',
    unit: row.unit || 'Nos',
    rate: row.rate || 0,
    gstRate: row.gst_rate || 0,
    category: row.category || 'General',
    description: row.description || '',
    isActive: row.is_active === 1,
    stock: row.stock || 0,
    createdBy: row.created_by || undefined,
    syncStatus: row.sync_status || 'pending',
    deviceId: row.device_id || undefined,
    createdAt: row.created_at || '',
    updatedAt: row.updated_at || '',
    deletedAt: row.deleted_at || undefined,
  };
}

export async function getAllProducts(includeInactive = false): Promise<Product[]> {
  const db = await getDb();
  const where = includeInactive
    ? 'WHERE deleted_at IS NULL'
    : 'WHERE deleted_at IS NULL AND is_active = 1';
  const rows = await db.getAllAsync(`SELECT * FROM products ${where} ORDER BY name ASC`);
  return rows.map(rowToProduct);
}

export async function searchProducts(query: string): Promise<Product[]> {
  const db = await getDb();
  const q = `%${query}%`;
  const rows = await db.getAllAsync(
    `SELECT * FROM products WHERE deleted_at IS NULL AND is_active = 1
     AND (name LIKE ? OR hsn LIKE ? OR category LIKE ?) ORDER BY name ASC`,
    [q, q, q]
  );
  return rows.map(rowToProduct);
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
  const db = await getDb();
  const rows = await db.getAllAsync(
    `SELECT * FROM products WHERE deleted_at IS NULL AND is_active = 1 AND category = ? ORDER BY name ASC`,
    [category]
  );
  return rows.map(rowToProduct);
}

export async function getProductByUuid(uuid: string): Promise<Product | null> {
  const db = await getDb();
  const row = await db.getFirstAsync('SELECT * FROM products WHERE uuid = ?', [uuid]);
  return row ? rowToProduct(row) : null;
}

export async function createProduct(data: Partial<Product>): Promise<Product> {
  const db = await getDb();
  const now = nowISO();
  const uuid = data.uuid || generateUUID();
  const deviceId = getDeviceId();

  await db.runAsync(
    `INSERT INTO products (uuid, server_id, name, hsn, unit, rate, gst_rate, category, description, is_active, stock, created_by, sync_status, device_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
    [uuid, data.serverId || null, data.name || '', data.hsn || '3923', data.unit || 'Nos',
     data.rate || 0, data.gstRate || 0, data.category || 'General',
     data.description || '', data.isActive !== false ? 1 : 0, data.stock || 0,
     data.createdBy || null, deviceId, now, now]
  );

  const product = (await getProductByUuid(uuid))!;
  await enqueueSyncOp('product', uuid, 'create', product);
  return product;
}

export async function updateProduct(uuid: string, data: Partial<Product>): Promise<Product | null> {
  const db = await getDb();
  const now = nowISO();
  const existing = await getProductByUuid(uuid);
  if (!existing) return null;

  await db.runAsync(
    `UPDATE products SET
      name = ?, hsn = ?, unit = ?, rate = ?, gst_rate = ?, category = ?,
      description = ?, is_active = ?, stock = ?,
      sync_status = 'pending', updated_at = ?
     WHERE uuid = ?`,
    [data.name ?? existing.name, data.hsn ?? existing.hsn, data.unit ?? existing.unit,
     data.rate ?? existing.rate, data.gstRate ?? existing.gstRate,
     data.category ?? existing.category, data.description ?? existing.description,
     (data.isActive ?? existing.isActive) ? 1 : 0, data.stock ?? existing.stock,
     now, uuid]
  );

  const updated = (await getProductByUuid(uuid))!;
  await enqueueSyncOp('product', uuid, 'update', updated);
  return updated;
}

export async function deleteProduct(uuid: string): Promise<boolean> {
  const db = await getDb();
  const now = nowISO();
  const result = await db.runAsync(
    `UPDATE products SET deleted_at = ?, sync_status = 'pending', updated_at = ? WHERE uuid = ?`,
    [now, now, uuid]
  );
  if (result.changes > 0) {
    await enqueueSyncOp('product', uuid, 'delete', { uuid, deletedAt: now });
  }
  return result.changes > 0;
}

export async function upsertProductFromServer(data: any): Promise<void> {
  const db = await getDb();
  const now = nowISO();
  const existing = data._id
    ? await db.getFirstAsync<any>('SELECT uuid FROM products WHERE server_id = ?', [data._id])
    : null;

  if (existing) {
    await db.runAsync(
      `UPDATE products SET
        name = ?, hsn = ?, unit = ?, rate = ?, gst_rate = ?, category = ?,
        description = ?, is_active = ?, stock = ?,
        server_id = ?, sync_status = 'synced', updated_at = ?
       WHERE uuid = ?`,
      [data.name, data.hsn || '3923', data.unit || 'Nos', data.rate || 0,
       data.gstRate || 0, data.category || 'General', data.desc || '',
       data.isActive !== false ? 1 : 0, data.stock || 0,
       data._id, data.updatedAt || now, existing.uuid]
    );
  } else {
    const uuid = data.uuid || generateUUID();
    await db.runAsync(
      `INSERT OR IGNORE INTO products (uuid, server_id, name, hsn, unit, rate, gst_rate, category, description, is_active, stock, created_by, sync_status, device_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?, ?, ?)`,
      [uuid, data._id, data.name, data.hsn || '3923', data.unit || 'Nos',
       data.rate || 0, data.gstRate || 0, data.category || 'General',
       data.desc || '', data.isActive !== false ? 1 : 0, data.stock || 0,
       data.createdBy || null, 'server', data.createdAt || now, data.updatedAt || now]
    );
  }
}
