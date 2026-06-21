import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Shield, RefreshCw, Hash } from 'lucide-react-native';
import { settingsRepository } from '../../db/repositories/settingsRepository';
import { useSyncStore } from '../../store/syncStore';
import { syncService } from '../../services/syncService';

export default function AdminDashboard() {
  const [syncLogs, setSyncLogs] = useState<any[]>([]);
  const { pendingCount } = useSyncStore();
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    settingsRepository.getRecentSyncLogs(10).then(setSyncLogs);
  }, []);

  const runFullSync = async () => {
    setIsBusy(true);
    try {
      await settingsRepository.setSetting('lastSyncAt', new Date(0).toISOString());
      const res = await syncService.syncNow();
      Alert.alert('✓ Full Sync Complete', `Pulled: ${res.pulled} records`);
      const newLogs = await settingsRepository.getRecentSyncLogs(10);
      setSyncLogs(newLogs);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      
      {/* Sync Management */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <RefreshCw size={20} color="#0A2E1A" />
          <Text style={styles.sectionTitle}>Sync Management</Text>
        </View>
        <Text style={styles.text}>Pending Queue: {pendingCount} items</Text>
        
        <TouchableOpacity style={styles.btn} onPress={runFullSync} disabled={isBusy}>
          <Text style={styles.btnText}>Force Full Sync All Devices</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { marginTop: 16, fontSize: 14 }]}>Recent Sync Logs</Text>
        {syncLogs.length > 0 ? syncLogs.map(log => (
          <View key={log.id} style={styles.logRow}>
            <Text style={styles.logTime}>{log.timestamp}</Text>
            <Text style={styles.logDetails}>Pushed: {log.pushed} | Pulled: {log.pulled} | Conflicts: {log.conflicts}</Text>
            <Text style={styles.logStatus}>{log.status}</Text>
          </View>
        )) : <Text style={styles.text}>No logs found.</Text>}
      </View>

      {/* User Management */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Shield size={20} color="#0A2E1A" />
          <Text style={styles.sectionTitle}>User Management</Text>
        </View>
        <Text style={styles.text}>To add Staff users or change roles, please use the Web Dashboard (planned feature).</Text>
        <Text style={styles.text}>User API endpoints exist in backend, but mobile UI for User CRUD is deferred.</Text>
      </View>

      {/* Bill Numbers */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Hash size={20} color="#0A2E1A" />
          <Text style={styles.sectionTitle}>Bill Numbers</Text>
        </View>
        <Text style={styles.text}>Bill numbers are sequential and reserved from the server during sync.</Text>
        <Text style={styles.text}>To change the next bill number, edit it in Settings -> Invoice Preferences.</Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  section: { backgroundColor: '#FFF', margin: 12, padding: 16, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
  text: { fontSize: 14, color: '#475569', marginBottom: 8 },
  btn: { backgroundColor: '#0A2E1A', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#FFF', fontWeight: 'bold' },
  logRow: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingVertical: 8 },
  logTime: { fontSize: 12, color: '#64748B' },
  logDetails: { fontSize: 13, color: '#1E293B', fontWeight: '600', marginTop: 2 },
  logStatus: { fontSize: 11, color: '#94A3B8', marginTop: 2 }
});
