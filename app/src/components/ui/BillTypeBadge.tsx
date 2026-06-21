import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BILL_TYPE_CONFIG, BillType } from '../../utils';

export function BillTypeBadge({ type }: { type: BillType }) {
  const config = BILL_TYPE_CONFIG[type];
  if (!config) return null;

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.dark }]}>{config.short}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});
