const Bill = require('../models/Bill');
const Customer = require('../models/Customer');
const generateBillNo = require('../utils/billNumber');
const numberToWords = require('../utils/numberToWords');

// Calc totals from items
function calcTotals(items, billType, globalGstRate = 0) {
  let subtotal = 0;
  const processedItems = items.map(it => {
    const taxable = parseFloat((it.qty * it.rate).toFixed(2));
    const gr = billType === 'gst' ? (it.gstRate || globalGstRate || 0) : 0;
    const cgst = gr ? parseFloat((taxable * gr / 200).toFixed(2)) : 0;
    const sgst = cgst;
    const amt = parseFloat((taxable + cgst + sgst).toFixed(2));
    subtotal += taxable;
    return { ...it, taxable, cgst, sgst, igst: 0, amt };
  });
  const cgstTotal = processedItems.reduce((s, i) => s + i.cgst, 0);
  const sgstTotal = processedItems.reduce((s, i) => s + i.sgst, 0);
  const gstTotal  = parseFloat((cgstTotal + sgstTotal).toFixed(2));
  const rawTotal  = parseFloat((subtotal + gstTotal).toFixed(2));
  const roundOff  = parseFloat((Math.round(rawTotal) - rawTotal).toFixed(2));
  const total     = parseFloat((rawTotal + roundOff).toFixed(2));
  return { items: processedItems, subtotal, taxable: subtotal, cgstTotal, sgstTotal, gstTotal, roundOff, total, words: numberToWords(total) };
}

// GET /api/bills
exports.getBills = async (req, res) => {
  const { page=1, limit=20, type, status, search, from, to, sort='-date' } = req.query;
  const query = { createdBy: req.user.id };
  if (type && type !== 'all') query.type = type;
  if (status) query.status = status;
  if (search) query.$or = [{ billNo: new RegExp(search,'i') }, { custName: new RegExp(search,'i') }];
  if (from || to) {
    query.date = {};
    if (from) query.date.$gte = new Date(from);
    if (to)   query.date.$lte = new Date(to + 'T23:59:59');
  }
  const total = await Bill.countDocuments(query);
  const bills = await Bill.find(query)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .select('billNo type status date custName custPhone total subtotal gstTotal items createdAt');
  res.json({ success: true, count: bills.length, total, page: Number(page), pages: Math.ceil(total/limit), bills });
};

// GET /api/bills/:id
exports.getBill = async (req, res) => {
  const bill = await Bill.findOne({ _id: req.params.id, createdBy: req.user.id })
    .populate('customerId', 'name phone addr gstin')
    .populate('items.productId', 'name hsn');
  if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });
  res.json({ success: true, bill });
};

// POST /api/bills
exports.createBill = async (req, res) => {
  const data = { ...req.body, createdBy: req.user.id };
  data.billNo = data.billNo || await generateBillNo(data.type);
  const totals = calcTotals(data.items || [], data.type, data.gstRate);
  Object.assign(data, totals);
  const bill = await Bill.create(data);
  // Auto-save customer if new
  if (data.custName && !data.customerId) {
    const exists = await Customer.findOne({ name: data.custName, createdBy: req.user.id });
    if (!exists) {
      await Customer.create({ name: data.custName, phone: data.custPhone, addr: data.custAddr, gstin: data.custGST, createdBy: req.user.id });
    }
  }
  res.status(201).json({ success: true, bill });
};

// PUT /api/bills/:id
exports.updateBill = async (req, res) => {
  let bill = await Bill.findOne({ _id: req.params.id, createdBy: req.user.id });
  if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });
  const totals = calcTotals(req.body.items || bill.items, req.body.type || bill.type, req.body.gstRate);
  Object.assign(req.body, totals, { updatedBy: req.user.id });
  bill = await Bill.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.json({ success: true, bill });
};

// DELETE /api/bills/:id
exports.deleteBill = async (req, res) => {
  const bill = await Bill.findOneAndDelete({ _id: req.params.id, createdBy: req.user.id });
  if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });
  res.json({ success: true, message: 'Bill deleted' });
};

// POST /api/bills/:id/duplicate
exports.duplicateBill = async (req, res) => {
  const orig = await Bill.findOne({ _id: req.params.id, createdBy: req.user.id });
  if (!orig) return res.status(404).json({ success: false, message: 'Bill not found' });
  const newBillNo = await generateBillNo(orig.type);
  const { _id, billNo, createdAt, updatedAt, __v, ...data } = orig.toObject();
  const bill = await Bill.create({ ...data, billNo: newBillNo, createdBy: req.user.id, date: new Date(), status: 'draft' });
  res.status(201).json({ success: true, bill });
};

// GET /api/bills/stats/summary
exports.getStats = async (req, res) => {
  const userId = req.user.id;
  const now = new Date();
  const ym = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,'0')}`;
  const monthStart = new Date(ym + '-01');
  const monthEnd   = new Date(now.getFullYear(), now.getMonth()+1, 0, 23, 59, 59);

  const [totalAgg, monthAgg, countByType, recent] = await Promise.all([
    Bill.aggregate([{ $match: { createdBy: require('mongoose').Types.ObjectId.createFromHexString(userId), status: { $ne: 'cancelled' } } }, { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }]),
    Bill.aggregate([{ $match: { createdBy: require('mongoose').Types.ObjectId.createFromHexString(userId), date: { $gte: monthStart, $lte: monthEnd }, status: { $ne: 'cancelled' } } }, { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }]),
    Bill.aggregate([{ $match: { createdBy: require('mongoose').Types.ObjectId.createFromHexString(userId) } }, { $group: { _id: '$type', count: { $sum: 1 }, revenue: { $sum: '$total' } } }]),
    Bill.find({ createdBy: userId }).sort('-createdAt').limit(6).select('billNo type date custName total status'),
  ]);

  // Monthly trend last 6 months
  const monthlyTrend = await Promise.all(
    Array(6).fill(0).map(async (_, i) => {
      const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - (5 - i));
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end   = new Date(d.getFullYear(), d.getMonth()+1, 0, 23, 59, 59);
      const agg = await Bill.aggregate([
        { $match: { createdBy: require('mongoose').Types.ObjectId.createFromHexString(userId), date: { $gte: start, $lte: end }, status: { $ne:'cancelled' } } },
        { $group: { _id: null, revenue: { $sum: '$total' }, count: { $sum: 1 } } },
      ]);
      return { month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()], year: d.getFullYear(), revenue: agg[0]?.revenue || 0, count: agg[0]?.count || 0 };
    })
  );

  res.json({
    success: true,
    stats: {
      totalRevenue: totalAgg[0]?.total || 0,
      totalBills:   totalAgg[0]?.count || 0,
      monthRevenue: monthAgg[0]?.total || 0,
      monthBills:   monthAgg[0]?.count || 0,
      byType: countByType,
      monthlyTrend,
      recent,
    },
  });
};

// GET /api/bills/next-number/:type
exports.getNextNumber = async (req, res) => {
  const billNo = await generateBillNo(req.params.type);
  res.json({ success: true, billNo });
};
