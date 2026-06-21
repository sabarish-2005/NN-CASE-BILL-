const mongoose = require('mongoose');

const laborSchema = new mongoose.Schema({
  name: { type: String, required: true },
  coverName: { type: String, default: '' },
  coverPrice: { type: Number, default: 0 },
  ratePerPiece: { type: Number, default: 0 },
  workRecords: [{
    uuid: { type: String },
    date: { type: Date, required: true },
    day: { type: String, enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], required: true },
    piecesCompleted: { type: Number, default: 0 },
    earningForDay: { type: Number, default: 0 },
    notes: String,
    syncStatus: { type: String, enum: ['pending','synced','conflict'], default: 'synced' },
    deviceId: { type: String },
    deletedAt: { type: Date, default: null },
  }],
  totalPieces: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Sync fields
  uuid:       { type: String, index: true, sparse: true },
  deviceId:   { type: String },
  syncStatus: { type: String, enum: ['pending','synced','conflict'], default: 'synced' },
  deletedAt:  { type: Date, default: null },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update totals before saving
laborSchema.pre('save', function() {
  this.totalPieces = (this.workRecords || []).reduce((sum, r) => sum + (r.piecesCompleted || 0), 0);
  this.totalEarnings = (this.workRecords || []).reduce((sum, r) => sum + (r.earningForDay || 0), 0);
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('Labor', laborSchema);
