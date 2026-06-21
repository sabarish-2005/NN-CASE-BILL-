import { create } from 'zustand';
import { Bill, BillItem, BillType, PaymentMode } from '../utils';

interface BillFormState {
  currentBill: Partial<Bill> | null;
  items: Partial<BillItem>[];
  
  initNewBill: (type: BillType) => void;
  loadBill: (bill: Bill) => void;
  updateField: (field: keyof Bill, value: any) => void;
  
  addItem: (item: Partial<BillItem>) => void;
  updateItem: (uuid: string, field: keyof BillItem, value: any) => void;
  removeItem: (uuid: string) => void;
  
  reset: () => void;
}

export const useBillStore = create<BillFormState>((set, get) => ({
  currentBill: null,
  items: [],

  initNewBill: (type: BillType) => {
    set({
      currentBill: {
        type,
        date: new Date().toISOString().split('T')[0],
        transport: 'By Hand',
        paymentMode: 'Cash' as PaymentMode,
        gstRate: type === 'gst' ? 18 : 0,
      },
      items: [],
    });
  },

  loadBill: (bill: Bill) => {
    set({
      currentBill: { ...bill },
      items: [...bill.items],
    });
  },

  updateField: (field, value) => {
    set((state) => ({
      currentBill: state.currentBill ? { ...state.currentBill, [field]: value } : null,
    }));
  },

  addItem: (item) => {
    set((state) => ({
      items: [...state.items, { ...item, uuid: item.uuid || Date.now().toString() }],
    }));
  },

  updateItem: (uuid, field, value) => {
    set((state) => ({
      items: state.items.map((it) => 
        it.uuid === uuid ? { ...it, [field]: value } : it
      ),
    }));
  },

  removeItem: (uuid) => {
    set((state) => ({
      items: state.items.filter((it) => it.uuid !== uuid),
    }));
  },

  reset: () => {
    set({ currentBill: null, items: [] });
  },
}));
