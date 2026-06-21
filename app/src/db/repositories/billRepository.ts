// ── Bill Repository ──────────────────────────────────────────
// SQLite CRUD for bills + bill_items with sync queue integration
// Bills are the most complex entity — they have child items and draft numbering

import { getDb } from '../database';
import {
  Bill, BillItem, BillType, BillStatus, SyncStatus,
  generateUUID, getDeviceId, nowISO, generateDraftBillNo,
  calcBillTotals, numberToWords,
} from '../../utils';
import { enqueueSyncOp } from './syncQueueRepository';

// ── Row Mappers ──────────────────────────────────────────────

function rowToBill(row: any): Bill {
  return {
    uuid: row.uuid,
    serverId: row.server_id || undefined,
    billNo: row.bill_no,
    isDraft: row.is_draft === 1,
    type: row.type as BillType,
    status: row.status as BillStatus,
    date: row.date,
    dueDate: row.due_date || undefined,
    customerUuid: row.customer_uuid || undefined,
    custName: row.cust_name || '',
    custAddr: row.cust_addr || '',
    custPhone: row.cust_phone || '',
    custGst: row.cust_gst || '',
    custState: row.cust_state || '33',
    transport: row.transport || 'By Hand',
    vehicleNo: row.vehicle_no || '',
    items: [],
    subtotal: row.subtotal || 0,
    discount: row.discount || 0,
    taxable: row.taxable || 0,
    cgstTotal: row.cgst_total || 0,
    sgstTotal: row.sgst_total || 0,
    igstTotal: row.igst_total || 0,
    gstTotal: row.gst_total || 0,
    roundOff: row.round_off || 0,
    total: row.total || 0,
    words: row.words || 'Rupees Zero Only',
    gstRate: row.gst_rate || 0,
    isIgst: row.is_igst === 1,
    paymentMode: row.payment_mode || '',
    paidAmount: row.paid_amount || 0,
    balance: row.balance || 0,
    notes: row.notes || '',
    terms: row.terms || '',
    createdBy: row.created_by || undefined,
    syncStatus: row.sync_status as SyncStatus,
    deviceId: row.device_id || undefined,
    createdAt: row.created_at || '',
    updatedAt: row.updated_at || '',
    deletedAt: row.deleted_at || undefined,
  };
}

function rowToBillItem(row: any): BillItem {
  return {
    uuid: row.uuid,
    productUuid: row.product_uuid || undefined,
    description: row.description,
    hsn: row.hsn || '3923',
    qty: row.qty || 0,
    unit: row.unit || 'Nos',
    rate: row.rate || 0,
    gstRate: row.gst_rate || 0,
    taxable: row.taxable || 0,
    cgst: row.cgst || 0,
    sgst: row.sgst || 0,
    igst: row.igst || 0,
    amount: row.amount || 0,
    sortOrder: row.sort_order || 0,
  };
}

// ── Load Items for a Bill ────────────────────────────────────

async function loadBillItems(billUuid: string): Promise<BillItem[]> {
  const db = await getDb();
  const rows = await db.getAllAsync(
    'SELECT * FROM bill_items WHERE bill_uuid = ? ORDER BY sort_order ASC',
    [billUuid]
  );
  return rows.map(rowToBillItem);
}

async function loadBillWithItems(row: any): Promise<Bill> {
  const bill = rowToBill(row);
  bill.items = await loadBillItems(bill.uuid);
  return bill;
}

// ── Queries ──────────────────────────────────────────────────

