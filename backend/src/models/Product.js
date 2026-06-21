const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  hsn:      { type: String, default: '3923', trim: true },
  unit:     { type: String, default: 'Nos', enum: ['Nos','Kg','Meter','Feet','Inch','Bundle','Roll','Set','Ltr','Box','Bag','Hour','Pcs','Dozen'] },
  rate:     { type: Number, required: true, min: 0, default: 0 },
  gstRate:  { type: Number, default: 0, enum: [0, 5, 12, 18, 28] },
  category: { type: String, default: 'General', enum: ['Grow Bag','Open Top Cover','Cutting','Labour','Other','General'] },
  desc:     { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  stock:    { type: Number, default: 0 },
  createdBy:{ type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Sync fields
  uuid:       { type: String, index: true, sparse: true },
  deviceId:   { type: String },
  syncStatus: { type: String, enum: ['pending','synced','conflict'], default: 'synced' },
  deletedAt:  { type: Date, default: null },
}, { timestamps: true });

ProductSchema.index({ name: 'text', hsn: 'text', category: 1 });

module.exports = mongoose.model('Product', ProductSchema);
