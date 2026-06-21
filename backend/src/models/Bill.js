const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  desc:    { type: String, required: true },
  hsn:     { type: String, default: '3923' },
  qty:     { type: Number, required: true, min: 0 },
  unit:    { type: String, default: 'Nos' },
  rate:    { type: Number, required: true, min: 0 },
  gstRate: { type: Number, default: 0 },
  taxable: { type: Number, default: 0 },
  cgst:    { type: Number, default: 0 },
  sgst:    { type: Number, default: 0 },
  igst:    { type: Number, default: 0 },
  amt:     { type: Number, default: 0 },
}, { _id: true });

const BillSchema = new mongoose.Schema({
  billNo:  { type: String, required: true, unique: true, index: true },
  type:    { type: String, required: true, enum: ['dc','cb','cr','gst','jw'], default: 'dc' },
  status:  { type: String, enum: ['draft','final','cancelled','paid'], default: 'final' },
  date:    { type: Date, required: true, default: Date.now },
  dueDate: { type: Date },

  // Customer info (denormalized for bill permanence)
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  custName:   { type: String, default: '' },
  custAddr:   { type: String, default: '' },
  custPhone:  { type: String, default: '' },
  custGST:    { type: String, default: '' },
  custState:  { type: String, default: '33' },

  // Transport
  transport:  { type: String, default: 'By Hand' },
  vehicleNo:  { type: String, default: '' },

  // Items
  items: [ItemSchema],

  // Totals
  subtotal:  { type: Number, default: 0 },
  discount:  { type: Number, default: 0 },
  taxable:   { type: Number, default: 0 },
  cgstTotal: { type: Number, default: 0 },
  sgstTotal: { type: Number, default: 0 },
  igstTotal: { type: Number, default: 0 },
  gstTotal:  { type: Number, default: 0 },
  roundOff:  { type: Number, default: 0 },
  total:     { type: Number, default: 0 },
  words:     { type: String, default: 'Rupees Zero Only' },

  // GST
  gstRate:   { type: Number, default: 0 },
  isIGST:    { type: Boolean, default: false },

  // Payment
  paymentMode: { type: String, enum: ['Cash','Credit','UPI','Cheque','NEFT','RTGS',''], default: '' },
  paidAmount:  { type: Number, default: 0 },
  balance:     { type: Number, default: 0 },

  notes:     { type: String, default: '' },
  terms:     { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Sync fields
  uuid:       { type: String, index: true, sparse: true },
  deviceId:   { type: String },
  syncStatus: { type: String, enum: ['pending','synced','conflict'], default: 'synced' },
  deletedAt:  { type: Date, default: null },
}, { timestamps: true });

BillSchema.index({ date: -1, type: 1, status: 1 });
BillSchema.index({ custName: 'text', billNo: 'text' });

// Auto-calc balance
BillSchema.pre('save', function(next) {
  this.balance = this.total - this.paidAmount;
  next();
});

module.exports = mongoose.model('Bill', BillSchema);
