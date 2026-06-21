import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getLaborByUuid, createLabor, updateLabor } from '../../../db/repositories/laborRepository';
import { Labor } from '../../../utils';

export default function LaborFormScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [form, setForm] = useState<Partial<Labor>>({
    name: '', ratePerPiece: 0
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (id && typeof id === 'string') {
      getLaborByUuid(id).then(l => {
        if (l) setForm(l);
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
        await updateLabor(id, form);
      } else {
        await createLabor(form);
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
        <Text style={styles.label}>Labor Name *</Text>
        <TextInput 
          style={styles.input} 
          value={form.name} 
          onChangeText={t => setForm({...form, name: t})} 
          placeholder="e.g. John Doe"
        />

        <Text style={styles.label}>Rate Per Piece (₹)</Text>
        <TextInput 
          style={styles.input} 
          value={form.ratePerPiece?.toString()} 
          onChangeText={t => setForm({...form, ratePerPiece: parseFloat(t) || 0})} 
          keyboardType="numeric"
        />

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isSaving}>
          <Text style={styles.saveBtnText}>{isSaving ? 'Saving...' : 'Save Labor'}</Text>
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
  saveBtn: { backgroundColor: '#0A2E1A', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});
