// ── Labor Repository ──────────────────────────────────────────
// SQLite CRUD for labors + work_records with sync queue integration

import { getDb } from '../database';
import { Labor, WorkRecord, SyncStatus, generateUUID, getDeviceId, nowISO } from '../../utils';
import { enqueueSyncOp } from './syncQueueRepository';

// ── Row Mappers ──────────────────────────────────────────────

function rowToLabor(row: any): Labor {
  return {
    uuid: row.uuid,
    serverId: row.server_id || undefined,
    name: row.name,
    coverName: row.cover_name || '',
    coverPrice: row.cover_price || 0,
    ratePerPiece: row.rate_per_piece || 0,
    totalPieces: row.total_pieces || 0,
    totalEarnings: row.total_earnings || 0,
    createdBy: row.created_by || undefined,
    syncStatus: row.sync_status as SyncStatus,
    deviceId: row.device_id || undefined,
    createdAt: row.created_at || '',
    updatedAt: row.updated_at || '',
    deletedAt: row.deleted_at || undefined,
  };
}

function rowToWorkRecord(row: any): WorkRecord {
  return {
    uuid: row.uuid,
    laborUuid: row.labor_uuid,
    date: row.date,
    day: row.day,
    piecesCompleted: row.pieces_completed || 0,
    earningForDay: row.earning_for_day || 0,
    notes: row.notes || '',
    syncStatus: row.sync_status as SyncStatus,
    deviceId: row.device_id || undefined,
    createdAt: row.created_at || '',
    updatedAt: row.updated_at || '',
    deletedAt: row.deleted_at || undefined,
  };
}

// ── Labors ───────────────────────────────────────────────────

export async function getAllLabors(includeDeleted = false): Promise<Labor[]> {
  const db = await getDb();
  const where = includeDeleted ? '' : 'WHERE deleted_at IS NULL';
  const rows = await db.getAllAsync(`SELECT * FROM labors ${where} ORDER BY name ASC`);
  return rows.map(rowToLabor);
}

export async function getLaborByUuid(uuid: string): Promise<Labor | null> {
  const db = await getDb();
  const row = await db.getFirstAsync('SELECT * FROM labors WHERE uuid = ?', [uuid]);
  return row ? rowToLabor(row) : null;
}

