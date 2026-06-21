import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Search } from 'lucide-react-native';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

export function SearchBar({ value, onChangeText, placeholder = 'Search...', debounceMs = 300 }: Props) {
  const [innerValue, setInnerValue] = useState(value);

  useEffect(() => {
    setInnerValue(value);
  }, [value]);

  useEffect(() => {
    const handler = setTimeout(() => {
      onChangeText(innerValue);
    }, debounceMs);
    return () => clearTimeout(handler);
  }, [innerValue]);

  return (
    <View style={styles.container}>
      <Search size={20} color="#94A3B8" style={styles.icon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={innerValue}
        onChangeText={setInnerValue}
        placeholderTextColor="#94A3B8"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginVertical: 8,
    height: 40,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
  },
});
