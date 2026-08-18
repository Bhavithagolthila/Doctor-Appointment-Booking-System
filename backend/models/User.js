const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  // FIX: lowercase + trim at the schema level is defense-in-depth on top of
  // the route-level normalization — guarantees the unique index can never
  // be bypassed by case/whitespace variants (e.g. "User@Gmail.com" vs
  // "user@gmail.com") even if some future code path forgets to normalize.
  email: {
    type: String, required: true, unique: true, trim: true, lowercase: true,
    match: [EMAIL_RE, 'Enter a valid email address'],
  },
  password: { type: String, required: true, minlength: 8 },
  phone: { type: String, trim: true, default: '' },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