export async function getAllBills(params: {
  type?: BillType | 'all';
  status?: BillStatus;
  search?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<{ bills: Bill[]; total: number }> {
  const db = await getDb();
  const conditions: string[] = ['deleted_at IS NULL'];
  const args: any[] = [];

  if (params.type && params.type !== 'all') {
    conditions.push('type = ?');
    args.push(params.type);
  }
  if (params.status) {
    conditions.push('status = ?');
    args.push(params.status);
  }
  if (params.search) {
    conditions.push('(bill_no LIKE ? OR cust_name LIKE ?)');
    const q = `%${params.search}%`;
    args.push(q, q);
  }
  if (params.from) {
    conditions.push('date >= ?');
    args.push(params.from);
  }
  if (params.to) {
    conditions.push('date <= ?');
    args.push(params.to + 'T23:59:59');
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRow = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM bills ${where}`, args
  );
  const total = countRow?.count || 0;

  const limit = params.limit || 20;
  const offset = params.offset || 0;
  const rows = await db.getAllAsync(
    `SELECT * FROM bills ${where} ORDER BY date DESC, created_at DESC LIMIT ? OFFSET ?`,
    [...args, limit, offset]
  );

  const bills: Bill[] = [];
  for (const row of rows) {
    bills.push(await loadBillWithItems(row));
  }

  return { bills, total };
}

export async function getBillByUuid(uuid: string): Promise<Bill | null> {
  const db = await getDb();
  const row = await db.getFirstAsync('SELECT * FROM bills WHERE uuid = ?', [uuid]);
  if (!row) return null;
  return loadBillWithItems(row);
}

export async function getBillByServerId(serverId: string): Promise<Bill | null> {
  const db = await getDb();
  const row = await db.getFirstAsync('SELECT * FROM bills WHERE server_id = ?', [serverId]);
  if (!row) return null;
  return loadBillWithItems(row);
}

export async function getDraftBills(): Promise<Bill[]> {
  const db = await getDb();
  const rows = await db.getAllAsync(
    'SELECT * FROM bills WHERE is_draft = 1 AND deleted_at IS NULL ORDER BY date DESC'
  );
  const bills: Bill[] = [];
  for (const row of rows) {
    bills.push(await loadBillWithItems(row));
  }
  return bills;
}

// ── Create ───────────────────────────────────────────────────

export async function createBill(data: Partial<Bill> & { items: Partial<BillItem>[] }): Promise<Bill> {
  const db = await getDb();
  const now = nowISO();
  const uuid = data.uuid || generateUUID();
  const deviceId = getDeviceId();
  const billNo = data.billNo || generateDraftBillNo(data.type || 'dc');
  const isDraft = billNo.startsWith('DRAFT') ? 1 : 0;

  // Calculate totals
  const totals = calcBillTotals(data.items || [], data.type || 'dc', data.gstRate || 0);
  const balance = totals.total - (data.paidAmount || 0);

  await db.runAsync(
    `INSERT INTO bills (
      uuid, server_id, bill_no, is_draft, type, status, date, due_date,
      customer_uuid, cust_name, cust_addr, cust_phone, cust_gst, cust_state,
      transport, vehicle_no, subtotal, discount, taxable, cgst_total, sgst_total,
      igst_total, gst_total, round_off, total, words, gst_rate, is_igst,
      payment_mode, paid_amount, balance, notes, terms,
      created_by, sync_status, device_id, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
    [
      uuid, data.serverId || null, billNo, isDraft,
      data.type || 'dc', data.status || 'final', data.date || now.split('T')[0],
      data.dueDate || null, data.customerUuid || null,
      data.custName || '', data.custAddr || '', data.custPhone || '',
      data.custGst || '', data.custState || '33',
      data.transport || 'By Hand', data.vehicleNo || '',
      totals.subtotal, data.discount || 0, totals.subtotal,
      totals.cgstTotal, totals.sgstTotal, 0, totals.gstTotal,
      totals.roundOff, totals.total, totals.words,
      data.gstRate || 0, data.isIgst ? 1 : 0,
      data.paymentMode || '', data.paidAmount || 0, balance,
      data.notes || '', data.terms || '',
      data.createdBy || null, deviceId, now, now,
    ]
  );

  // Insert items
  for (const item of totals.items) {
    await db.runAsync(
      `INSERT INTO bill_items (uuid, bill_uuid, product_uuid, description, hsn, qty, unit, rate, gst_rate, taxable, cgst, sgst, igst, amount, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [item.uuid, uuid, item.productUuid || null, item.description, item.hsn,
       item.qty, item.unit, item.rate, item.gstRate, item.taxable,
       item.cgst, item.sgst, item.igst, item.amount, item.sortOrder]
    );
  }

  const bill = (await getBillByUuid(uuid))!;
  await enqueueSyncOp('bill', uuid, 'create', bill);
  return bill;
}

// ── Update ───────────────────────────────────────────────────

export async function updateBill(uuid: string, data: Partial<Bill> & { items?: Partial<BillItem>[] }): Promise<Bill | null> {
  const db = await getDb();
  const now = nowISO();
  const existing = await getBillByUuid(uuid);
  if (!existing) return null;

  const items = data.items || existing.items;
  const type = data.type || existing.type;
  const totals = calcBillTotals(items, type, data.gstRate ?? existing.gstRate);
  const paidAmount = data.paidAmount ?? existing.paidAmount;
  const balance = totals.total - paidAmount;

  await db.runAsync(
    `UPDATE bills SET
      type = ?, status = ?, date = ?, due_date = ?,
      customer_uuid = ?, cust_name = ?, cust_addr = ?, cust_phone = ?,
      cust_gst = ?, cust_state = ?, transport = ?, vehicle_no = ?,
      subtotal = ?, discount = ?, taxable = ?, cgst_total = ?, sgst_total = ?,
      igst_total = ?, gst_total = ?, round_off = ?, total = ?, words = ?,
      gst_rate = ?, is_igst = ?, payment_mode = ?, paid_amount = ?, balance = ?,
      notes = ?, terms = ?, sync_status = 'pending', updated_at = ?
     WHERE uuid = ?`,
    [
      type, data.status ?? existing.status,
      data.date ?? existing.date, data.dueDate ?? existing.dueDate ?? null,
      data.customerUuid ?? existing.customerUuid ?? null,
      data.custName ?? existing.custName, data.custAddr ?? existing.custAddr,
      data.custPhone ?? existing.custPhone, data.custGst ?? existing.custGst,
      data.custState ?? existing.custState,
      data.transport ?? existing.transport, data.vehicleNo ?? existing.vehicleNo,
      totals.subtotal, data.discount ?? existing.discount, totals.subtotal,
      totals.cgstTotal, totals.sgstTotal, 0, totals.gstTotal,
      totals.roundOff, totals.total, totals.words,
      data.gstRate ?? existing.gstRate, (data.isIgst ?? existing.isIgst) ? 1 : 0,
      data.paymentMode ?? existing.paymentMode, paidAmount, balance,
      data.notes ?? existing.notes, data.terms ?? existing.terms,
      now, uuid,
    ]
  );

  // Replace items if provided
  if (data.items) {
    await db.runAsync('DELETE FROM bill_items WHERE bill_uuid = ?', [uuid]);
    for (const item of totals.items) {
      await db.runAsync(
        `INSERT INTO bill_items (uuid, bill_uuid, product_uuid, description, hsn, qty, unit, rate, gst_rate, taxable, cgst, sgst, igst, amount, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [item.uuid, uuid, item.productUuid || null, item.description, item.hsn,
         item.qty, item.unit, item.rate, item.gstRate, item.taxable,
         item.cgst, item.sgst, item.igst, item.amount, item.sortOrder]
      );
    }
  }

  const updated = (await getBillByUuid(uuid))!;
  await enqueueSyncOp('bill', uuid, 'update', updated);
  return updated;
}

// ── Delete ───────────────────────────────────────────────────

export async function deleteBill(uuid: string): Promise<boolean> {
  const db = await getDb();
  const now = nowISO();
  const result = await db.runAsync(
    `UPDATE bills SET deleted_at = ?, sync_status = 'pending', updated_at = ? WHERE uuid = ?`,
    [now, now, uuid]
  );
  if (result.changes > 0) {
    await enqueueSyncOp('bill', uuid, 'delete', { uuid, deletedAt: now });
  }
  return result.changes > 0;
}

// ── Duplicate ────────────────────────────────────────────────

export async function duplicateBill(uuid: string): Promise<Bill | null> {
  const existing = await getBillByUuid(uuid);
  if (!existing) return null;

  const newBill = await createBill({
    type: existing.type,
    status: 'draft',
    date: nowISO().split('T')[0],
    customerUuid: existing.customerUuid,
    custName: existing.custName,
    custAddr: existing.custAddr,
    custPhone: existing.custPhone,
    custGst: existing.custGst,
    custState: existing.custState,
    transport: existing.transport,
    vehicleNo: existing.vehicleNo,
    gstRate: existing.gstRate,
    isIgst: existing.isIgst,
    paymentMode: existing.paymentMode,
    notes: existing.notes,
    terms: existing.terms,
    items: existing.items.map(it => ({
      ...it,
      uuid: generateUUID(),
    })),
  });
  return newBill;
}

// ── Stats (Dashboard) ────────────────────────────────────────

export async function getBillStats(): Promise<{
  totalRevenue: number;
  totalBills: number;
  monthRevenue: number;
  monthBills: number;
  byType: { type: string; count: number; revenue: number }[];
  monthlyTrend: { month: string; year: number; revenue: number; count: number }[];
  recent: Bill[];
}> {
  const db = await getDb();

  // Total
  const totalRow = await db.getFirstAsync<{ total: number; count: number }>(
    `SELECT COALESCE(SUM(total), 0) as total, COUNT(*) as count
     FROM bills WHERE deleted_at IS NULL AND status != 'cancelled'`
  );

  // This month
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-01`;
  const monthRow = await db.getFirstAsync<{ total: number; count: number }>(
    `SELECT COALESCE(SUM(total), 0) as total, COUNT(*) as count
     FROM bills WHERE deleted_at IS NULL AND status != 'cancelled' AND date >= ?`,
    [monthStart]
  );

  // By type
  const typeRows = await db.getAllAsync(
    `SELECT type, COUNT(*) as count, COALESCE(SUM(total), 0) as revenue
     FROM bills WHERE deleted_at IS NULL GROUP BY type`
  );

  // Monthly trend (last 6 months)
  const monthlyTrend: { month: string; year: number; revenue: number; count: number }[] = [];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    const start = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-01`;
    const endD = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const end = `${endD.getFullYear()}-${(endD.getMonth() + 1).toString().padStart(2, '0')}-${endD.getDate().toString().padStart(2, '0')}T23:59:59`;

    const row = await db.getFirstAsync<{ revenue: number; count: number }>(
      `SELECT COALESCE(SUM(total), 0) as revenue, COUNT(*) as count
       FROM bills WHERE deleted_at IS NULL AND status != 'cancelled' AND date >= ? AND date <= ?`,
      [start, end]
    );
    monthlyTrend.push({
      month: months[d.getMonth()],
      year: d.getFullYear(),
      revenue: row?.revenue || 0,
      count: row?.count || 0,
    });
  }

  // Recent bills
  const recentRows = await db.getAllAsync(
    `SELECT * FROM bills WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 6`
  );
  const recent: Bill[] = [];
  for (const row of recentRows) {
    recent.push(rowToBill(row));
  }

  return {
    totalRevenue: totalRow?.total || 0,
    totalBills: totalRow?.count || 0,
    monthRevenue: monthRow?.total || 0,
    monthBills: monthRow?.count || 0,
    byType: typeRows.map((r: any) => ({ type: r.type, count: r.count, revenue: r.revenue })),
    monthlyTrend,
    recent,
  };
}

// ── Bill Number Reservation ──────────────────────────────────

export async function updateBillNumber(uuid: string, billNo: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE bills SET bill_no = ?, is_draft = 0, sync_status = \'synced\' WHERE uuid = ?',
    [billNo, uuid]
  );
}

// ── Server Upsert ────────────────────────────────────────────

export async function upsertBillFromServer(data: any): Promise<void> {
  const db = await getDb();
  const now = nowISO();
  const existing = data._id
    ? await db.getFirstAsync<any>('SELECT uuid, sync_status FROM bills WHERE server_id = ?', [data._id])
    : null;

  // If bill exists and is finalized, flag as conflict instead of overwriting
  if (existing && existing.sync_status === 'conflict') {
    return; // Don't overwrite conflicts
  }

  const uuid = existing?.uuid || data.uuid || generateUUID();

  if (existing) {
    await db.runAsync(
      `UPDATE bills SET
        bill_no = ?, is_draft = 0, type = ?, status = ?, date = ?, due_date = ?,
        cust_name = ?, cust_addr = ?, cust_phone = ?, cust_gst = ?, cust_state = ?,
        transport = ?, vehicle_no = ?, subtotal = ?, discount = ?, taxable = ?,
        cgst_total = ?, sgst_total = ?, igst_total = ?, gst_total = ?, round_off = ?,
        total = ?, words = ?, gst_rate = ?, is_igst = ?, payment_mode = ?,
        paid_amount = ?, balance = ?, notes = ?, terms = ?,
        server_id = ?, sync_status = 'synced', updated_at = ?
       WHERE uuid = ?`,
      [
        data.billNo, data.type, data.status || 'final', data.date, data.dueDate || null,
        data.custName || '', data.custAddr || '', data.custPhone || '',
        data.custGST || '', data.custState || '33',
        data.transport || 'By Hand', data.vehicleNo || '',
        data.subtotal || 0, data.discount || 0, data.taxable || 0,
        data.cgstTotal || 0, data.sgstTotal || 0, data.igstTotal || 0,
        data.gstTotal || 0, data.roundOff || 0, data.total || 0,
        data.words || '', data.gstRate || 0, data.isIGST ? 1 : 0,
        data.paymentMode || '', data.paidAmount || 0, data.balance || 0,
        data.notes || '', data.terms || '',
        data._id, data.updatedAt || now, uuid,
      ]
    );
  } else {
    await db.runAsync(
      `INSERT OR IGNORE INTO bills (
        uuid, server_id, bill_no, is_draft, type, status, date, due_date,
        cust_name, cust_addr, cust_phone, cust_gst, cust_state,
        transport, vehicle_no, subtotal, discount, taxable,
        cgst_total, sgst_total, igst_total, gst_total, round_off,
        total, words, gst_rate, is_igst, payment_mode,
        paid_amount, balance, notes, terms,
        created_by, sync_status, device_id, created_at, updated_at
      ) VALUES (?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', 'server', ?, ?)`,
      [
        uuid, data._id, data.billNo, data.type, data.status || 'final',
        data.date, data.dueDate || null,
        data.custName || '', data.custAddr || '', data.custPhone || '',
        data.custGST || '', data.custState || '33',
        data.transport || 'By Hand', data.vehicleNo || '',
        data.subtotal || 0, data.discount || 0, data.taxable || 0,
        data.cgstTotal || 0, data.sgstTotal || 0, data.igstTotal || 0,
        data.gstTotal || 0, data.roundOff || 0, data.total || 0,
        data.words || '', data.gstRate || 0, data.isIGST ? 1 : 0,
        data.paymentMode || '', data.paidAmount || 0, data.balance || 0,
        data.notes || '', data.terms || '', data.createdBy || null,
        data.createdAt || now, data.updatedAt || now,
      ]
    );
  }

  // Upsert bill items
  if (data.items?.length) {
    await db.runAsync('DELETE FROM bill_items WHERE bill_uuid = ?', [uuid]);
    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      await db.runAsync(
        `INSERT INTO bill_items (uuid, bill_uuid, product_uuid, description, hsn, qty, unit, rate, gst_rate, taxable, cgst, sgst, igst, amount, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          generateUUID(), uuid, item.productId || null, item.desc || item.description || '',
          item.hsn || '3923', item.qty || 0, item.unit || 'Nos', item.rate || 0,
          item.gstRate || 0, item.taxable || 0, item.cgst || 0,
          item.sgst || 0, item.igst || 0, item.amt || item.amount || 0, i,
        ]
      );
    }
  }
}
