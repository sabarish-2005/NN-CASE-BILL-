const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  name:    { type: String, required: true, trim: true, index: true },
  phone:   { type: String, trim: true, default: '' },
  email:   { type: String, trim: true, lowercase: true, default: '' },
  gstin:   { type: String, trim: true, uppercase: true, default: '' },
  addr:    { type: String, default: '' },
  city:    { type: String, default: '' },
  state:   { type: String, default: 'Tamil Nadu' },
  pincode: { type: String, default: '' },
  stateCode: { type: String, default: '33' },
  isActive:  { type: Boolean, default: true },
  notes:   { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Sync fields
  uuid:       { type: String, index: true, sparse: true },
  deviceId:   { type: String },
  syncStatus: { type: String, enum: ['pending','synced','conflict'], default: 'synced' },
  deletedAt:  { type: Date, default: null },
}, { timestamps: true });

CustomerSchema.virtual('fullAddress').get(function() {
  return [this.addr, this.city, this.state, this.pincode].filter(Boolean).join(', ');
});

CustomerSchema.index({ name: 'text', phone: 'text', gstin: 'text' });

module.exports = mongoose.model('Customer', CustomerSchema);
