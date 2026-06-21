import React from 'react';
import { Modal, View, ActivityIndicator, StyleSheet } from 'react-native';

export function LoadingOverlay({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.overlay}>
        <ActivityIndicator size="large" color="#0A2E1A" />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
