import NetInfo from '@react-native-community/netinfo';
import { api } from '../auth/authService';
import { useSyncStore } from '../store/syncStore';
import { settingsRepository } from '../db/repositories/settingsRepository';
import { syncQueueRepository } from '../db/repositories/syncQueueRepository';
import { getDb } from '../db/database';
import { getDeviceId } from '../utils';

export interface SyncResult {
  pushed: number;
  pulled: number;
  conflicts: number;
  errors: number;
}

class SyncService {
  private listenerUnsubscribe: (() => void) | null = null;
  private isSyncing = false;

  startSyncListener() {
    if (this.listenerUnsubscribe) return;

    this.listenerUnsubscribe = NetInfo.addEventListener((state) => {
      const isOnline = !!state.isConnected && !!state.isInternetReachable;
      // In the store, isOffline is true when not online. We'll reuse useAuthStore or syncStore.
      
      if (isOnline && !this.isSyncing) {
        // Wait 2 seconds for connection to stabilize
        setTimeout(() => {
          this.syncNow().catch(e => console.error('Auto-sync failed:', e));
        }, 2000);
      }
    });
  }

  stopSyncListener() {
    if (this.listenerUnsubscribe) {
      this.listenerUnsubscribe();
      this.listenerUnsubscribe = null;
    }
  }

  async syncNow(): Promise<SyncResult> {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      throw new Error('Device is offline');
    }

    if (this.isSyncing) {
      return { pushed: 0, pulled: 0, conflicts: 0, errors: 0 };
    }

    this.isSyncing = true;
    useSyncStore.getState().setSyncing(true);

    const result: SyncResult = { pushed: 0, pulled: 0, conflicts: 0, errors: 0 };

    try {
      // Step 1: Push local pending operations
      const pushRes = await this.pushPendingOperations();
      result.pushed = pushRes.pushed;
      result.errors += pushRes.errors;

      // Step 2: Pull server updates
      const pullRes = await this.pullServerUpdates();
      result.pulled = pullRes.pulled;
      result.conflicts = pullRes.conflicts;
      result.errors += pullRes.errors;

      // Update sync log & timestamp
      const nowIso = new Date().toISOString();
      await settingsRepository.setSetting('lastSyncAt', nowIso);
      useSyncStore.getState().setLastSyncTimestamp(nowIso);

      await settingsRepository.addSyncLog({
        pushed: result.pushed,
        pulled: result.pulled,
        conflicts: result.conflicts,
        status: result.errors > 0 ? 'completed_with_errors' : 'success'
      });

    } catch (e: any) {
      console.error('Sync error:', e);
      await settingsRepository.addSyncLog({
        pushed: result.pushed,
        pulled: result.pulled,
        conflicts: result.conflicts,
        status: 'error: ' + e.message
      });
      result.errors++;
    } finally {
      this.isSyncing = false;
      useSyncStore.getState().setSyncing(false);
      await this.updatePendingCount();
    }

