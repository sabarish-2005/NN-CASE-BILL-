import { create } from 'zustand';
import { UserSettings, CO } from '../utils';

interface SettingsState {
  settings: Partial<UserSettings>;
  loadSettings: (settings: Partial<UserSettings>) => void;
  setSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
  updateSetting: (key: keyof UserSettings, value: any) => void;
  resetSettings: () => void;
}

const DEFAULT_SETTINGS: Partial<UserSettings> = {
  companyName: CO.name,
  companyAddr: CO.addr,
  companyPhone: CO.phone,
  companyEmail: '',
  gstin: '',
  companyState: CO.state,
  companyPincode: CO.pin,

  bankName: '',
  bankAcctHolder: '',
  bankAcct: '',
  bankIfsc: '',
  bankBranch: '',
  upiId: '',

  logoUri: '',
  signatureUri: '',

  defaultBillType: 'dc',
  billPrefix: 'NN',
  nextBillNumber: 1,
  defaultGstRate: 0,
  defaultPaymentTerms: 'Payment due within 30 days',
  defaultNotes: 'Thanks for your business!',

  darkMode: false,
  themeColor: 'green',
  fontSize: 'medium',

  lastSyncAt: '',
};

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: { ...DEFAULT_SETTINGS },

  loadSettings: (newSettings) => {
    set((state) => ({ settings: { ...state.settings, ...newSettings } }));
  },

  setSetting: (key, value) => {
    set((state) => ({ settings: { ...state.settings, [key]: value } }));
  },

  updateSetting: (key, value) => {
    set((state) => ({ settings: { ...state.settings, [key]: value } }));
  },

  resetSettings: () => {
    set({ settings: { ...DEFAULT_SETTINGS } });
  },
}));
