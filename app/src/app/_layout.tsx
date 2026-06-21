import { Slot } from 'expo-router';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { settingsRepository } from '../db/repositories/settingsRepository';
import { syncService } from '../services/syncService';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { View, Text, ActivityIndicator } from 'react-native';

export default function RootLayout() {
  const initializeAuth = useAuthStore(state => state.initialize);
  const isLoading = useAuthStore(state => state.isLoading);
  const isOffline = useAuthStore(state => state.isOffline);
  const loadSettings = useSettingsStore(state => state.loadSettings);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    async function init() {
      const dbSettings = await settingsRepository.getAllSettings();
      // Map flat string key-value pairs back to settings object
      const parsed: any = {};
      for (const [k, v] of Object.entries(dbSettings)) {
        if (v === 'true') parsed[k] = true;
        else if (v === 'false') parsed[k] = false;
        else parsed[k] = v;
      }
      loadSettings(parsed);
      setSettingsLoaded(true);
      await initializeAuth();
      syncService.startSyncListener();
    }
    init();
  }, []);

  if (isLoading || !settingsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
        <ActivityIndicator size="large" color="#0A2E1A" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      {isOffline && (
        <View style={{ backgroundColor: '#dc2626', padding: 8, alignItems: 'center' }}>
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Offline Mode - Changes will sync when online</Text>
        </View>
      )}
      <Slot />
    </ErrorBoundary>
  );
}
