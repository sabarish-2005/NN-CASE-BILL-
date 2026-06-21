import React, { useState, useEffect } from 'react';
import { View, FlatList, Text, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { getAllProducts, searchProducts } from '../../../db/repositories/productRepository';
import { Product } from '../../../utils';
import { SearchBar } from '../../../components/ui/SearchBar';
import { FAB } from '../../../components/ui/FAB';
import { SyncStatusDot } from '../../../components/ui/SyncStatusDot';
import { CurrencyText } from '../../../components/ui/CurrencyText';
import { useRouter } from 'expo-router';

export default function ProductsListScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const loadData = async () => {
    try {
      const data = search ? await searchProducts(search) : await getAllProducts(true);
      setProducts(data);
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

  const renderItem = ({ item }: { item: Product }) => (
    <TouchableOpacity 
      style={[styles.card, !item.isActive && styles.cardInactive]} 
      onPress={() => router.push({ pathname: '/(tabs)/products/new', params: { id: item.uuid } })}
    >
      <View style={styles.header}>
        <Text style={[styles.name, !item.isActive && styles.textInactive]}>{item.name}</Text>
        <SyncStatusDot status={item.syncStatus} />
      </View>
      <View style={styles.detailsRow}>
        <Text style={styles.detail}>HSN: {item.hsn}</Text>
        <Text style={styles.detail}>GST: {item.gstRate}%</Text>
        <Text style={styles.detail}>Unit: {item.unit}</Text>
      </View>
      <View style={styles.footer}>
        <Text style={styles.category}>{item.category}</Text>
        <CurrencyText amount={item.rate} style={styles.rate} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search products or HSN..." />
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => item.uuid}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No products found</Text>
          </View>
        }
      />

      <FAB onPress={() => router.push('/(tabs)/products/new')} />
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
  cardInactive: { opacity: 0.6, backgroundColor: '#F1F5F9' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
  textInactive: { textDecorationLine: 'line-through', color: '#94A3B8' },
  detailsRow: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  detail: { fontSize: 13, color: '#64748B' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  category: { fontSize: 12, color: '#0A2E1A', backgroundColor: '#F0FDF4', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, overflow: 'hidden', fontWeight: 'bold' },
  rate: { fontSize: 16, fontWeight: 'bold', color: '#0A2E1A' },
  empty: { padding: 32, alignItems: 'center' },
  emptyText: { color: '#94A3B8' },
});
