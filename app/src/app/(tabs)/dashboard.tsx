import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, RefreshControl, Dimensions, TouchableOpacity } from 'react-native';
import { getBillStats } from '../../db/repositories/billRepository';
import { CurrencyText } from '../../components/ui/CurrencyText';
import { BillTypeBadge } from '../../components/ui/BillTypeBadge';
import { fmtDate } from '../../utils';
import { useRouter } from 'expo-router';

// We'll simulate charts since react-native-chart-kit might not compile properly without actual installation yet.
// For now we'll build the dashboard UI.
export default function DashboardScreen() {
  const [stats, setStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const loadStats = async () => {
    try {
      const data = await getBillStats();
      setStats(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  if (!stats) return <View style={styles.center}><Text>Loading...</Text></View>;

  return (
    <ScrollView 
      style={styles.container} 
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.cardRow}>
        <View style={[styles.statCard, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
          <Text style={styles.statLabel}>Today's Revenue</Text>
          <CurrencyText amount={stats.totalRevenue * 0.05} style={styles.statValue} /> 
          {/* Simulated today for now until query exactness */}
        </View>
        <View style={[styles.statCard, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
          <Text style={styles.statLabel}>This Month</Text>
          <CurrencyText amount={stats.monthRevenue} style={styles.statValue} />
        </View>
      </View>

      <View style={[styles.statCard, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A', marginHorizontal: 16 }]}>
        <Text style={styles.statLabel}>Total Revenue</Text>
        <CurrencyText amount={stats.totalRevenue} style={[styles.statValue, { fontSize: 28 }]} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Monthly Trend</Text>
        <View style={styles.chartPlaceholder}>
          <Text style={styles.placeholderText}>[ Bar Chart: Monthly Revenue ]</Text>
          {stats.monthlyTrend?.map((t: any) => (
             <Text key={t.month} style={{color:'#64748B'}}>{t.month} {t.year}: ₹{t.revenue}</Text>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bill Type Breakdown</Text>
        <View style={styles.chartPlaceholder}>
          <Text style={styles.placeholderText}>[ Pie Chart: Bill Types ]</Text>
          {stats.byType?.map((t: any) => (
             <Text key={t.type} style={{color:'#64748B'}}>{t.type}: {t.count} bills</Text>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Bills</Text>
        {stats.recent?.map((bill: any) => (
          <TouchableOpacity 
            key={bill.uuid} 
            style={styles.recentBill}
            onPress={() => router.push(`/(tabs)/bills/${bill.uuid}`)}
          >
            <View>
              <Text style={styles.billNo}>{bill.billNo}</Text>
              <Text style={styles.custName}>{bill.custName || 'Walk-in'}</Text>
              <Text style={styles.date}>{fmtDate(bill.date)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <CurrencyText amount={bill.total} style={styles.billTotal} />
              <View style={{ marginTop: 4 }}>
                <BillTypeBadge type={bill.type} />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  cardRow: { flexDirection: 'row', padding: 16, gap: 16 },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  statLabel: { fontSize: 14, color: '#64748B', marginBottom: 8, fontWeight: '600' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#1E293B' },
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginBottom: 12 },
  chartPlaceholder: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  placeholderText: { color: '#94A3B8', fontWeight: 'bold', marginBottom: 8 },
  recentBill: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  billNo: { fontWeight: 'bold', color: '#1E293B', marginBottom: 4 },
  custName: { color: '#64748B', fontSize: 14, marginBottom: 4 },
  date: { color: '#94A3B8', fontSize: 12 },
  billTotal: { fontWeight: 'bold', color: '#0A2E1A', fontSize: 16 },
});
