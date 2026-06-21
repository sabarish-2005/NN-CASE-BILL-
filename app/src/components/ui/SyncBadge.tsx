import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSyncStore } from '../../store/syncStore';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';

export function SyncBadge() {
  const { pendingCount, isSyncing, refreshPendingCount } = useSyncStore();
  const isOffline = useAuthStore(state => state.isOffline);

  useEffect(() => {
    refreshPendingCount();
    const interval = setInterval(refreshPendingCount, 10000);
    return () => clearInterval(interval);
  }, []);

  if (isOffline) {
    return (
      <View style={styles.container}>
        <CloudOff size={20} color="#94A3B8" />
        {pendingCount > 0 && (
          <View style={[styles.badge, { backgroundColor: '#64748B' }]}>
            <Text style={styles.badgeText}>{pendingCount}</Text>
          </View>
        )}
      </View>
    );
  }

  if (isSyncing) {
    return (
      <View style={styles.container}>
        <RefreshCw size={20} color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Cloud size={20} color="#0A2E1A" />
      {pendingCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{pendingCount}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
    marginRight: 8,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 0,
    backgroundColor: '#DC2626',
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
