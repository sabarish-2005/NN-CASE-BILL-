import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useBillStore } from '../../../store/billStore';
import { createBill } from '../../../db/repositories/billRepository';
import { getAllCustomers } from '../../../db/repositories/customerRepository';
import { getAllProducts } from '../../../db/repositories/productRepository';
import { Customer, Product, calcBillTotals, BillType, PaymentMode, getDeviceId, Bill } from '../../../utils';
import { useRouter } from 'expo-router';
import { CurrencyText } from '../../../components/ui/CurrencyText';
import { Plus, Trash2 } from 'lucide-react-native';
import { pdfService } from '../../../services/pdfService';
import { whatsappService } from '../../../services/whatsappService';
import { useSettingsStore } from '../../../store/settingsStore';
import { Modal } from 'react-native';

export default function NewBillScreen() {
  const router = useRouter();
  const { currentBill, items, initNewBill, updateField, addItem, removeItem, reset } = useBillStore();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCust, setSelectedCust] = useState<Customer | null>(null);
  const settings = useSettingsStore(state => state.settings);
  const [showModal, setShowModal] = useState(false);
  const [savedBill, setSavedBill] = useState<Bill | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    initNewBill('dc');
    loadData();
    return () => reset();
  }, []);

  const loadData = async () => {
    const custs = await getAllCustomers();
    const prods = await getAllProducts();
    setCustomers(custs);
    setProducts(prods);
  };

  const handleSave = async (generatePdf = false) => {
    if (!currentBill) return;
    if (items.length === 0) {
      Alert.alert('Error', 'Please add at least one item');
      return;
    }

    try {
      const newBill = await createBill({
        ...currentBill,
        items,
        customerUuid: selectedCust?.uuid,
        custName: selectedCust?.name || currentBill.custName || '',
        custPhone: selectedCust?.phone || currentBill.custPhone || '',
        custAddr: selectedCust?.addr || currentBill.custAddr || '',
        custGst: selectedCust?.gstin || currentBill.custGst || '',
      });
      
      if (generatePdf) {
        setSavedBill(newBill);
        setIsProcessing(true);
        // Prefetch/generate PDF in background
        await pdfService.generateInvoicePDF(newBill, settings);
        setIsProcessing(false);
        setShowModal(true);
      } else {
        router.back();
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
      setIsProcessing(false);
    }
  };

  const handleAction = async (action: string) => {
    if (!savedBill) return;
    try {
      if (action === 'print') {
        await pdfService.printInvoice(savedBill, settings);
      } else if (action === 'save') {
        await pdfService.savePDFToDownloads(savedBill, settings);
        Alert.alert('Success', 'Saved to Downloads');
      } else if (action === 'whatsapp') {
        const msg = whatsappService.buildWhatsAppMessage(savedBill, settings.companyName || '', settings.companyPhone || '');
        await whatsappService.openWhatsApp(savedBill.custPhone || '', msg);
        setTimeout(async () => {
          await pdfService.shareViaWhatsApp(savedBill, settings);
        }, 1500);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleAddItem = () => {
    addItem({ description: 'New Item', qty: 1, rate: 0, gstRate: currentBill?.gstRate || 0 });
  };

  if (!currentBill) return null;

  const totals = calcBillTotals(items as any, currentBill.type as BillType, currentBill.gstRate || 0);

  return (
    <ScrollView style={styles.container}>
      {/* Type & Date */}
      <View style={styles.section}>
        <Text style={styles.label}>Bill Type</Text>
        <View style={styles.row}>
          {['dc', 'cash', 'credit', 'gst', 'job'].map(t => (
            <TouchableOpacity 
              key={t} 
              style={[styles.typeBtn, currentBill.type === t && styles.typeBtnActive]}
              onPress={() => updateField('type', t)}
            >
              <Text style={[styles.typeText, currentBill.type === t && styles.typeTextActive]}>{t.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Customer (Simplified text inputs for now instead of complex dropdown) */}
      <View style={styles.section}>
        <Text style={styles.label}>Customer Name</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Walk-in or Search..." 
          value={currentBill.custName}
          onChangeText={t => updateField('custName', t)}
        />
        <TextInput 
          style={styles.input} 
          placeholder="Phone" 
          value={currentBill.custPhone}
          onChangeText={t => updateField('custPhone', t)}
        />
      </View>

      {/* Items */}
      <View style={styles.section}>
        <View style={styles.rowBetween}>
          <Text style={styles.label}>Items</Text>
          <TouchableOpacity onPress={handleAddItem} style={styles.addBtn}>
            <Plus size={16} color="#0A2E1A" />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
        
        {items.map((it, idx) => (
          <View key={it.uuid} style={styles.itemRow}>
            <View style={{ flex: 1 }}>
              <Text>Item {idx + 1}</Text>
              {/* In a real app, bind to updateItem */}
              <Text style={{color:'#64748B'}}>{it.qty} x ₹{it.rate}</Text>
            </View>
            <TouchableOpacity onPress={() => removeItem(it.uuid!)}>
              <Trash2 size={20} color="#DC2626" />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Totals */}
      <View style={styles.section}>
        <View style={styles.rowBetween}>
          <Text style={styles.summaryLabel}>Subtotal:</Text>
          <CurrencyText amount={totals.subtotal} />
        </View>
        {currentBill.type === 'gst' && (
          <>
            <View style={styles.rowBetween}>
              <Text style={styles.summaryLabel}>CGST:</Text>
              <CurrencyText amount={totals.cgstTotal} />
            </View>
            <View style={styles.rowBetween}>
              <Text style={styles.summaryLabel}>SGST:</Text>
              <CurrencyText amount={totals.sgstTotal} />
            </View>
          </>
        )}
        <View style={styles.rowBetween}>
          <Text style={styles.summaryLabel}>Total:</Text>
          <CurrencyText amount={totals.total} style={styles.grandTotal} />
        </View>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={[styles.saveBtn, { flex: 1, backgroundColor: '#64748B' }]} onPress={() => handleSave(false)}>
          <Text style={styles.saveBtnText}>Save Draft</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.saveBtn, { flex: 2, marginLeft: 8 }]} onPress={() => handleSave(true)} disabled={isProcessing}>
          <Text style={styles.saveBtnText}>{isProcessing ? 'Generating PDF...' : 'Save & Generate PDF'}</Text>
        </TouchableOpacity>
      </View>
      
      <View style={{ height: 40 }} />

      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Bill Saved Successfully!</Text>
            <TouchableOpacity style={styles.modalBtn} onPress={() => handleAction('print')}>
              <Text style={styles.modalBtnText}>Print Now</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalBtn} onPress={() => handleAction('save')}>
              <Text style={styles.modalBtnText}>Save to Downloads</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalBtn} onPress={() => handleAction('whatsapp')}>
              <Text style={styles.modalBtnText}>Share via WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#E2E8F0', marginTop: 16 }]} onPress={() => { setShowModal(false); router.back(); }}>
              <Text style={[styles.modalBtnText, { color: '#1E293B' }]}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  section: { backgroundColor: '#FFF', padding: 16, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  label: { fontSize: 14, fontWeight: 'bold', color: '#1E293B', marginBottom: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  typeBtnActive: { backgroundColor: '#0A2E1A', borderColor: '#0A2E1A' },
  typeText: { fontSize: 12, color: '#64748B' },
  typeTextActive: { color: '#FFF', fontWeight: 'bold' },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 12, marginBottom: 8, backgroundColor: '#FAFAFA' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderColor: '#BBF7D0', borderWidth: 1 },
  addBtnText: { color: '#0A2E1A', fontSize: 12, fontWeight: 'bold', marginLeft: 4 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  summaryLabel: { color: '#64748B', fontSize: 14 },
  grandTotal: { fontSize: 18, fontWeight: 'bold', color: '#0A2E1A' },
  saveBtn: { backgroundColor: '#0A2E1A', padding: 16, borderRadius: 8, alignItems: 'center' },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  actionRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', padding: 24, borderRadius: 12, width: '80%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginBottom: 20, textAlign: 'center' },
  modalBtn: { backgroundColor: '#0A2E1A', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 8 },
  modalBtnText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
});
