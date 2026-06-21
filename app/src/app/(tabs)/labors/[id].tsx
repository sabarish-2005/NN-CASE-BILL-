import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { getLaborByUuid, getWorkRecords, addWorkRecord } from '../../../db/repositories/laborRepository';
import { Labor, WorkRecord, fmtDate } from '../../../utils';
import { CurrencyText } from '../../../components/ui/CurrencyText';
import { SyncStatusDot } from '../../../components/ui/SyncStatusDot';

export default function LaborDetailScreen() {
  const { id } = useLocalSearchParams();
  const [labor, setLabor] = useState<Labor | null>(null);
  const [records, setRecords] = useState<WorkRecord[]>([]);
  
  // Entry Form State
  const [pieces, setPieces] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadData = async () => {
    if (!id || typeof id !== 'string') return;
    const l = await getLaborByUuid(id);
    if (l) {
      setLabor(l);
      const wr = await getWorkRecords(l.uuid);
      setRecords(wr);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleAddEntry = async () => {
    if (!labor) return;
    const p = parseFloat(pieces);
    if (!p || p <= 0) {
      Alert.alert('Error', 'Enter valid pieces');
      return;
    }

    setIsSaving(true);
    try {
      await addWorkRecord(labor.uuid, { piecesCompleted: p });
      setPieces('');
      await loadData();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!labor) return <View style={styles.center}><Text>Loading...</Text></View>;

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.headerCard}>
          <Text style={styles.name}>{labor.name}</Text>
          <Text style={styles.rate}>Rate: ₹{labor.ratePerPiece} / piece</Text>
        </View>

        {/* Add Entry Form */}
        <View style={styles.entryForm}>
          <Text style={styles.sectionTitle}>Add Daily Entry</Text>
          <View style={styles.row}>
            <TextInput 
              style={styles.input} 
              placeholder="Pieces Completed"
              keyboardType="numeric"
              value={pieces}
              onChangeText={setPieces}
            />
            <TouchableOpacity style={styles.addBtn} onPress={handleAddEntry} disabled={isSaving}>
              <Text style={styles.addBtnText}>{isSaving ? '...' : 'Add'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* History */}
        <View style={styles.history}>
          <Text style={styles.sectionTitle}>Work History</Text>
          {records.length === 0 ? (
            <Text style={styles.emptyText}>No work records yet.</Text>
          ) : (
            records.map(r => (
              <View key={r.uuid} style={styles.recordItem}>
                <View>
                  <Text style={styles.date}>{fmtDate(r.date)} ({r.day})</Text>
                  <Text style={styles.pieces}>{r.piecesCompleted} pieces</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <CurrencyText amount={r.earningForDay} style={styles.earning} />
                  <View style={{ marginTop: 4 }}>
                    <SyncStatusDot status={r.syncStatus} />
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View>
          <Text style={styles.footerLabel}>Total Pieces</Text>
          <Text style={styles.footerValue}>{labor.totalPieces}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.footerLabel}>Total Earnings</Text>
          <CurrencyText amount={labor.totalEarnings} style={styles.footerValue} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  headerCard: { backgroundColor: '#0A2E1A', padding: 24, paddingBottom: 32 },
  name: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginBottom: 4 },
  rate: { fontSize: 16, color: '#BBF7D0' },
  entryForm: { backgroundColor: '#FFF', margin: 16, marginTop: -16, padding: 16, borderRadius: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', marginBottom: 12 },
  row: { flexDirection: 'row', gap: 12 },
  input: { flex: 1, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 12, fontSize: 16 },
  addBtn: { backgroundColor: '#C9A227', paddingHorizontal: 24, justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
  addBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  history: { padding: 16 },
  emptyText: { color: '#94A3B8', fontStyle: 'italic' },
  recordItem: { backgroundColor: '#FFF', padding: 16, borderRadius: 8, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  date: { fontSize: 14, fontWeight: 'bold', color: '#1E293B', marginBottom: 4 },
  pieces: { fontSize: 14, color: '#64748B' },
  earning: { fontSize: 16, fontWeight: 'bold', color: '#0A2E1A' },
  footer: { backgroundColor: '#FFF', padding: 16, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingBottom: 32 },
  footerLabel: { fontSize: 12, color: '#64748B', fontWeight: 'bold', textTransform: 'uppercase' },
  footerValue: { fontSize: 20, fontWeight: 'bold', color: '#1E293B', marginTop: 4 },
});
