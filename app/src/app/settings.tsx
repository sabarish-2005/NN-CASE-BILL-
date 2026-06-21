import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Alert, Image, Linking, Modal, ActivityIndicator,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSettingsStore } from '../store/settingsStore';
import { useAuthStore } from '../store/authStore';
import { useSyncStore } from '../store/syncStore';
import { settingsRepository } from '../db/repositories/settingsRepository';
import { pdfService } from '../services/pdfService';
import { syncService } from '../services/syncService';
import { BILL_TYPE_CONFIG, BILL_TYPES, GST_RATES, BillType, CO } from '../utils';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import {
  Building2, Landmark, ImageIcon, FileText, Palette, Database,
  RefreshCw, Shield, Info, ChevronRight, LogOut, Trash2, Download,
  Eye, EyeOff, Camera, X, AlertTriangle, Check,
} from 'lucide-react-native';

// ── Indian States ────────────────────────────────────────────
const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry',
];

const THEME_COLORS = [
  { name: 'Green', value: '#0A2E1A' },
  { name: 'Navy', value: '#1e3a5f' },
  { name: 'Purple', value: '#6B21A8' },
  { name: 'Orange', value: '#C2410C' },
  { name: 'Red', value: '#991B1B' },
];

// ── Validation helpers ───────────────────────────────────────
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

// ── Section Header Component ─────────────────────────────────
function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIconWrap}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
}

// ── Field Label ──────────────────────────────────────────────
function Label({ text, required }: { text: string; required?: boolean }) {
  return (
    <Text style={styles.label}>
      {text}{required && <Text style={{ color: '#DC2626' }}> *</Text>}
    </Text>
  );
}

