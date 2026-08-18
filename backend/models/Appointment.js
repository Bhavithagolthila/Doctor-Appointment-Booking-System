const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  patientName:   { type: String, required: true, trim: true },
  patientPhone:  { type: String, default: '', trim: true },
  doctorId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  doctorName:    { type: String, required: true, trim: true },
  doctorImage:   { type: String, default: '' },
  speciality:    { type: String, default: '', trim: true },
  // Stored as local "YYYY-MM-DD" / "HH:MM" strings on purpose (see SlotPicker.jsx
  // and the routes) to avoid UTC timezone shifting the date. Validate the
  // shape at the schema level too, since these are just strings and nothing
  // else stops a malformed value being written by a future code path.
  date:          { type: String, required: true, match: [/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'] },
  time:          { type: String, required: true, match: [/^\d{2}:\d{2}$/, 'Invalid time format'] },
  fee:           { type: Number, default: 0 },
  paymentMethod: { type: String, enum: ['UPI', 'Card', 'NetBanking', 'Cash'], default: 'UPI' },
  paymentStatus: { type: String, enum: ['paid', 'unpaid'], default: 'paid' },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'confirmed'
  },
  cancelledBy:   { type: String, enum: ['user', 'admin', null], default: null },
  cancelReason:  { type: String, default: '' },
  bookedAt: { type: Date, default: Date.now }
});

// FIX: the only protection against double-booking used to be an
// application-level `findOne()` check before `create()` in the route
// handler — a classic check-then-act race condition. Two requests for the
// same doctor/date/time arriving close together could both pass that check
// before either finished writing, resulting in two active appointments for
// the same slot. This partial unique index makes MongoDB itself the source
// of truth: only one *active* (pending/confirmed) appointment can exist per
// doctor+date+time combination, enforced atomically at the database level
// regardless of request timing. Cancelled/completed appointments are
// excluded via partialFilterExpression so a slot can be freely rebooked
// after a cancellation.
appointmentSchema.index(
  { doctorId: 1, date: 1, time: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['pending', 'confirmed'] } },
  }
);

// Supporting (non-unique) indexes for the two most common read patterns:
// "all appointments for this user" (My Appointments, one-per-day check) and
// "all appointments for this doctor on this date" (slot availability).
appointmentSchema.index({ userId: 1, date: 1 });
appointmentSchema.index({ doctorId: 1, date: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