export async function createLabor(data: Partial<Labor>): Promise<Labor> {
  const db = await getDb();
  const now = nowISO();
  const uuid = data.uuid || generateUUID();
  const deviceId = getDeviceId();

  await db.runAsync(
    `INSERT INTO labors (uuid, server_id, name, cover_name, cover_price, rate_per_piece, total_pieces, total_earnings, created_by, sync_status, device_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
    [uuid, data.serverId || null, data.name || '', data.coverName || '',
     data.coverPrice || 0, data.ratePerPiece || 0, data.totalPieces || 0,
     data.totalEarnings || 0, data.createdBy || null, deviceId, now, now]
  );

  const labor = (await getLaborByUuid(uuid))!;
  await enqueueSyncOp('labor', uuid, 'create', labor);
  return labor;
}

export async function updateLabor(uuid: string, data: Partial<Labor>): Promise<Labor | null> {
  const db = await getDb();
  const now = nowISO();
  const existing = await getLaborByUuid(uuid);
  if (!existing) return null;

  await db.runAsync(
    `UPDATE labors SET
      name = ?, cover_name = ?, cover_price = ?, rate_per_piece = ?,
      sync_status = 'pending', updated_at = ?
     WHERE uuid = ?`,
    [data.name ?? existing.name, data.coverName ?? existing.coverName,
     data.coverPrice ?? existing.coverPrice, data.ratePerPiece ?? existing.ratePerPiece,
     now, uuid]
  );

  // We should also recalculate totals if rate changes, but we'll let a separate recalculate function handle it or do it here.
  // For simplicity, we just trigger a recalculation after update.
  await recalculateLaborTotals(uuid);

  const updated = (await getLaborByUuid(uuid))!;
  await enqueueSyncOp('labor', uuid, 'update', updated);
  return updated;
}

export async function deleteLabor(uuid: string): Promise<boolean> {
  const db = await getDb();
  const now = nowISO();
  const result = await db.runAsync(
    `UPDATE labors SET deleted_at = ?, sync_status = 'pending', updated_at = ? WHERE uuid = ?`,
    [now, now, uuid]
  );
  if (result.changes > 0) {
    await enqueueSyncOp('labor', uuid, 'delete', { uuid, deletedAt: now });
  }
  return result.changes > 0;
}

// ── Work Records ─────────────────────────────────────────────

export async function getWorkRecords(laborUuid: string): Promise<WorkRecord[]> {
  const db = await getDb();
  const rows = await db.getAllAsync(
    'SELECT * FROM work_records WHERE labor_uuid = ? AND deleted_at IS NULL ORDER BY date DESC',
    [laborUuid]
  );
  return rows.map(rowToWorkRecord);
}

export async function getWorkRecordByUuid(uuid: string): Promise<WorkRecord | null> {
  const db = await getDb();
  const row = await db.getFirstAsync('SELECT * FROM work_records WHERE uuid = ?', [uuid]);
  return row ? rowToWorkRecord(row) : null;
}

export async function addWorkRecord(laborUuid: string, data: Partial<WorkRecord>): Promise<WorkRecord | null> {
  const db = await getDb();
  const labor = await getLaborByUuid(laborUuid);
  if (!labor) return null;

  const now = nowISO();
  const uuid = data.uuid || generateUUID();
  const deviceId = getDeviceId();

  const piecesCompleted = data.piecesCompleted || 0;
  const earningForDay = piecesCompleted * labor.ratePerPiece;

  const date = data.date || now.split('T')[0];
  const d = new Date(date);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayName = data.day || days[d.getDay()];

  await db.runAsync(
    `INSERT INTO work_records (uuid, labor_uuid, date, day, pieces_completed, earning_for_day, notes, sync_status, device_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
    [uuid, laborUuid, date, dayName, piecesCompleted, earningForDay,
     data.notes || '', deviceId, now, now]
  );

  await recalculateLaborTotals(laborUuid);
  const record = (await getWorkRecordByUuid(uuid))!;
  await enqueueSyncOp('work_record', uuid, 'create', record);
  return record;
}

export async function updateWorkRecord(uuid: string, data: Partial<WorkRecord>): Promise<WorkRecord | null> {
  const db = await getDb();
  const now = nowISO();
  const existing = await getWorkRecordByUuid(uuid);
  if (!existing) return null;

  const labor = await getLaborByUuid(existing.laborUuid);
  if (!labor) return null;

  const piecesCompleted = data.piecesCompleted ?? existing.piecesCompleted;
  const earningForDay = piecesCompleted * labor.ratePerPiece;

  await db.runAsync(
    `UPDATE work_records SET
      date = ?, day = ?, pieces_completed = ?, earning_for_day = ?, notes = ?,
      sync_status = 'pending', updated_at = ?
     WHERE uuid = ?`,
    [data.date ?? existing.date, data.day ?? existing.day, piecesCompleted,
     earningForDay, data.notes ?? existing.notes, now, uuid]
  );

  await recalculateLaborTotals(existing.laborUuid);
  const updated = (await getWorkRecordByUuid(uuid))!;
  await enqueueSyncOp('work_record', uuid, 'update', updated);
  return updated;
}

export async function deleteWorkRecord(uuid: string): Promise<boolean> {
  const db = await getDb();
  const now = nowISO();
  const existing = await getWorkRecordByUuid(uuid);
  if (!existing) return false;

  const result = await db.runAsync(
    `UPDATE work_records SET deleted_at = ?, sync_status = 'pending', updated_at = ? WHERE uuid = ?`,
    [now, now, uuid]
  );
  if (result.changes > 0) {
    await recalculateLaborTotals(existing.laborUuid);
    await enqueueSyncOp('work_record', uuid, 'delete', { uuid, deletedAt: now });
  }
  return result.changes > 0;
}

export async function recalculateLaborTotals(laborUuid: string): Promise<void> {
  const db = await getDb();
  const now = nowISO();

  // We could just sum in SQLite
  const row = await db.getFirstAsync<{ tp: number, te: number }>(
    'SELECT SUM(pieces_completed) as tp, SUM(earning_for_day) as te FROM work_records WHERE labor_uuid = ? AND deleted_at IS NULL',
    [laborUuid]
  );

  const tp = row?.tp || 0;
  const te = row?.te || 0;

  await db.runAsync(
    `UPDATE labors SET total_pieces = ?, total_earnings = ?, sync_status = 'pending', updated_at = ? WHERE uuid = ?`,
    [tp, te, now, laborUuid]
  );

  const updatedLabor = await getLaborByUuid(laborUuid);
  if (updatedLabor) {
    await enqueueSyncOp('labor', laborUuid, 'update', updatedLabor);
  }
}

// ── Server Upsert ────────────────────────────────────────────

export async function upsertLaborFromServer(data: any): Promise<void> {
  const db = await getDb();
  const now = nowISO();
  const existing = data._id
    ? await db.getFirstAsync<any>('SELECT uuid FROM labors WHERE server_id = ?', [data._id])
    : null;

  const uuid = existing?.uuid || data.uuid || generateUUID();

  if (existing) {
    await db.runAsync(
      `UPDATE labors SET
        name = ?, cover_name = ?, cover_price = ?, rate_per_piece = ?,
        total_pieces = ?, total_earnings = ?,
        server_id = ?, sync_status = 'synced', updated_at = ?
       WHERE uuid = ?`,
      [data.name, data.coverName || '', data.coverPrice || 0, data.ratePerPiece || 0,
       data.totalPieces || 0, data.totalEarnings || 0,
       data._id, data.updatedAt || now, uuid]
    );
  } else {
    await db.runAsync(
      `INSERT OR IGNORE INTO labors (uuid, server_id, name, cover_name, cover_price, rate_per_piece, total_pieces, total_earnings, created_by, sync_status, device_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', 'server', ?, ?)`,
      [uuid, data._id, data.name, data.coverName || '', data.coverPrice || 0,
       data.ratePerPiece || 0, data.totalPieces || 0, data.totalEarnings || 0,
       data.createdBy || null, data.createdAt || now, data.updatedAt || now]
    );
  }

  // Work records logic
  if (data.workRecords && Array.isArray(data.workRecords)) {
    // Upsert work records.
    // For simplicity, we can do a sync logic based on the IDs
    // Since workRecords on MongoDB might not have UUIDs originally, we will need to match by something or just wipe & insert.
    // Given the complexity of array subdocuments, it's easier to wipe and insert for server pull, IF we trust the server.
    // But since this is an offline-first app, we must preserve offline items.
    // We will rely on Phase 3 backend returning operations (like create/update/delete) or applying them correctly.
    // If the server returns full arrays, we clear synced records and insert server ones.
    await db.runAsync("DELETE FROM work_records WHERE labor_uuid = ? AND (sync_status = 'synced' OR sync_status = 'pending')", [uuid]);
    
    for (const record of data.workRecords) {
        const recordUuid = record.uuid || generateUUID();
        const dateStr = record.date ? new Date(record.date).toISOString().split('T')[0] : nowISO().split('T')[0];
        await db.runAsync(
            `INSERT INTO work_records (uuid, labor_uuid, date, day, pieces_completed, earning_for_day, notes, sync_status, device_id, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'synced', 'server', ?, ?)`,
            [recordUuid, uuid, dateStr, record.day || '', record.piecesCompleted || 0, record.earningForDay || 0, record.notes || '', record.createdAt || now, record.updatedAt || now]
        );
    }
  }
}
