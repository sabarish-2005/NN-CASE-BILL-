import React, { useState, useEffect } from 'react';
import { View, FlatList, Text, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { getAllCustomers, searchCustomers } from '../../../db/repositories/customerRepository';
import { Customer } from '../../../utils';
import { SearchBar } from '../../../components/ui/SearchBar';
import { FAB } from '../../../components/ui/FAB';
import { SyncStatusDot } from '../../../components/ui/SyncStatusDot';
import { useRouter } from 'expo-router';

export default function CustomersListScreen() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const loadData = async () => {
    try {
      const data = search ? await searchCustomers(search) : await getAllCustomers();
      setCustomers(data);
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

  const renderItem = ({ item }: { item: Customer }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => router.push({ pathname: '/(tabs)/customers/new', params: { id: item.uuid } })}
    >
      <View style={styles.header}>
        <Text style={styles.name}>{item.name}</Text>
        <SyncStatusDot status={item.syncStatus} />
      </View>
      {!!item.phone && <Text style={styles.detail}>Phone: {item.phone}</Text>}
      {!!item.gstin && <Text style={styles.detail}>GSTIN: {item.gstin}</Text>}
      {!!item.city && <Text style={styles.detail}>City: {item.city}</Text>}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search customers..." />
      </View>

      <FlatList
        data={customers}
        keyExtractor={(item) => item.uuid}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No customers found</Text>
          </View>
        }
      />

      <FAB onPress={() => router.push('/(tabs)/customers/new')} />
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
  detail: { fontSize: 14, color: '#64748B', marginBottom: 2 },
  empty: { padding: 32, alignItems: 'center' },
  emptyText: { color: '#94A3B8' },
});
