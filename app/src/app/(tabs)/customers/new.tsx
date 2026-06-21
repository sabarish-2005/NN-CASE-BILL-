import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getCustomerByUuid, createCustomer, updateCustomer } from '../../../db/repositories/customerRepository';
import { Customer } from '../../../utils';

export default function CustomerFormScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [form, setForm] = useState<Partial<Customer>>({
    name: '', phone: '', gstin: '', addr: '', city: '', state: 'Tamil Nadu', pincode: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (id && typeof id === 'string') {
      getCustomerByUuid(id).then(c => {
        if (c) setForm(c);
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
        await updateCustomer(id, form);
      } else {
        await createCustomer(form);
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
        <Text style={styles.label}>Company / Customer Name *</Text>
        <TextInput 
          style={styles.input} 
          value={form.name} 
          onChangeText={t => setForm({...form, name: t})} 
          placeholder="Enter name"
        />

        <Text style={styles.label}>Phone Number</Text>
        <TextInput 
          style={styles.input} 
          value={form.phone} 
          onChangeText={t => setForm({...form, phone: t})} 
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>GSTIN</Text>
        <TextInput 
          style={styles.input} 
          value={form.gstin} 
          onChangeText={t => setForm({...form, gstin: t})} 
          autoCapitalize="characters"
        />

        <Text style={styles.label}>Address</Text>
        <TextInput 
          style={[styles.input, { height: 80 }]} 
          value={form.addr} 
          onChangeText={t => setForm({...form, addr: t})} 
          multiline
        />

        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.label}>City</Text>
            <TextInput 
              style={styles.input} 
              value={form.city} 
              onChangeText={t => setForm({...form, city: t})} 
            />
          </View>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.label}>Pincode</Text>
            <TextInput 
              style={styles.input} 
              value={form.pincode} 
              onChangeText={t => setForm({...form, pincode: t})} 
              keyboardType="number-pad"
            />
          </View>
        </View>
        
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isSaving}>
          <Text style={styles.saveBtnText}>{isSaving ? 'Saving...' : 'Save Customer'}</Text>
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
  saveBtn: { backgroundColor: '#0A2E1A', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});
