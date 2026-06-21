const Customer = require('../models/Customer');
const Bill = require('../models/Bill');

exports.getCustomers = async (req, res) => {
  const { search, page=1, limit=50 } = req.query;
  const query = { createdBy: req.user.id };
  if (search) query.$text = { $search: search };
  const total = await Customer.countDocuments(query);
  const customers = await Customer.find(query)
    .sort({ name: 1 })
    .skip((page-1)*limit)
    .limit(Number(limit));
  res.json({ success: true, total, customers });
};

exports.getCustomer = async (req, res) => {
  const customer = await Customer.findOne({ _id: req.params.id, createdBy: req.user.id });
  if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
  const bills = await Bill.find({ customerId: req.params.id }).sort('-date').limit(10).select('billNo type date total status');
  const stats = await Bill.aggregate([
    { $match: { customerId: require('mongoose').Types.ObjectId.createFromHexString(req.params.id) } },
    { $group: { _id: null, totalBills: { $sum: 1 }, totalRevenue: { $sum: '$total' }, avgBill: { $avg: '$total' } } },
  ]);
  res.json({ success: true, customer, bills, stats: stats[0] || {} });
};

exports.createCustomer = async (req, res) => {
  const customer = await Customer.create({ ...req.body, createdBy: req.user.id });
  res.status(201).json({ success: true, customer });
};

exports.updateCustomer = async (req, res) => {
  const customer = await Customer.findOneAndUpdate(
    { _id: req.params.id, createdBy: req.user.id },
    req.body, { new: true, runValidators: true }
  );
  if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
  res.json({ success: true, customer });
};

exports.deleteCustomer = async (req, res) => {
  const billCount = await Bill.countDocuments({ customerId: req.params.id });
  if (billCount > 0) return res.status(400).json({ success: false, message: `Cannot delete: ${billCount} bills exist for this customer` });
  await Customer.findOneAndDelete({ _id: req.params.id, createdBy: req.user.id });
  res.json({ success: true, message: 'Customer deleted' });
};
