// ── NN Billing — Shared Utilities ────────────────────────────
// Ported from frontend/src/utils/index.js with TypeScript types
// All pure logic — no React Native or platform-specific imports

import { v4 as uuidv4 } from 'uuid';

// ── Types ────────────────────────────────────────────────────
export interface BillItem {
  uuid: string;
  productUuid?: string;
  description: string;
  hsn: string;
  qty: number;
  unit: string;
  rate: number;
  gstRate: number;
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  amount: number;
  sortOrder: number;
}

export interface BillTotals {
  items: BillItem[];
  subtotal: number;
  cgstTotal: number;
  sgstTotal: number;
  gstTotal: number;
  roundOff: number;
  total: number;
  words: string;
}

export type BillType = 'dc' | 'cb' | 'cr' | 'gst' | 'jw';
export type BillStatus = 'draft' | 'final' | 'cancelled' | 'paid';
export type SyncStatus = 'pending' | 'synced' | 'conflict';
export type UserRole = 'admin' | 'staff';
export type PaymentMode = 'Cash' | 'Credit' | 'UPI' | 'Cheque' | 'NEFT' | 'RTGS' | '';

export interface Customer {
  uuid: string;
  serverId?: string;
  name: string;
  phone: string;
  email: string;
  gstin: string;
  addr: string;
  city: string;
  state: string;
  pincode: string;
  stateCode: string;
  isActive: boolean;
  notes: string;
  createdBy?: string;
  syncStatus: SyncStatus;
  deviceId?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Product {
  uuid: string;
  serverId?: string;
  name: string;
  hsn: string;
  unit: string;
  rate: number;
  gstRate: number;
  category: string;
  description: string;
  isActive: boolean;
  stock: number;
  createdBy?: string;
  syncStatus: SyncStatus;
  deviceId?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Bill {
  uuid: string;
  serverId?: string;
  billNo: string;
  isDraft: boolean;
  type: BillType;
  status: BillStatus;
  date: string;
  dueDate?: string;
  customerUuid?: string;
  custName: string;
  custAddr: string;
  custPhone: string;
  custGst: string;
  custState: string;
  transport: string;
  vehicleNo: string;
  items: BillItem[];
  subtotal: number;
  discount: number;
  taxable: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  gstTotal: number;
  roundOff: number;
  total: number;
  words: string;
  gstRate: number;
  isIgst: boolean;
  paymentMode: PaymentMode;
  paidAmount: number;
  balance: number;
  notes: string;
  terms: string;
  createdBy?: string;
  syncStatus: SyncStatus;
  deviceId?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Labor {
  uuid: string;
  serverId?: string;
  name: string;
  coverName: string;
  coverPrice: number;
  ratePerPiece: number;
  totalPieces: number;
  totalEarnings: number;
  createdBy?: string;
  syncStatus: SyncStatus;
  deviceId?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface WorkRecord {
  uuid: string;
  laborUuid: string;
  date: string;
  day: string;
  piecesCompleted: number;
  earningForDay: number;
  notes: string;
  syncStatus: SyncStatus;
  deviceId?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface SyncQueueItem {
  id?: number;
  entityType: string;
  entityUuid: string;
  operation: 'create' | 'update' | 'delete';
  payloadJson: string;
  createdAt: string;
  syncedAt?: string;
  retryCount: number;
  errorMessage?: string;
}

export interface UserProfile {
  uuid: string;
  serverId?: string;
  name: string;
  email: string;
  role: UserRole;
  settings: UserSettings;
}

export interface UserSettings {
  // Company Information
  companyName: string;
  companyAddr: string;
  companyPhone: string;
  companyEmail: string;
  gstin: string;
  companyState: string;
  companyPincode: string;

  // Bank Details
  bankName: string;
  bankAcctHolder: string;
  bankAcct: string;
  bankIfsc: string;
  bankBranch: string;
  upiId: string;

  // Logo & Signature URIs (local file paths)
  logoUri: string;
  signatureUri: string;

  // Invoice Preferences
  defaultBillType: BillType;
  billPrefix: string;
  nextBillNumber: number;
  defaultGstRate: number;
  defaultPaymentTerms: string;
  defaultNotes: string;

  // Appearance
  darkMode: boolean;
  themeColor: string;
  fontSize: 'small' | 'medium' | 'large';

  // Sync
  lastSyncAt: string;
}

// ── Number to Words (Indian) ─────────────────────────────────
const ONES = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten',
  'Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
const TENS = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];

function _tw(n: number): string {
  if (!n) return '';
  if (n < 20) return ONES[n] + ' ';
  let r = '';
  if (n >= 10000000) { r += _tw(Math.floor(n / 10000000)) + 'Crore ';   n %= 10000000; }
  if (n >= 100000)   { r += _tw(Math.floor(n / 100000))   + 'Lakh ';    n %= 100000; }
  if (n >= 1000)     { r += _tw(Math.floor(n / 1000))     + 'Thousand '; n %= 1000; }
  if (n >= 100)      { r += ONES[Math.floor(n / 100)]     + ' Hundred '; n %= 100; }
  if (n >= 20)       { r += TENS[Math.floor(n / 10)]      + ' ';         n %= 10; }
  if (n > 0)           r += ONES[n] + ' ';
  return r;
}

export function numberToWords(num: number): string {
  const n = Math.abs(parseFloat(String(num)) || 0);
  const ip = Math.floor(n);
  const dp = Math.round((n - ip) * 100);
  let w = ip === 0 ? 'Zero' : _tw(ip).trim();
  if (dp > 0) w += ' and ' + _tw(dp).trim() + ' Paise';
  return 'Rupees ' + w + ' Only';
}

// ── Formatting ───────────────────────────────────────────────
export const fmtCurrency = (n: number, decimals = 2): string =>
  parseFloat(String(n || 0)).toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

export const fmtCurrencyShort = (n: number): string =>
  parseFloat(String(n || 0)).toLocaleString('en-IN', { maximumFractionDigits: 0 });

export const fmtDate = (d: string | Date): string => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const fmtDateLong = (d: string | Date): string => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const today = (): string => new Date().toISOString().split('T')[0];
export const nowISO = (): string => new Date().toISOString();

export const getFY = (): string => {
  const d = new Date();
  const y = d.getFullYear();
  const m = d.getMonth();
  const s = m >= 3 ? y : y - 1;
  return `${s}-${(s + 1).toString().slice(-2)}`;
};

// ── UUID Generator ───────────────────────────────────────────
export const generateUUID = (): string => uuidv4();

// ── Draft Bill Number Generator ──────────────────────────────
let draftCounter = 0;
export function generateDraftBillNo(type: BillType): string {
  draftCounter++;
  const prefix = BILL_TYPE_CONFIG[type]?.prefix || 'DC';
  return `DRAFT-${prefix}-${draftCounter.toString().padStart(3, '0')}`;
}

export function resetDraftCounter(): void {
  draftCounter = 0;
}

// ── Bill Types ───────────────────────────────────────────────
export const BILL_TYPE_CONFIG: Record<BillType, {
  label: string; short: string; prefix: string; color: string; bg: string; dark: string;
}> = {
  dc:  { label: 'Delivery Challan', short: 'DC',   prefix: 'DC',  color: '#2563eb', bg: '#eff6ff', dark: '#1e3a8a' },
  cb:  { label: 'Cash Bill',        short: 'CB',    prefix: 'CB',  color: '#16a34a', bg: '#f0fdf4', dark: '#14532d' },
  cr:  { label: 'Credit Bill',      short: 'CR',    prefix: 'CR',  color: '#d97706', bg: '#fffbeb', dark: '#78350f' },
  gst: { label: 'GST Invoice',      short: 'GST',   prefix: 'GST', color: '#9333ea', bg: '#f5f3ff', dark: '#4c1d95' },
  jw:  { label: 'Job Work Bill',    short: 'JW',    prefix: 'JW',  color: '#dc2626', bg: '#fff1f2', dark: '#7f1d1d' },
};

export const BILL_TYPES: BillType[] = ['dc', 'cb', 'cr', 'gst', 'jw'];

export const TRANSPORT = ['By Hand', 'By Vehicle', 'By Two Wheeler', 'By Auto', 'By Courier', 'By Lorry', 'By Train'];
export const UNITS = ['Nos', 'Kg', 'Meter', 'Feet', 'Inch', 'Bundle', 'Roll', 'Set', 'Ltr', 'Box', 'Bag', 'Hour', 'Pcs', 'Dozen'];
export const GST_RATES = [0, 5, 12, 18, 28];
export const CATEGORIES = ['Grow Bag', 'Open Top Cover', 'Cutting', 'Labour', 'Other', 'General'];
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const PAYMENT_MODES: PaymentMode[] = ['Cash', 'Credit', 'UPI', 'Cheque', 'NEFT', 'RTGS'];

export const CO = {
  name:  'NACHIMUTHU NATRAYAN',
  sub:   'SABARISH JOB WORKS',
  tag:   'Grow Bag & Open Top Cover Cutting',
  owner: 'SABARISH',
  role:  'Proprietor',
  addr:  '2/206, Bus Stand Near, Selakkarichal, Sulur',
  pin:   '641658',
  city:  'Coimbatore, Tamil Nadu',
  phone: '9043695759',
  stateCode: '33',
  state: 'Tamil Nadu',
};

// ── Brand Colors ─────────────────────────────────────────────
export const COLORS = {
  brand: {
    green:     '#0A2E1A',
    greenLight:'#155230',
    greenSoft: '#1a6b3c',
    gold:      '#C9A227',
    goldLight: '#E5C94B',
    goldSoft:  '#FDF8E8',
    cream:     '#FFF9E5',
  },
  bg: {
    light:   '#F8FAFC',
    dark:    '#0F172A',
    card:    '#FFFFFF',
    cardDark:'#1E293B',
  },
  text: {
    primary:   '#1E293B',
    secondary: '#64748B',
    dark:      '#E2E8F0',
    darkSec:   '#94A3B8',
  },
  border: {
    light: '#E2E8F0',
    dark:  '#334155',
  },
  status: {
    success: '#16a34a',
    warning: '#d97706',
    error:   '#dc2626',
    info:    '#2563eb',
  },
};

// ── Bill Calculations ────────────────────────────────────────
export function calcItem(qty: number, rate: number): number {
  return parseFloat((parseFloat(String(qty || 0)) * parseFloat(String(rate || 0))).toFixed(2));
}

export function calcBillTotals(
  items: Partial<BillItem>[],
  billType: BillType,
  globalGstRate = 0
): BillTotals {
  const processedItems: BillItem[] = (items || []).map((it, idx) => {
    const taxable = calcItem(it.qty || 0, it.rate || 0);
    const gr = billType === 'gst' ? (parseFloat(String(it.gstRate || 0)) || globalGstRate) : 0;
    const cgst = gr ? parseFloat((taxable * gr / 200).toFixed(2)) : 0;
    const sgst = cgst;
    const amt = parseFloat((taxable + cgst + sgst).toFixed(2));
    return {
      uuid: it.uuid || generateUUID(),
      productUuid: it.productUuid,
      description: it.description || '',
      hsn: it.hsn || '3923',
      qty: it.qty || 0,
      unit: it.unit || 'Nos',
      rate: it.rate || 0,
      gstRate: gr,
      taxable,
      cgst,
      sgst,
      igst: 0,
      amount: amt,
      sortOrder: it.sortOrder ?? idx,
    };
  });

  const subtotal  = parseFloat(processedItems.reduce((s, i) => s + i.taxable, 0).toFixed(2));
  const cgstTotal = parseFloat(processedItems.reduce((s, i) => s + i.cgst, 0).toFixed(2));
  const sgstTotal = parseFloat(processedItems.reduce((s, i) => s + i.sgst, 0).toFixed(2));
  const gstTotal  = parseFloat((cgstTotal + sgstTotal).toFixed(2));
  const rawTotal  = parseFloat((subtotal + gstTotal).toFixed(2));
  const roundOff  = parseFloat((Math.round(rawTotal) - rawTotal).toFixed(2));
  const total     = parseFloat((rawTotal + roundOff).toFixed(2));

  return {
    items: processedItems,
    subtotal,
    cgstTotal,
    sgstTotal,
    gstTotal,
    roundOff,
    total,
    words: numberToWords(total),
  };
}

// ── Device ID ────────────────────────────────────────────────
let _deviceId: string | null = null;
export function getDeviceId(): string {
  if (!_deviceId) {
    _deviceId = generateUUID();
  }
  return _deviceId;
}
export function setDeviceId(id: string): void {
  _deviceId = id;
}
