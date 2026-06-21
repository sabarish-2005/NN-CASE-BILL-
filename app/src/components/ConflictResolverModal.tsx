import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { AlertTriangle, Server, Smartphone } from 'lucide-react-native';
import { Bill } from '../utils';
import { fmtCurrency } from '../utils';

interface Props {
  visible: boolean;
  localBill: Bill | null;
  serverBill: Bill | null;
  onResolve: (choice: 'local' | 'server') => void;
  onCancel: () => void;
}

export function ConflictResolverModal({ visible, localBill, serverBill, onResolve, onCancel }: Props) {
  if (!localBill || !serverBill) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <AlertTriangle size={24} color="#D97706" />
            <Text style={styles.title}>Sync Conflict Detected</Text>
          </View>
          <Text style={styles.subtitle}>
            This bill ({localBill.billNo}) was edited on another device. 
            Review the differences and choose which version to keep.
          </Text>

          <ScrollView style={styles.scroll}>
            <View style={styles.comparisonCard}>
              <View style={styles.cardHeader}>
                <Smartphone size={18} color="#0A2E1A" />
                <Text style={styles.cardTitle}>Your Local Version</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.label}>Customer: <Text style={styles.value}>{localBill.custName}</Text></Text>
                <Text style={styles.label}>Total: <Text style={styles.value}>₹{fmtCurrency(localBill.total)}</Text></Text>
                <Text style={styles.label}>Last Edit: <Text style={styles.value}>{new Date(localBill.updatedAt).toLocaleString()}</Text></Text>
              </View>
              <TouchableOpacity style={[styles.btn, styles.btnLocal]} onPress={() => onResolve('local')}>
                <Text style={styles.btnText}>Keep My Version</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.comparisonCard}>
              <View style={styles.cardHeader}>
                <Server size={18} color="#2563EB" />
                <Text style={styles.cardTitle}>Server Version</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.label}>Customer: <Text style={styles.value}>{serverBill.custName}</Text></Text>
                <Text style={styles.label}>Total: <Text style={styles.value}>₹{fmtCurrency(serverBill.total)}</Text></Text>
                <Text style={styles.label}>Last Edit: <Text style={styles.value}>{new Date(serverBill.updatedAt).toLocaleString()}</Text></Text>
              </View>
              <TouchableOpacity style={[styles.btn, styles.btnServer]} onPress={() => onResolve('server')}>
                <Text style={styles.btnText}>Use Server Version</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
            <Text style={styles.cancelText}>Decide Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#F8FAFC', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '90%' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1E293B' },
  subtitle: { fontSize: 14, color: '#475569', marginBottom: 20, lineHeight: 20 },
  scroll: { maxHeight: 500 },
  comparisonCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
  cardBody: { marginBottom: 16 },
  label: { fontSize: 13, color: '#64748B', marginBottom: 6 },
  value: { color: '#1E293B', fontWeight: '600' },
  btn: { padding: 14, borderRadius: 8, alignItems: 'center' },
  btnLocal: { backgroundColor: '#0A2E1A' },
  btnServer: { backgroundColor: '#2563EB' },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  cancelBtn: { padding: 16, alignItems: 'center', marginTop: 8 },
  cancelText: { color: '#64748B', fontWeight: 'bold', fontSize: 15 },
});
