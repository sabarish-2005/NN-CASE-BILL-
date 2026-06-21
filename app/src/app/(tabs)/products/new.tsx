import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getProductByUuid, createProduct, updateProduct } from '../../../db/repositories/productRepository';
import { Product } from '../../../utils';

export default function ProductFormScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [form, setForm] = useState<Partial<Product>>({
    name: '', hsn: '3923', unit: 'Nos', rate: 0, gstRate: 0, category: 'General', description: '', isActive: true
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (id && typeof id === 'string') {
      getProductByUuid(id).then(p => {
        if (p) setForm(p);
      });
    }
  }, [id]);

  const handleSave = async () => {
    if (!form.name) {
      Alert.alert('Validation Error', 'Name is required');
      return;
    }

    setIsSaving(true);
    try {
      if (id && typeof id === 'string') {
        await updateProduct(id, form);
      } else {
        await createProduct(form);
      }
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>Product Name *</Text>
        <TextInput 
          style={styles.input} 
          value={form.name} 
          onChangeText={t => setForm({...form, name: t})} 
          placeholder="e.g. Grow Bag 24x24"
        />

        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.label}>HSN Code</Text>
            <TextInput 
              style={styles.input} 
              value={form.hsn} 
              onChangeText={t => setForm({...form, hsn: t})} 
            />
          </View>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.label}>Unit</Text>
            <TextInput 
              style={styles.input} 
              value={form.unit} 
              onChangeText={t => setForm({...form, unit: t})} 
              placeholder="Nos, Kgs, etc."
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.label}>Rate (₹)</Text>
            <TextInput 
              style={styles.input} 
              value={form.rate?.toString()} 
              onChangeText={t => setForm({...form, rate: parseFloat(t) || 0})} 
              keyboardType="numeric"
            />
          </View>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.label}>GST Rate (%)</Text>
            <TextInput 
              style={styles.input} 
              value={form.gstRate?.toString()} 
              onChangeText={t => setForm({...form, gstRate: parseFloat(t) || 0})} 
              keyboardType="numeric"
            />
          </View>
        </View>

        <Text style={styles.label}>Category</Text>
        <TextInput 
          style={styles.input} 
          value={form.category} 
          onChangeText={t => setForm({...form, category: t})} 
          placeholder="Grow Bag, General, etc."
        />

        <View style={styles.switchRow}>
          <Text style={styles.label}>Active Status</Text>
          <Switch
            value={form.isActive}
            onValueChange={v => setForm({...form, isActive: v})}
            trackColor={{ false: '#94A3B8', true: '#BBF7D0' }}
            thumbColor={form.isActive ? '#0A2E1A' : '#f4f3f4'}
          />
        </View>
        
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isSaving}>
          <Text style={styles.saveBtnText}>{isSaving ? 'Saving...' : 'Save Product'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  form: { padding: 16, backgroundColor: '#FFF', margin: 16, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  label: { fontSize: 14, fontWeight: 'bold', color: '#1E293B', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 12, marginBottom: 16, backgroundColor: '#FAFAFA', color: '#1E293B' },
  row: { flexDirection: 'row' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 8 },
  saveBtn: { backgroundColor: '#0A2E1A', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});
