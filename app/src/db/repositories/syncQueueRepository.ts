// ── Sync Queue Repository ────────────────────────────────────
// Manages the sync operation queue in SQLite

import { getDb } from '../database';
import { SyncQueueItem, nowISO } from '../../utils';

export async function enqueueSyncOp(
  entityType: string,
  entityUuid: string,
  operation: 'create' | 'update' | 'delete',
  payload: any
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO sync_queue (entity_type, entity_uuid, operation, payload_json, created_at, retry_count)
     VALUES (?, ?, ?, ?, ?, 0)`,
    [entityType, entityUuid, operation, JSON.stringify(payload), nowISO()]
  );
}

export async function getPendingOps(): Promise<SyncQueueItem[]> {
  const db = await getDb();
  const rows = await db.getAllAsync(
    `SELECT * FROM sync_queue WHERE synced_at IS NULL ORDER BY id ASC`
  );
  return rows.map(rowToSyncItem);
}

export async function getPendingCount(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM sync_queue WHERE synced_at IS NULL'
  );
  return row?.count || 0;
}

export async function markSynced(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE sync_queue SET synced_at = ? WHERE id = ?',
    [nowISO(), id]
  );
}

export async function markFailed(id: number, errorMessage: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE sync_queue SET retry_count = retry_count + 1, error_message = ? WHERE id = ?',
    [errorMessage, id]
  );
}

export async function clearSyncedOps(): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM sync_queue WHERE synced_at IS NOT NULL');
}

export async function getFailedOps(maxRetries = 5): Promise<SyncQueueItem[]> {
  const db = await getDb();
  const rows = await db.getAllAsync(
    `SELECT * FROM sync_queue WHERE synced_at IS NULL AND retry_count >= ? ORDER BY id ASC`,
    [maxRetries]
  );
  return rows.map(rowToSyncItem);
}

function rowToSyncItem(row: any): SyncQueueItem {
  return {
    id: row.id,
    entityType: row.entity_type,
    entityUuid: row.entity_uuid,
    operation: row.operation,
    payloadJson: row.payload_json,
    createdAt: row.created_at,
    syncedAt: row.synced_at || undefined,
    retryCount: row.retry_count || 0,
    errorMessage: row.error_message || undefined,
  };
}
