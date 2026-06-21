import { create } from 'zustand';
import { getPendingCount } from '../db/repositories/syncQueueRepository';

interface SyncState {
  pendingCount: number;
  isSyncing: boolean;
  lastSyncTimestamp: string | null;
  
  setPendingCount: (count: number) => void;
  refreshPendingCount: () => Promise<void>;
  setSyncing: (isSyncing: boolean) => void;
  setLastSyncTimestamp: (timestamp: string) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  pendingCount: 0,
  isSyncing: false,
  lastSyncTimestamp: null,

  setPendingCount: (count) => set({ pendingCount: count }),
  refreshPendingCount: async () => {
    try {
      const count = await getPendingCount();
      set({ pendingCount: count });
    } catch (e) {
      console.error('Failed to get pending sync count', e);
    }
  },
  setSyncing: (isSyncing) => set({ isSyncing }),
  setLastSyncTimestamp: (timestamp) => set({ lastSyncTimestamp: timestamp }),
}));
