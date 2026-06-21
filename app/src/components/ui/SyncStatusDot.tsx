import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SyncStatus } from '../../utils';

export function SyncStatusDot({ status }: { status: SyncStatus }) {
  let color = '#94A3B8'; // default gray
  
  if (status === 'synced') {
    color = '#16A34A'; // green
  } else if (status === 'conflict') {
    color = '#F59E0B'; // orange
  }

  return (
    <View style={[styles.dot, { backgroundColor: color }]} />
  );
}

const styles = StyleSheet.create({
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
