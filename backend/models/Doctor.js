const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true, maxlength: 100 },
  speciality:  { type: String, required: true, trim: true, maxlength: 100 },
  degree:      { type: String, default: 'MBBS', trim: true },
  experience:  { type: String, default: '1 Year', trim: true },
  fee:         { type: Number, required: true, min: [0, 'Fee cannot be negative'] },
  about:       { type: String, default: '', trim: true, maxlength: 2000 },
  available:   { type: Boolean, default: true },
  image:       { type: String, default: '' },
  location:    { type: String, default: '', trim: true },
  rating:      { type: Number, default: 4.5, min: 0, max: 5 },
}, { timestamps: true });

module.exports = mongoose.model('Doctor', doctorSchema);
