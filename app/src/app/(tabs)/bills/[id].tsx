import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getBillByUuid, deleteBill } from '../../../db/repositories/billRepository';
import { Bill, fmtDate } from '../../../utils';
import { CurrencyText } from '../../../components/ui/CurrencyText';
import { BillTypeBadge } from '../../../components/ui/BillTypeBadge';
import { SyncStatusDot } from '../../../components/ui/SyncStatusDot';
import { Printer, Share2, Trash2, Edit, Download, MessageCircle } from 'lucide-react-native';
import { pdfService } from '../../../services/pdfService';
import { whatsappService } from '../../../services/whatsappService';
import { useSettingsStore } from '../../../store/settingsStore';

export default function BillDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [bill, setBill] = useState<Bill | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const settings = useSettingsStore(state => state.settings);

  useEffect(() => {
    loadBill();
  }, [id]);

  const loadBill = async () => {
    if (!id || typeof id !== 'string') return;
    const data = await getBillByUuid(id);
    setBill(data);
  };

  const handleDelete = () => {
    Alert.alert('Delete Bill', 'Are you sure you want to delete this bill?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        if (!bill) return;
        await deleteBill(bill.uuid);
        router.back();
      }}
    ]);
  };

  const handlePrint = async () => {
    if (!bill) return;
    setIsProcessing(true);
    try {
      await pdfService.printInvoice(bill, settings);
    } catch (e: any) {
      Alert.alert('Print Error', e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSavePDF = async () => {
    if (!bill) return;
    setIsProcessing(true);
    try {
      await pdfService.savePDFToDownloads(bill, settings);
      Alert.alert('Success', 'Invoice saved to Downloads folder.');
    } catch (e: any) {
      Alert.alert('Save Error', e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSharePDF = async () => {
    if (!bill) return;
    setIsProcessing(true);
    try {
      await pdfService.shareViaWhatsApp(bill, settings);
    } catch (e: any) {
      Alert.alert('Share Error', e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWhatsApp = async () => {
    if (!bill) return;
    setIsProcessing(true);
    try {
      // Create message
      const msg = whatsappService.buildWhatsAppMessage(bill, settings.companyName || '', settings.companyPhone || '');
      // Open WhatsApp
      await whatsappService.openWhatsApp(bill.custPhone || '', msg);
      // Wait a moment then share the PDF
      setTimeout(async () => {
        await pdfService.shareViaWhatsApp(bill, settings);
      }, 1500);
    } catch (e: any) {
      Alert.alert('WhatsApp Error', e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!bill) return <View style={styles.center}><Text>Loading...</Text></View>;

  return (
    <View style={styles.container}>
      <ScrollView style={{ flex: 1 }}>
        {bill.syncStatus === 'conflict' && (
          <View style={styles.conflictBanner}>
            <Text style={styles.conflictText}>Sync Conflict: Edited on another device.</Text>
          </View>
        )}
        
        <View style={styles.paper}>
          <View style={styles.header}>
            <View>
              <Text style={styles.billNo}>{bill.billNo}</Text>
              <Text style={styles.date}>Date: {fmtDate(bill.date)}</Text>
            </View>
            <BillTypeBadge type={bill.type} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Billed To</Text>
            <Text style={styles.custName}>{bill.custName || 'Walk-in'}</Text>
            {!!bill.custPhone && <Text style={styles.custDetail}>{bill.custPhone}</Text>}
            {!!bill.custGst && <Text style={styles.custDetail}>GSTIN: {bill.custGst}</Text>}
          </View>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, { flex: 2 }]}>Item</Text>
              <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Qty</Text>
              <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Rate</Text>
              <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Amount</Text>
            </View>
            {bill.items.map((it, i) => (
              <View key={it.uuid || i} style={styles.tr}>
                <Text style={[styles.td, { flex: 2 }]}>{it.description}</Text>
                <Text style={[styles.td, { flex: 1, textAlign: 'right' }]}>{it.qty}</Text>
                <Text style={[styles.td, { flex: 1, textAlign: 'right' }]}>{it.rate}</Text>
                <CurrencyText amount={it.amount} style={[styles.td, { flex: 1, textAlign: 'right' }]} />
              </View>
            ))}
          </View>

          <View style={styles.totals}>
            <View style={styles.rowBetween}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <CurrencyText amount={bill.subtotal} />
            </View>
            {bill.type === 'gst' && (
              <>
                <View style={styles.rowBetween}>
                  <Text style={styles.summaryLabel}>CGST</Text>
                  <CurrencyText amount={bill.cgstTotal} />
                </View>
                <View style={styles.rowBetween}>
                  <Text style={styles.summaryLabel}>SGST</Text>
                  <CurrencyText amount={bill.sgstTotal} />
                </View>
              </>
            )}
            <View style={[styles.rowBetween, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>Grand Total</Text>
              <CurrencyText amount={bill.total} style={styles.grandTotalVal} />
            </View>
            <Text style={styles.words}>{bill.words}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.actionBtn} onPress={handlePrint} disabled={isProcessing}>
          <Printer size={20} color="#0A2E1A" />
          <Text style={styles.actionText}>Print</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={handleSavePDF} disabled={isProcessing}>
          <Download size={20} color="#0A2E1A" />
          <Text style={styles.actionText}>Save PDF</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={handleSharePDF} disabled={isProcessing}>
          <Share2 size={20} color="#0A2E1A" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={handleWhatsApp} disabled={isProcessing}>
          <MessageCircle size={20} color="#16A34A" />
          <Text style={[styles.actionText, { color: '#16A34A' }]}>WhatsApp</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={handleDelete} disabled={isProcessing}>
          <Trash2 size={20} color="#DC2626" />
          <Text style={[styles.actionText, { color: '#DC2626' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  conflictBanner: { backgroundColor: '#FEF08A', padding: 8, alignItems: 'center' },
  conflictText: { color: '#854D0E', fontWeight: 'bold', fontSize: 12 },
  paper: { backgroundColor: '#FFF', margin: 16, padding: 16, borderRadius: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 16, marginBottom: 16 },
  billNo: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginBottom: 4 },
  date: { fontSize: 12, color: '#64748B' },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 12, color: '#94A3B8', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 },
  custName: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
  custDetail: { fontSize: 14, color: '#475569', marginTop: 2 },
  table: { marginBottom: 16, borderWidth: 1, borderColor: '#F1F5F9', borderRadius: 4 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#F8FAFC', padding: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  th: { fontSize: 12, fontWeight: 'bold', color: '#64748B' },
  tr: { flexDirection: 'row', padding: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  td: { fontSize: 14, color: '#1E293B' },
  totals: { borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 16 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  summaryLabel: { color: '#64748B', fontSize: 14 },
  grandTotalRow: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  grandTotalLabel: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
  grandTotalVal: { fontSize: 18, fontWeight: 'bold', color: '#0A2E1A' },
  words: { fontSize: 12, color: '#94A3B8', fontStyle: 'italic', marginTop: 8, textAlign: 'right' },
  actionBar: { flexDirection: 'row', backgroundColor: '#FFF', padding: 16, paddingBottom: 32, borderTopWidth: 1, borderTopColor: '#E2E8F0', justifyContent: 'space-around' },
  actionBtn: { alignItems: 'center' },
  actionText: { fontSize: 12, marginTop: 4, color: '#0A2E1A', fontWeight: '600' },
});
