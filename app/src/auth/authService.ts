import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { getDb } from '../db/database';
import { UserProfile, nowISO, getDeviceId } from '../utils';
import axios from 'axios';

const AUTH_KEY = 'nn_auth_token';
// Using the local backend for development. In production, this would be your API URL.
const API_URL = 'http://10.0.2.2:5000/api'; 

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

export const authService = {
  async login(email: string, password: string):Promise<{ user: UserProfile, token: string }> {
    // 1. Authenticate with server
    const { data } = await api.post('/auth/login', { email, password });
    const token = data.token;
    const user = data.user as UserProfile;

    // 2. Securely store token
    if (Platform.OS === 'web' && (window as any).electronAPI) {
      await (window as any).electronAPI.storeSet(AUTH_KEY, token);
    } else {
      await SecureStore.setItemAsync(AUTH_KEY, token);
    }
    
    // Set axios header
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // 3. Cache user profile in SQLite
    const db = await getDb();
    const existing = await db.getFirstAsync<{ uuid: string }>('SELECT uuid FROM users WHERE email = ?', [email]);
    
    const now = nowISO();
    if (existing) {
      await db.runAsync(
        `UPDATE users SET server_id = ?, name = ?, role = ?, settings_json = ?, updated_at = ? WHERE email = ?`,
        [user.serverId || user.uuid, user.name, user.role, JSON.stringify(user.settings || {}), now, email]
      );
    } else {
      await db.runAsync(
        `INSERT INTO users (uuid, server_id, name, email, role, settings_json, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [user.uuid, user.serverId || user.uuid, user.name, email, user.role, JSON.stringify(user.settings || {}), now, now]
      );
    }

    return { user, token };
  },

  async offlineLogin(): Promise<{ user: UserProfile, token: string } | null> {
    let token;
    if (Platform.OS === 'web' && (window as any).electronAPI) {
      token = await (window as any).electronAPI.storeGet(AUTH_KEY);
    } else {
      token = await SecureStore.getItemAsync(AUTH_KEY);
    }
    if (!token) return null;

    // Set axios header
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    const db = await getDb();
    const row = await db.getFirstAsync<any>('SELECT * FROM users ORDER BY updated_at DESC LIMIT 1');
    
    if (!row) return null;

    const user: UserProfile = {
      uuid: row.uuid,
      serverId: row.server_id,
      name: row.name,
      email: row.email,
      role: row.role,
      settings: JSON.parse(row.settings_json || '{}'),
    };

    return { user, token };
  },

  async logout(): Promise<void> {
    if (Platform.OS === 'web' && (window as any).electronAPI) {
      await (window as any).electronAPI.storeDelete(AUTH_KEY);
    } else {
      await SecureStore.deleteItemAsync(AUTH_KEY);
    }
    delete api.defaults.headers.common['Authorization'];
    // We keep the cached user profile in SQLite so they can log back in offline if needed
  },

  async updateSettings(settings: any): Promise<UserProfile> {
    const { data } = await api.put('/auth/settings', settings);
    
    // Update local cache
    const user = data.user as UserProfile;
    const db = await getDb();
    await db.runAsync(
      'UPDATE users SET settings_json = ?, updated_at = ? WHERE email = ?',
      [JSON.stringify(user.settings || {}), nowISO(), user.email]
    );

    return user;
  }
};

api.interceptors.response.use(
  res => res,
  err => {
    const msg = err.response?.data?.message || err.message || 'Something went wrong';
    if (err.response?.status === 401) {
      authService.logout();
      // Handle redirect via store/router
    }
    return Promise.reject(new Error(msg));
  }
);