// ── Dropdown Picker (simple modal) ───────────────────────────
function DropdownPicker({ label, value, options, onSelect, disabled }: {
  label: string; value: string; options: string[]; onSelect: (v: string) => void; disabled?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <Label text={label} />
      <TouchableOpacity
        style={[styles.input, styles.dropdown, disabled && styles.inputDisabled]}
        onPress={() => !disabled && setVisible(true)}
      >
        <Text style={[styles.dropdownText, !value && { color: '#94A3B8' }]}>
          {value || `Select ${label}...`}
        </Text>
        <ChevronRight size={16} color="#94A3B8" style={{ transform: [{ rotate: '90deg' }] }} />
      </TouchableOpacity>
      <Modal visible={visible} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setVisible(false)} activeOpacity={1}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalSheetTitle}>{label}</Text>
            <ScrollView style={{ maxHeight: 400 }}>
              {options.map(opt => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.modalOption, value === opt && styles.modalOptionActive]}
                  onPress={() => { onSelect(opt); setVisible(false); }}
                >
                  <Text style={[styles.modalOptionText, value === opt && styles.modalOptionTextActive]}>
                    {opt}
                  </Text>
                  {value === opt && <Check size={18} color="#0A2E1A" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN SETTINGS SCREEN
// ══════════════════════════════════════════════════════════════
export default function SettingsScreen() {
  const router = useRouter();
  const { settings, setSetting, resetSettings } = useSettingsStore();
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const { pendingCount, refreshPendingCount } = useSyncStore();
  const isAdmin = user?.role === 'admin';

  // Local form state (batched saves per section)
  const [companyForm, setCompanyForm] = useState({
    companyName: '', companyAddr: '', companyPhone: '', companyEmail: '',
    gstin: '', companyState: '', companyPincode: '',
  });
  const [bankForm, setBankForm] = useState({
    bankName: '', bankAcctHolder: '', bankAcct: '', bankIfsc: '', bankBranch: '', upiId: '',
  });
  const [invoiceForm, setInvoiceForm] = useState({
    defaultBillType: 'dc' as string, billPrefix: '', nextBillNumber: '1',
    defaultGstRate: '0', defaultPaymentTerms: '', defaultNotes: '',
  });

  const [showAcct, setShowAcct] = useState(false);
  const [pdfSize, setPdfSize] = useState('...');
  const [recordCounts, setRecordCounts] = useState({ bills: 0, customers: 0, products: 0, labors: 0 });
  const [syncLogs, setSyncLogs] = useState<any[]>([]);
  const [isBusy, setIsBusy] = useState(false);

  // ── Hydrate local forms from store on mount ────────────────
  useEffect(() => {
    setCompanyForm({
      companyName: settings.companyName || CO.name,
      companyAddr: settings.companyAddr || CO.addr,
      companyPhone: settings.companyPhone || CO.phone,
      companyEmail: (settings as any).companyEmail || '',
      gstin: settings.gstin || '',
      companyState: (settings as any).companyState || CO.state,
      companyPincode: (settings as any).companyPincode || CO.pin,
    });
    setBankForm({
      bankName: settings.bankName || '',
      bankAcctHolder: (settings as any).bankAcctHolder || '',
      bankAcct: (settings as any).bankAcct || '',
      bankIfsc: (settings as any).bankIfsc || '',
      bankBranch: (settings as any).bankBranch || '',
      upiId: (settings as any).upiId || '',
    });
    setInvoiceForm({
      defaultBillType: (settings as any).defaultBillType || 'dc',
      billPrefix: (settings as any).billPrefix || 'NN',
      nextBillNumber: String((settings as any).nextBillNumber || 1),
      defaultGstRate: String((settings as any).defaultGstRate || 0),
      defaultPaymentTerms: (settings as any).defaultPaymentTerms || '',
      defaultNotes: (settings as any).defaultNotes || '',
    });
    loadAsyncData();
  }, []);

  const loadAsyncData = async () => {
    try {
      setPdfSize(await pdfService.getPDFStorageSize());
    } catch { setPdfSize('Unknown'); }
    try {
      setRecordCounts(await settingsRepository.getRecordCounts());
    } catch {}
    try {
      setSyncLogs(await settingsRepository.getRecentSyncLogs(5));
    } catch {}
    refreshPendingCount();
  };

  // ── Persist helper ─────────────────────────────────────────
  const persistSetting = async (key: string, value: any) => {
    const strVal = String(value);
    await settingsRepository.setSetting(key, strVal);
    setSetting(key as any, value);
  };

  // ── SECTION SAVE: Company ──────────────────────────────────
  const saveCompany = async () => {
    if (!companyForm.companyName.trim()) {
      return Alert.alert('Validation', 'Company Name is required.');
    }
    if (companyForm.gstin && !GSTIN_REGEX.test(companyForm.gstin)) {
      return Alert.alert('Validation', 'GSTIN format is invalid. Expected: 22AAAAA0000A1Z5');
    }
    setIsBusy(true);
    try {
      for (const [k, v] of Object.entries(companyForm)) {
        await persistSetting(k, v);
      }
      Alert.alert('✓ Saved', 'Company info saved.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally { setIsBusy(false); }
  };

  // ── SECTION SAVE: Bank ─────────────────────────────────────
  const saveBank = async () => {
    if (!isAdmin) return Alert.alert('Permission', 'Only Admins can change bank details.');
    if (bankForm.bankIfsc && !IFSC_REGEX.test(bankForm.bankIfsc)) {
      return Alert.alert('Validation', 'IFSC format is invalid. Expected: ABCD0123456');
    }
    setIsBusy(true);
    try {
      for (const [k, v] of Object.entries(bankForm)) {
        await persistSetting(k, v);
      }
      Alert.alert('✓ Saved', 'Bank details saved.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally { setIsBusy(false); }
  };

  // ── SECTION SAVE: Invoice Prefs ────────────────────────────
  const saveInvoicePrefs = async () => {
    if (!isAdmin) return Alert.alert('Permission', 'Only Admins can change invoice preferences.');
    setIsBusy(true);
    try {
      await persistSetting('defaultBillType', invoiceForm.defaultBillType);
      await persistSetting('billPrefix', invoiceForm.billPrefix);
      await persistSetting('nextBillNumber', parseInt(invoiceForm.nextBillNumber) || 1);
      await persistSetting('defaultGstRate', parseInt(invoiceForm.defaultGstRate) || 0);
      await persistSetting('defaultPaymentTerms', invoiceForm.defaultPaymentTerms);
      await persistSetting('defaultNotes', invoiceForm.defaultNotes);
      Alert.alert('✓ Saved', 'Invoice preferences saved.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally { setIsBusy(false); }
  };

  // ── Image Picker ───────────────────────────────────────────
  const pickImage = async (key: 'logoUri' | 'signatureUri') => {
    if (!isAdmin) return Alert.alert('Permission', 'Only Admins can change this.');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: key === 'logoUri' ? [1, 1] : [5, 2],
      quality: 0.5,
    });
    if (!result.canceled && result.assets[0]) {
      const destDir = FileSystem.documentDirectory + 'settings/';
      const dirInfo = await FileSystem.getInfoAsync(destDir);
      if (!dirInfo.exists) await FileSystem.makeDirectoryAsync(destDir, { intermediates: true });
      const filename = key === 'logoUri' ? 'logo.png' : 'signature.png';
      const destPath = destDir + filename;
      await FileSystem.copyAsync({ from: result.assets[0].uri, to: destPath });
      await persistSetting(key, destPath);
    }
  };

  const removeImage = async (key: 'logoUri' | 'signatureUri') => {
    if (!isAdmin) return;
    const path = settings[key];
    if (path) {
      try { await FileSystem.deleteAsync(path as string, { idempotent: true }); } catch {}
    }
    await persistSetting(key, '');
  };

  // ── Appearance ─────────────────────────────────────────────
  const toggleDarkMode = async (val: boolean) => {
    await persistSetting('darkMode', val);
  };

  const selectThemeColor = async (color: string) => {
    await persistSetting('themeColor', color);
  };

  const selectFontSize = async (size: string) => {
    await persistSetting('fontSize', size);
  };

  // ── Storage Actions ────────────────────────────────────────
  const clearOldPdfs = async () => {
    if (!isAdmin) return Alert.alert('Permission', 'Admin only.');
    setIsBusy(true);
    try {
      await pdfService.deleteOldPDFs(30);
      const newSize = await pdfService.getPDFStorageSize();
      setPdfSize(newSize);
      Alert.alert('✓ Done', 'Old PDFs cleared successfully.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally { setIsBusy(false); }
  };

  const clearSyncQueue = async () => {
    if (!isAdmin) return Alert.alert('Permission', 'Admin only.');
    setIsBusy(true);
    try {
      const cleared = await settingsRepository.clearSyncedFromQueue();
      Alert.alert('✓ Done', `Cleared ${cleared} synced items from queue.`);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally { setIsBusy(false); }
  };

  const resetAppData = () => {
    if (!isAdmin) return Alert.alert('Permission', 'Admin only.');
    Alert.alert(
      '⚠️ Reset All Data',
      'This will delete ALL local data including bills, customers, products, and labors. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything', style: 'destructive',
          onPress: async () => {
            setIsBusy(true);
            try {
              await settingsRepository.resetAllData();
              resetSettings();
              await logout();
              router.replace('/(auth)/login');
            } catch (e: any) {
              Alert.alert('Error', e.message);
            } finally { setIsBusy(false); }
          },
        },
      ]
    );
  };

  const runSync = async () => {
    if (!isAdmin) return Alert.alert('Permission', 'Admin only.');
    setIsBusy(true);
    try {
      const res = await syncService.syncNow();
      Alert.alert('✓ Sync Complete', `Pushed: ${res.pushed}\nPulled: ${res.pulled}\nConflicts: ${res.conflicts}\nErrors: ${res.errors}`);
      const newLogs = await settingsRepository.getRecentSyncLogs(5);
      setSyncLogs(newLogs);
    } catch (e: any) {
      Alert.alert('Sync Failed', e.message);
    } finally {
      setIsBusy(false);
    }
  };

  // ── Logout ─────────────────────────────────────────────────
  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure? Local data will be preserved.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out', style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  // ══════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════
  return (
    <>
      <Stack.Screen options={{ title: 'Settings', headerBackTitle: 'Back' }} />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* ═══ SECTION 1: COMPANY INFO ═══ */}
        <View style={styles.section}>
          <SectionHeader
            icon={<Building2 size={20} color="#0A2E1A" />}
            title="Company Information"
            subtitle={isAdmin ? 'Edit your business details' : 'View only — contact Admin to edit'}
          />
          <Label text="Company Name" required />
          <TextInput style={[styles.input, !isAdmin && styles.inputDisabled]} placeholder="Company Name" value={companyForm.companyName}
            onChangeText={t => setCompanyForm(p => ({ ...p, companyName: t }))} editable={isAdmin} />

          <Label text="Address" />
          <TextInput style={[styles.input, styles.multiline, !isAdmin && styles.inputDisabled]} placeholder="Full address" value={companyForm.companyAddr}
            onChangeText={t => setCompanyForm(p => ({ ...p, companyAddr: t }))} multiline editable={isAdmin} />

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 6 }}>
              <Label text="Phone" />
              <TextInput style={[styles.input, !isAdmin && styles.inputDisabled]} placeholder="Phone" value={companyForm.companyPhone}
                onChangeText={t => setCompanyForm(p => ({ ...p, companyPhone: t }))} keyboardType="phone-pad" editable={isAdmin} />
            </View>
            <View style={{ flex: 1, marginLeft: 6 }}>
              <Label text="Email" />
              <TextInput style={[styles.input, !isAdmin && styles.inputDisabled]} placeholder="Email" value={companyForm.companyEmail}
                onChangeText={t => setCompanyForm(p => ({ ...p, companyEmail: t }))} keyboardType="email-address" editable={isAdmin} />
            </View>
          </View>

          <Label text="GSTIN" />
          <TextInput style={[styles.input, !isAdmin && styles.inputDisabled]} placeholder="22AAAAA0000A1Z5" value={companyForm.gstin}
            onChangeText={t => setCompanyForm(p => ({ ...p, gstin: t.toUpperCase() }))} autoCapitalize="characters" editable={isAdmin} />

          <DropdownPicker label="State" value={companyForm.companyState} options={INDIAN_STATES}
            onSelect={v => setCompanyForm(p => ({ ...p, companyState: v }))} disabled={!isAdmin} />

          <Label text="Pincode" />
          <TextInput style={[styles.input, !isAdmin && styles.inputDisabled]} placeholder="641658" value={companyForm.companyPincode}
            onChangeText={t => setCompanyForm(p => ({ ...p, companyPincode: t.replace(/\D/g, '').slice(0, 6) }))} keyboardType="number-pad" editable={isAdmin} />

          {isAdmin && (
            <TouchableOpacity style={styles.saveBtn} onPress={saveCompany} disabled={isBusy}>
              <Check size={18} color="#FFF" />
              <Text style={styles.saveBtnText}>Save Company Info</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ═══ SECTION 2: BANK DETAILS ═══ */}
        {isAdmin && (
          <View style={styles.section}>
            <SectionHeader
              icon={<Landmark size={20} color="#0A2E1A" />}
              title="Bank Details"
              subtitle="Used in GST invoice footer"
            />
            <Label text="Bank Name" />
            <TextInput style={styles.input} placeholder="HDFC Bank" value={bankForm.bankName}
              onChangeText={t => setBankForm(p => ({ ...p, bankName: t }))} />

            <Label text="Account Holder Name" />
            <TextInput style={styles.input} placeholder="Account holder" value={bankForm.bankAcctHolder}
              onChangeText={t => setBankForm(p => ({ ...p, bankAcctHolder: t }))} />

            <Label text="Account Number" />
            <View style={styles.passwordRow}>
              <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder="Account number"
                value={bankForm.bankAcct}
                onChangeText={t => setBankForm(p => ({ ...p, bankAcct: t.replace(/\D/g, '') }))}
                secureTextEntry={!showAcct} keyboardType="number-pad" />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowAcct(!showAcct)}>
                {showAcct ? <EyeOff size={20} color="#64748B" /> : <Eye size={20} color="#64748B" />}
              </TouchableOpacity>
            </View>

            <Label text="IFSC Code" />
            <TextInput style={styles.input} placeholder="HDFC0001234" value={bankForm.bankIfsc}
              onChangeText={t => setBankForm(p => ({ ...p, bankIfsc: t.toUpperCase() }))} autoCapitalize="characters" />

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 6 }}>
                <Label text="Branch" />
                <TextInput style={styles.input} placeholder="Main Branch" value={bankForm.bankBranch}
                  onChangeText={t => setBankForm(p => ({ ...p, bankBranch: t }))} />
              </View>
              <View style={{ flex: 1, marginLeft: 6 }}>
                <Label text="UPI ID" />
                <TextInput style={styles.input} placeholder="name@upi" value={bankForm.upiId}
                  onChangeText={t => setBankForm(p => ({ ...p, upiId: t }))} />
              </View>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={saveBank} disabled={isBusy}>
              <Check size={18} color="#FFF" />
              <Text style={styles.saveBtnText}>Save Bank Details</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ═══ SECTION 3: LOGO & SIGNATURE ═══ */}
        {isAdmin && (
          <View style={styles.section}>
            <SectionHeader
              icon={<ImageIcon size={20} color="#0A2E1A" />}
              title="Logo & Signature"
              subtitle="Used in PDF invoice header and footer"
            />
            <View style={styles.imageRow}>
              {/* Logo */}
              <View style={styles.imageCol}>
                <Text style={styles.imageLabel}>Company Logo</Text>
                {settings.logoUri ? (
                  <Image source={{ uri: settings.logoUri as string }} style={styles.logoPreview} />
                ) : (
                  <View style={styles.logoPlaceholder}>
                    <Camera size={32} color="#94A3B8" />
                    <Text style={styles.placeholderText}>No Logo</Text>
                  </View>
                )}
                <View style={styles.imageActions}>
                  <TouchableOpacity style={styles.uploadBtn} onPress={() => pickImage('logoUri')}>
                    <Text style={styles.uploadBtnText}>Upload</Text>
                  </TouchableOpacity>
                  {!!settings.logoUri && (
                    <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage('logoUri')}>
                      <X size={14} color="#DC2626" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Signature */}
              <View style={styles.imageCol}>
                <Text style={styles.imageLabel}>Signature</Text>
                {settings.signatureUri ? (
                  <Image source={{ uri: settings.signatureUri as string }} style={styles.sigPreview} />
                ) : (
                  <View style={styles.sigPlaceholder}>
                    <Text style={styles.placeholderText}>No Signature</Text>
                  </View>
                )}
                <View style={styles.imageActions}>
                  <TouchableOpacity style={styles.uploadBtn} onPress={() => pickImage('signatureUri')}>
                    <Text style={styles.uploadBtnText}>Upload</Text>
                  </TouchableOpacity>
                  {!!settings.signatureUri && (
                    <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage('signatureUri')}>
                      <X size={14} color="#DC2626" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ═══ SECTION 4: INVOICE PREFERENCES ═══ */}
        {isAdmin && (
          <View style={styles.section}>
            <SectionHeader
              icon={<FileText size={20} color="#0A2E1A" />}
              title="Invoice Preferences"
              subtitle="Defaults for new bills"
            />
            <DropdownPicker
              label="Default Bill Type"
              value={BILL_TYPE_CONFIG[invoiceForm.defaultBillType as BillType]?.label || 'Delivery Challan'}
              options={BILL_TYPES.map(t => BILL_TYPE_CONFIG[t].label)}
              onSelect={v => {
                const type = BILL_TYPES.find(t => BILL_TYPE_CONFIG[t].label === v) || 'dc';
                setInvoiceForm(p => ({ ...p, defaultBillType: type }));
              }}
            />

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 6 }}>
                <Label text="Bill Prefix" />
                <TextInput style={styles.input} placeholder="NN" value={invoiceForm.billPrefix}
                  onChangeText={t => setInvoiceForm(p => ({ ...p, billPrefix: t.toUpperCase() }))} autoCapitalize="characters" />
              </View>
              <View style={{ flex: 1, marginLeft: 6 }}>
                <Label text="Next Bill Number" />
                <TextInput style={styles.input} placeholder="1" value={invoiceForm.nextBillNumber}
                  onChangeText={t => setInvoiceForm(p => ({ ...p, nextBillNumber: t.replace(/\D/g, '') }))} keyboardType="number-pad" />
              </View>
            </View>
            <View style={styles.warningBox}>
              <AlertTriangle size={14} color="#D97706" />
              <Text style={styles.warningText}>Changing the bill number may cause duplicates.</Text>
            </View>

            <DropdownPicker
              label="Default GST Rate"
              value={`${invoiceForm.defaultGstRate}%`}
              options={GST_RATES.map(r => `${r}%`)}
              onSelect={v => setInvoiceForm(p => ({ ...p, defaultGstRate: v.replace('%', '') }))}
            />

            <Label text="Default Payment Terms" />
            <TextInput style={styles.input} placeholder="Payment due within 30 days" value={invoiceForm.defaultPaymentTerms}
              onChangeText={t => setInvoiceForm(p => ({ ...p, defaultPaymentTerms: t }))} />

            <Label text="Default Notes / Terms & Conditions" />
            <TextInput style={[styles.input, styles.multiline]} placeholder="Thanks for your business!" value={invoiceForm.defaultNotes}
              onChangeText={t => setInvoiceForm(p => ({ ...p, defaultNotes: t }))} multiline />

            <TouchableOpacity style={styles.saveBtn} onPress={saveInvoicePrefs} disabled={isBusy}>
              <Check size={18} color="#FFF" />
              <Text style={styles.saveBtnText}>Save Invoice Preferences</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ═══ SECTION 5: APPEARANCE ═══ */}
        <View style={styles.section}>
          <SectionHeader
            icon={<Palette size={20} color="#0A2E1A" />}
            title="Appearance"
          />
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Dark Mode</Text>
            <Switch
              value={!!settings.darkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: '#CBD5E1', true: '#0A2E1A' }}
              thumbColor={settings.darkMode ? '#C9A227' : '#F4F4F5'}
            />
          </View>

          <Text style={[styles.label, { marginTop: 16 }]}>Theme Color</Text>
          <View style={styles.colorRow}>
            {THEME_COLORS.map(c => (
              <TouchableOpacity
                key={c.value}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: c.value },
                  settings.themeColor === c.value && styles.colorSwatchActive,
                ]}
                onPress={() => selectThemeColor(c.value)}
              >
                {settings.themeColor === c.value && <Check size={16} color="#FFF" />}
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { marginTop: 16 }]}>Font Size</Text>
          <View style={styles.segmentRow}>
            {['small', 'medium', 'large'].map(sz => (
              <TouchableOpacity
                key={sz}
                style={[styles.segmentBtn, settings.fontSize === sz && styles.segmentBtnActive]}
                onPress={() => selectFontSize(sz)}
              >
                <Text style={[styles.segmentText, settings.fontSize === sz && styles.segmentTextActive]}>
                  {sz.charAt(0).toUpperCase() + sz.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ═══ SECTION 6: STORAGE & DATA ═══ */}
        <View style={styles.section}>
          <SectionHeader
            icon={<Database size={20} color="#0A2E1A" />}
            title="Storage & Data"
          />
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>PDF Storage</Text>
            <Text style={styles.statValue}>{pdfSize}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Local Records</Text>
            <Text style={styles.statValue}>
              {recordCounts.bills} bills · {recordCounts.customers} customers · {recordCounts.products} products · {recordCounts.labors} labors
            </Text>
          </View>

          {isAdmin && (
            <>
              <TouchableOpacity style={styles.actionRow} onPress={clearOldPdfs} disabled={isBusy}>
                <Trash2 size={18} color="#D97706" />
                <Text style={[styles.actionRowText, { color: '#D97706' }]}>Clear Old PDFs (30+ days)</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionRow} onPress={clearSyncQueue} disabled={isBusy}>
                <RefreshCw size={18} color="#2563EB" />
                <Text style={[styles.actionRowText, { color: '#2563EB' }]}>Clear Synced Queue Items</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionRow} onPress={() => Alert.alert('Info', 'Connect to internet to export.')}>
                <Download size={18} color="#0A2E1A" />
                <Text style={[styles.actionRowText, { color: '#0A2E1A' }]}>Export All Data as Excel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionRow, styles.dangerRow]} onPress={resetAppData} disabled={isBusy}>
                <AlertTriangle size={18} color="#DC2626" />
                <Text style={[styles.actionRowText, { color: '#DC2626' }]}>Reset App Data</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* ═══ SECTION 7: SYNC STATUS ═══ */}
        <View style={styles.section}>
          <SectionHeader
            icon={<RefreshCw size={20} color="#0A2E1A" />}
            title="Sync Status"
          />
          <View style={styles.syncRow}>
            <Text style={styles.syncLabel}>Last Synced</Text>
            <Text style={styles.syncValue}>{settings.lastSyncAt || 'Never'}</Text>
          </View>
          <View style={styles.syncRow}>
            <Text style={styles.syncLabel}>Pending Changes</Text>
            <View style={[styles.badge, pendingCount > 0 && styles.badgeWarning]}>
              <Text style={[styles.badgeText, pendingCount > 0 && styles.badgeTextWarning]}>
                {pendingCount} items
              </Text>
            </View>
          </View>

          {isAdmin && (
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: '#16A34A', marginTop: 12 }]}
              onPress={runSync} disabled={isBusy}>
              <RefreshCw size={18} color="#FFF" />
              <Text style={styles.saveBtnText}>Sync Now</Text>
            </TouchableOpacity>
          )}

          {syncLogs.length > 0 && (
            <View style={{ marginTop: 16 }}>
              <Text style={styles.label}>Recent Sync Log</Text>
              {syncLogs.map(log => (
                <View key={log.id} style={styles.logItem}>
                  <Text style={styles.logTime}>{log.timestamp}</Text>
                  <Text style={styles.logDetail}>↑{log.pushed} ↓{log.pulled} ⚠{log.conflicts}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ═══ SECTION 8: ACCOUNT & SECURITY ═══ */}
        <View style={styles.section}>
          <SectionHeader
            icon={<Shield size={20} color="#0A2E1A" />}
            title="Account & Security"
          />
          <View style={styles.userCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(user?.name || 'U')[0].toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{user?.name || 'User'}</Text>
              <Text style={styles.userEmail}>{user?.email || ''}</Text>
              <View style={[styles.roleBadge, user?.role === 'admin' && styles.roleBadgeAdmin]}>
                <Text style={[styles.roleBadgeText, user?.role === 'admin' && styles.roleBadgeTextAdmin]}>
                  {user?.role === 'admin' ? 'Admin' : 'Staff'}
                </Text>
              </View>
            </View>
          </View>

          {isAdmin && (
            <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/admin')}>
              <Shield size={18} color="#0A2E1A" />
              <Text style={[styles.actionRowText, { color: '#0A2E1A' }]}>Admin Panel</Text>
              <ChevronRight size={16} color="#94A3B8" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.actionRow}
            onPress={() => Alert.alert('Info', 'Connect to internet to change password.')}>
            <Shield size={18} color="#0A2E1A" />
            <Text style={[styles.actionRowText, { color: '#0A2E1A' }]}>Change Password</Text>
            <ChevronRight size={16} color="#94A3B8" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <LogOut size={20} color="#FFF" />
            <Text style={styles.logoutBtnText}>Log Out</Text>
          </TouchableOpacity>
        </View>

        {/* ═══ SECTION 9: ABOUT ═══ */}
        <View style={[styles.section, { marginBottom: 60 }]}>
          <SectionHeader
            icon={<Info size={20} color="#0A2E1A" />}
            title="About"
          />
          <View style={styles.aboutRow}><Text style={styles.aboutLabel}>App Name</Text><Text style={styles.aboutValue}>NN Billing</Text></View>
          <View style={styles.aboutRow}><Text style={styles.aboutLabel}>Version</Text><Text style={styles.aboutValue}>1.0.0</Text></View>
          <View style={styles.aboutRow}><Text style={styles.aboutLabel}>Build</Text><Text style={styles.aboutValue}>2026.06.20</Text></View>
          <View style={styles.aboutRow}><Text style={styles.aboutLabel}>Company</Text><Text style={styles.aboutValue}>{CO.name}</Text></View>

          <View style={{ marginTop: 16 }}>
            <TouchableOpacity style={styles.linkRow} onPress={() => Linking.openURL('https://nnbilling.app/privacy')}>
              <Text style={styles.linkText}>Privacy Policy</Text>
              <ChevronRight size={16} color="#94A3B8" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkRow} onPress={() => Linking.openURL('https://nnbilling.app/terms')}>
              <Text style={styles.linkText}>Terms of Use</Text>
              <ChevronRight size={16} color="#94A3B8" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkRow} onPress={() => Linking.openURL(`mailto:support@nnbilling.app`)}>
              <Text style={styles.linkText}>Contact Support</Text>
              <ChevronRight size={16} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>

      {isBusy && (
        <View style={styles.busyOverlay}>
          <ActivityIndicator size="large" color="#0A2E1A" />
        </View>
      )}
    </>
  );
}

// ══════════════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },

  // ── Section ────────────────────────────────────────────────
  section: {
    backgroundColor: '#FFF',
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sectionIconWrap: {
    width: 36, height: 36, borderRadius: 8, backgroundColor: '#F0FDF4',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
  sectionSubtitle: { fontSize: 12, color: '#94A3B8', marginTop: 2 },

  // ── Inputs ─────────────────────────────────────────────────
  label: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12,
    backgroundColor: '#FAFAFA', fontSize: 14, color: '#1E293B',
  },
  inputDisabled: { backgroundColor: '#F1F5F9', color: '#94A3B8' },
  multiline: { height: 72, textAlignVertical: 'top' },
  row: { flexDirection: 'row' },

  // ── Dropdown ───────────────────────────────────────────────
  dropdown: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dropdownText: { fontSize: 14, color: '#1E293B' },

  // ── Modal Sheet ────────────────────────────────────────────
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, paddingBottom: 32 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#CBD5E1', alignSelf: 'center', marginBottom: 12 },
  modalSheetTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', marginBottom: 12 },
  modalOption: { paddingVertical: 14, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalOptionActive: { backgroundColor: '#F0FDF4' },
  modalOptionText: { fontSize: 15, color: '#1E293B' },
  modalOptionTextActive: { fontWeight: 'bold', color: '#0A2E1A' },

  // ── Password row ───────────────────────────────────────────
  passwordRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  eyeBtn: { padding: 10, marginLeft: 8 },

  // ── Save button ────────────────────────────────────────────
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#0A2E1A', paddingVertical: 12, borderRadius: 8, marginTop: 8, gap: 8,
  },
  saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },

  // ── Warning box ────────────────────────────────────────────
  warningBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFFBEB', padding: 10, borderRadius: 8, marginBottom: 12,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  warningText: { fontSize: 12, color: '#92400E', flex: 1 },

  // ── Images ─────────────────────────────────────────────────
  imageRow: { flexDirection: 'row', justifyContent: 'space-around' },
  imageCol: { alignItems: 'center' },
  imageLabel: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 8 },
  logoPreview: { width: 120, height: 120, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  logoPlaceholder: {
    width: 120, height: 120, borderRadius: 12, backgroundColor: '#F1F5F9',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#CBD5E1', borderStyle: 'dashed',
  },
  sigPreview: { width: 200, height: 80, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  sigPlaceholder: {
    width: 200, height: 80, borderRadius: 8, backgroundColor: '#F1F5F9',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#CBD5E1', borderStyle: 'dashed',
  },
  placeholderText: { color: '#94A3B8', fontSize: 12, marginTop: 4 },
  imageActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  uploadBtn: { backgroundColor: '#E2E8F0', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 6 },
  uploadBtnText: { color: '#1E293B', fontSize: 12, fontWeight: 'bold' },
  removeBtn: { backgroundColor: '#FEF2F2', padding: 6, borderRadius: 6, borderWidth: 1, borderColor: '#FCA5A5' },

  // ── Appearance ─────────────────────────────────────────────
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchLabel: { fontSize: 15, color: '#1E293B', fontWeight: '500' },
  colorRow: { flexDirection: 'row', gap: 12 },
  colorSwatch: {
    width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'transparent',
  },
  colorSwatchActive: { borderColor: '#C9A227', borderWidth: 3 },
  segmentRow: { flexDirection: 'row', borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' },
  segmentBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: '#F8FAFC' },
  segmentBtnActive: { backgroundColor: '#0A2E1A' },
  segmentText: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  segmentTextActive: { color: '#FFF' },

  // ── Storage ────────────────────────────────────────────────
  statCard: {
    backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8, marginBottom: 8,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  statLabel: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  statValue: { fontSize: 14, color: '#1E293B', marginTop: 2 },
  actionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  actionRowText: { fontSize: 14, fontWeight: '600' },
  dangerRow: { borderBottomWidth: 0, marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#FCA5A5' },

  // ── Sync ───────────────────────────────────────────────────
  syncRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  syncLabel: { fontSize: 14, color: '#475569' },
  syncValue: { fontSize: 14, color: '#1E293B', fontWeight: '600' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: '#F1F5F9' },
  badgeWarning: { backgroundColor: '#FEF08A' },
  badgeText: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  badgeTextWarning: { color: '#854D0E' },
  logItem: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  logTime: { fontSize: 12, color: '#64748B' },
  logDetail: { fontSize: 12, color: '#1E293B', fontWeight: '600' },

  // ── Account ────────────────────────────────────────────────
  userCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  avatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#0A2E1A',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
  userEmail: { fontSize: 13, color: '#64748B' },
  roleBadge: {
    alignSelf: 'flex-start', marginTop: 4,
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, backgroundColor: '#F1F5F9',
  },
  roleBadgeAdmin: { backgroundColor: '#F0FDF4' },
  roleBadgeText: { fontSize: 11, fontWeight: 'bold', color: '#64748B' },
  roleBadgeTextAdmin: { color: '#16A34A' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#DC2626', paddingVertical: 14, borderRadius: 8, marginTop: 16,
  },
  logoutBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },

  // ── About ──────────────────────────────────────────────────
  aboutRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  aboutLabel: { fontSize: 14, color: '#64748B' },
  aboutValue: { fontSize: 14, color: '#1E293B', fontWeight: '600' },
  linkRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  linkText: { fontSize: 14, color: '#2563EB', fontWeight: '500' },

  // ── Loading overlay ────────────────────────────────────────
  busyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.6)', justifyContent: 'center', alignItems: 'center',
  },
});