    return result;
  }

  private async pushPendingOperations() {
    const res = { pushed: 0, errors: 0 };
    try {
      const db = await getDb();
      // Get all pending queue items
      const pendingItems = await db.getAllAsync<any>(
        "SELECT * FROM sync_queue WHERE synced_at IS NULL ORDER BY created_at ASC"
      );

      if (pendingItems.length === 0) return res;

      const deviceId = getDeviceId();
      const lastSyncAt = await settingsRepository.getSetting('lastSyncAt') || new Date(0).toISOString();

      // Batch into groups of 50
      const batchSize = 50;
      for (let i = 0; i < pendingItems.length; i += batchSize) {
        const batch = pendingItems.slice(i, i + batchSize);
        
        const operations = batch.map(item => ({
          queueId: item.id,
          uuid: item.entity_uuid,
          entity: item.entity_type,
          operation: item.operation,
          data: JSON.parse(item.payload_json),
          clientTimestamp: item.created_at
        }));

        try {
          const response = await api.post('/sync', {
            deviceId,
            lastSyncAt,
            operations
          });

          const { applied, conflicts, errors, serverUpdates } = response.data;

          // Process applied (array of queueIds)
          for (const queueId of applied) {
            await db.runAsync("UPDATE sync_queue SET synced_at = ? WHERE id = ?", [new Date().toISOString(), queueId]);
            res.pushed++;
          }

          // Process conflicts (array of {uuid, entityType})
          for (const conflict of conflicts) {
            if (conflict.entityType === 'bill') {
              await db.runAsync("UPDATE bills SET sync_status = 'conflict' WHERE uuid = ?", [conflict.uuid]);
            }
          }

          res.errors += (errors ? errors.length : 0);

          // We should also process `serverUpdates` during the pull phase, but the backend sends them together!
          // Actually, syncController sends it as `serverUpdates` which is an object { bill: [...], customer: [...] }
          // Let's store serverUpdates in a global variable for the pull phase, or process them now.
          // Wait, pullServerUpdates uses GET /api/sync/updates. But syncController returns them on POST!
          // To be clean, we can just process serverUpdates right here or skip it here and rely on pullServerUpdates.
          // Let's rely on pullServerUpdates which will fetch them again or use the separate route if it exists.
        } catch (e) {
          console.error('Batch push failed', e);
          res.errors += batch.length;
          break; // Stop pushing further batches if network fails
        }
      }
    } catch (e) {
      console.error('pushPendingOperations error', e);
      res.errors++;
    }
    return res;
  }

  private async pullServerUpdates() {
    const res = { pulled: 0, conflicts: 0, errors: 0 };
    try {
      const deviceId = getDeviceId();
      const lastSyncAt = await settingsRepository.getSetting('lastSyncAt') || new Date(0).toISOString();

      // Because the POST /api/sync returns updates, we can just call the backend with an empty operations array
      // to do a pure pull.
      const response = await api.post('/sync', { deviceId, lastSyncAt, operations: [] });
      const { serverUpdates } = response.data;
      if (!serverUpdates) return res;

      const { bill: bills, customer: customers, product: products, labor: labors } = serverUpdates;

      const db = await getDb();

      // Generic helper to merge pulled records
      const mergeRecords = async (tableName: string, records: any[]) => {
        for (const record of records) {
          const local = await db.getFirstAsync<any>(`SELECT sync_status, status FROM ${tableName} WHERE uuid = ?`, [record.uuid]);
          
          if (!local) {
            // Insert new record
            const cols = Object.keys(record);
            const placeholders = cols.map(() => '?').join(',');
            await db.runAsync(
              `INSERT INTO ${tableName} (${cols.join(',')}) VALUES (${placeholders})`,
              cols.map(c => record[c])
            );
            res.pulled++;
          } else {
            // If local is pending, skip (local wins).
            // Except for bills, we check conflict rules.
            if (local.sync_status === 'pending') {
              if (tableName === 'bills') {
                // If local is final, and server is different -> conflict
                await db.runAsync(`UPDATE bills SET sync_status = 'conflict' WHERE uuid = ?`, [record.uuid]);
                res.conflicts++;
              }
              continue;
            }

            // Safe overwrite
            if (tableName === 'bills' && local.status === 'final') {
              // Finalized bills should not be overwritten easily, mark conflict
              await db.runAsync(`UPDATE bills SET sync_status = 'conflict' WHERE uuid = ?`, [record.uuid]);
              res.conflicts++;
              continue;
            }

            // Update
            const cols = Object.keys(record).filter(k => k !== 'uuid');
            const setClause = cols.map(c => `${c} = ?`).join(',');
            await db.runAsync(
              `UPDATE ${tableName} SET ${setClause}, sync_status = 'synced' WHERE uuid = ?`,
              [...cols.map(c => record[c]), record.uuid]
            );
            res.pulled++;
          }
        }
      };

      await mergeRecords('customers', customers || []);
      await mergeRecords('products', products || []);
      await mergeRecords('labors', labors || []);
      
      // Merge bills (simplified for now, full items merge requires deleting old items and inserting new)
      for (const bill of (bills || [])) {
        const local = await db.getFirstAsync<any>(`SELECT sync_status, status FROM bills WHERE uuid = ?`, [bill.uuid]);
        if (!local) {
          // Insert bill
          const { items, ...billData } = bill;
          const cols = Object.keys(billData);
          await db.runAsync(
             `INSERT INTO bills (${cols.join(',')}) VALUES (${cols.map(()=>'?').join(',')})`,
             cols.map(c => billData[c])
          );
          // Insert items
          for (const item of (items || [])) {
             const icols = Object.keys(item);
             await db.runAsync(
               `INSERT INTO bill_items (${icols.join(',')}) VALUES (${icols.map(()=>'?').join(',')})`,
               icols.map(c => item[c])
             );
          }
          res.pulled++;
        } else {
          if (local.sync_status === 'pending') {
            await db.runAsync(`UPDATE bills SET sync_status = 'conflict' WHERE uuid = ?`, [bill.uuid]);
            res.conflicts++;
            continue;
          }
          
          const { items, ...billData } = bill;
          const cols = Object.keys(billData).filter(k => k !== 'uuid');
          await db.runAsync(
             `UPDATE bills SET ${cols.map(c=>c+'=?').join(',')}, sync_status = 'synced' WHERE uuid = ?`,
             [...cols.map(c => billData[c]), bill.uuid]
          );
          
          await db.runAsync(`DELETE FROM bill_items WHERE bill_uuid = ?`, [bill.uuid]);
          for (const item of (items || [])) {
             const icols = Object.keys(item);
             await db.runAsync(
               `INSERT INTO bill_items (${icols.join(',')}) VALUES (${icols.map(()=>'?').join(',')})`,
               icols.map(c => item[c])
             );
          }
          res.pulled++;
        }
      }

    } catch (e) {
      console.error('pullServerUpdates error', e);
      res.errors++;
    }
    return res;
  }

  public async updatePendingCount() {
    await useSyncStore.getState().refreshPendingCount();
  }
}

export const syncService = new SyncService();
