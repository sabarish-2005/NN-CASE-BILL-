import { create } from 'zustand';
import { UserProfile } from '../utils';
import { authService, api } from '../auth/authService';
import NetInfo from '@react-native-community/netinfo';

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuth: boolean;
  isLoading: boolean;
  isOffline: boolean;
  error: string | null;
  
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateSettings: (settings: any) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => {
  // Setup network listener
  NetInfo.addEventListener(state => {
    set({ isOffline: !state.isConnected || !state.isInternetReachable });
  });

  return {
    user: null,
    token: null,
    isAuth: false,
    isLoading: true,
    isOffline: false,
    error: null,

    initialize: async () => {
      try {
        set({ isLoading: true });
        const netState = await NetInfo.fetch();
        const isOffline = !netState.isConnected;
        set({ isOffline });

        const session = await authService.offlineLogin();
        if (session) {
          set({ user: session.user, token: session.token, isAuth: true, error: null });
        }
      } catch (err: any) {
        set({ error: err.message });
      } finally {
        set({ isLoading: false });
      }
    },

    login: async (email, password) => {
      try {
        set({ isLoading: true, error: null });
        const { isOffline } = get();
        
        if (isOffline) {
          throw new Error('You must be online to log in for the first time.');
        }

        const session = await authService.login(email, password);
        set({ user: session.user, token: session.token, isAuth: true });
      } catch (err: any) {
        set({ error: err.message });
        throw err;
      } finally {
        set({ isLoading: false });
      }
    },

    logout: async () => {
      await authService.logout();
      set({ user: null, token: null, isAuth: false });
    },

    updateSettings: async (settings) => {
      const { isOffline } = get();
      if (isOffline) {
        // In offline mode, we might just update SQLite locally
        throw new Error('Settings update requires internet connection currently.');
      }
      const user = await authService.updateSettings(settings);
      set({ user });
    }
  };
});
