import React, { useState, useEffect } from 'react';
import { View, FlatList, Text, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { getAllBills } from '../../../db/repositories/billRepository';
import { Bill } from '../../../utils';
import { SearchBar } from '../../../components/ui/SearchBar';
import { FAB } from '../../../components/ui/FAB';
import { SyncStatusDot } from '../../../components/ui/SyncStatusDot';
import { BillTypeBadge } from '../../../components/ui/BillTypeBadge';
import { CurrencyText } from '../../../components/ui/CurrencyText';
import { fmtDate } from '../../../utils';
import { useRouter } from 'expo-router';

export default function BillsListScreen() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const loadData = async () => {
    try {
      const { bills: data } = await getAllBills({ search });
      setBills(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, [search]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: Bill }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => router.push(`/(tabs)/bills/${item.uuid}`)}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.billNo}>{item.billNo}</Text>
          {item.isDraft && <Text style={styles.draftBadge}>DRAFT</Text>}
        </View>
        <SyncStatusDot status={item.syncStatus} />
      </View>
      
      <Text style={styles.customer}>{item.custName || 'Walk-in Customer'}</Text>
      
      <View style={styles.footer}>
        <View>
          <Text style={styles.date}>{fmtDate(item.date)}</Text>
          <BillTypeBadge type={item.type} />
        </View>
        <CurrencyText amount={item.total} style={styles.total} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search bills or customers..." />
      </View>

      <FlatList
        data={bills}
        keyExtractor={(item) => item.uuid}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No bills found</Text>
          </View>
        }
      />

      <FAB onPress={() => router.push('/(tabs)/bills/new')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  searchContainer: { paddingHorizontal: 16, paddingTop: 8, backgroundColor: '#FFF' },
  list: { padding: 16, paddingBottom: 80 },
  card: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  billNo: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
  draftBadge: { backgroundColor: '#FEF08A', color: '#854D0E', fontSize: 10, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontWeight: 'bold' },
  customer: { fontSize: 15, color: '#475569', marginBottom: 16 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  date: { fontSize: 12, color: '#94A3B8', marginBottom: 4 },
  total: { fontSize: 18, fontWeight: 'bold', color: '#0A2E1A' },
  empty: { padding: 32, alignItems: 'center' },
  emptyText: { color: '#94A3B8' },
});
