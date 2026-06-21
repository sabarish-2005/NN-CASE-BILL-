import React, { useState, useEffect } from 'react';
import { View, FlatList, Text, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { getAllLabors } from '../../../db/repositories/laborRepository';
import { Labor } from '../../../utils';
import { FAB } from '../../../components/ui/FAB';
import { SyncStatusDot } from '../../../components/ui/SyncStatusDot';
import { CurrencyText } from '../../../components/ui/CurrencyText';
import { useRouter } from 'expo-router';

export default function LaborsListScreen() {
  const [labors, setLabors] = useState<Labor[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const loadData = async () => {
    try {
      const data = await getAllLabors();
      setLabors(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: Labor }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => router.push(`/(tabs)/labors/${item.uuid}`)}
    >
      <View style={styles.header}>
        <Text style={styles.name}>{item.name}</Text>
        <SyncStatusDot status={item.syncStatus} />
      </View>
      <View style={styles.detailsRow}>
        <Text style={styles.detail}>Rate: ₹{item.ratePerPiece}/pc</Text>
        <Text style={styles.detail}>Total Pcs: {item.totalPieces}</Text>
      </View>
      <View style={styles.footer}>
        <Text style={styles.detail}>Total Earnings:</Text>
        <CurrencyText amount={item.totalEarnings} style={styles.rate} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={labors}
        keyExtractor={(item) => item.uuid}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No labor profiles found</Text>
          </View>
        }
      />

      <FAB onPress={() => router.push('/(tabs)/labors/new')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  list: { padding: 16, paddingBottom: 80 },
  card: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
  detailsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  detail: { fontSize: 14, color: '#64748B' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 8 },
  rate: { fontSize: 16, fontWeight: 'bold', color: '#0A2E1A' },
  empty: { padding: 32, alignItems: 'center' },
  emptyText: { color: '#94A3B8' },
});
