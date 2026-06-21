const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role:     { type: String, enum: ['admin', 'staff'], default: 'admin' },
  isActive: { type: Boolean, default: true },
  lastLogin:{ type: Date },
  settings: {
    gstin:     { type: String, default: '' },
    accountNo: { type: String, default: '' },
    ifsc:      { type: String, default: '' },
    logo:      { type: String, default: '' },
    signature: { type: String, default: '' },
    darkMode:  { type: Boolean, default: false },
  },
}, { timestamps: true });

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

UserSchema.methods.comparePassword = async function(plain) {
  return bcrypt.compare(plain, this.password);
};

UserSchema.methods.getSignedToken = function() {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

module.exports = mongoose.model('User', UserSchema);
