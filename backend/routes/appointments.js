const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const { protect } = require('../middleware/auth');
const { sendServerError, isDuplicateKeyError } = require('../utils/response');
const { getISTNow, isValidCalendarDateStr, istWallTimeToUTCDate } = require('../utils/istTime');

const PAYMENT_METHODS = ['UPI', 'Card', 'NetBanking', 'Cash'];

// FIX: canonical list of bookable time slots (24h "HH:MM"), matching the
// slots SlotPicker.jsx actually offers on the frontend. Previously the
// booking route only checked that `time` had the right "HH:MM" shape —
// any value matching that shape (e.g. "13:37", a value between real
// slots) was accepted and stored, even though no such slot was ever
// offered in the UI. Keeping this list backend-side means the slot grid
// is enforced as real business logic, not just a frontend display detail.
const VALID_SLOT_TIMES = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
];

// FIX: the minimum notice required to cancel a booked appointment, matching
// the "Cancel 24h before slot" promise already shown in the Payment page UI
// (see frontend/src/pages/Payment.jsx). Previously nothing in the backend
// enforced this — a user could cancel seconds before, or even after, their
// appointment time.
const CANCELLATION_WINDOW_MS = 24 * 60 * 60 * 1000;

// POST /api/appointments
router.post('/', protect, async (req, res) => {
  try {
    const { doctorId, date, time, paymentMethod } = req.body;

    // FIX: type-check every field before it touches a query or gets stored.
    // Without this, a crafted body (e.g. doctorId as an object) could behave
    // unexpectedly against Mongoose's cast layer instead of failing cleanly
    // with a normal 400.
    if (
      typeof doctorId !== 'string' || !doctorId.match(/^[0-9a-fA-F]{24}$/) ||
      typeof date !== 'string' || !date.match(/^\d{4}-\d{2}-\d{2}$/) ||
      typeof time !== 'string' || !time.match(/^\d{2}:\d{2}$/) ||
      typeof paymentMethod !== 'string' || !PAYMENT_METHODS.includes(paymentMethod)
    ) {
      return res.status(400).json({ success: false, message: 'doctorId, date, time and a valid paymentMethod are required' });
    }

    // FIX: the shape regex above accepts non-existent calendar dates like
    // "2026-02-30" or "2026-13-01" — validate it's a real date too.
    if (!isValidCalendarDateStr(date)) {
      return res.status(400).json({ success: false, message: 'Enter a valid calendar date.' });
    }

    // FIX: reject any time that isn't one of the actual slots offered by
    // the booking UI, not just anything matching "HH:MM".
    if (!VALID_SLOT_TIMES.includes(time)) {
      return res.status(400).json({ success: false, message: 'Select a valid appointment time slot.' });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
    if (!doctor.available) return res.status(400).json({ success: false, message: 'Doctor not available' });

    // ── FIX: reject past dates / already-passed times, using India time ────
    // `date` is stored as a "YYYY-MM-DD" string and `time` as a 24h "HH:MM"
    // string (see SlotPicker.jsx / models/Appointment.js). This app is for
    // Indian users, so "today" and "now" must always be Asia/Kolkata's
    // today/now — not the server process's own local timezone, which in
    // production may well be UTC. getISTNow() formats the current instant
    // directly into IST via Intl, independent of server TZ, so this is
    // correct whether the server is running in UTC, IST, or anything else.
    const { dateStr: todayIST, timeStr: nowIST } = getISTNow();
    if (date < todayIST) {
      return res.status(400).json({ success: false, message: 'Appointments cannot be booked for a past date.' });
    }
    if (date === todayIST && time <= nowIST) {
      return res.status(400).json({ success: false, message: 'This time slot has already passed today. Please choose a later time.' });
    }

    // ── FIX 2: Slot conflict check ──────────────────────────────────────────
    // Check if this exact slot is already booked (not cancelled)
    const conflict = await Appointment.findOne({
      doctorId,
      date,
      time,
      status: { $in: ['pending', 'confirmed'] },
    });
    if (conflict) {
      return res.status(409).json({
        success: false,
        message: 'This slot is already booked. Please choose a different time.',
      });
    }
    // ────────────────────────────────────────────────────────────────────────

    // ── FIX 17: One active appointment per user per day ─────────────────────
    // Previously a user could book unlimited appointments on the same date
    // (even with the same doctor at different times, or with several
    // different doctors), since the only check above was per doctor/slot.
    // A cancelled appointment doesn't count — the user can rebook that day.
    const sameDayAppt = await Appointment.findOne({
      userId: req.user._id,
      date,
      status: { $in: ['pending', 'confirmed'] },
    });
    if (sameDayAppt) {
      return res.status(409).json({
        success: false,
        message: `You already have an appointment on ${date} (with ${sameDayAppt.doctorName}). Only one appointment per day is allowed — cancel it first if you'd like to book a different one.`,
      });
    }
    // ────────────────────────────────────────────────────────────────────────

    const isCash = paymentMethod === 'Cash';
    let appt;
    try {
      // FIX: patientName/patientPhone come from req.user (the authenticated,
      // server-verified identity), never from the request body — a client
      // can't spoof another patient's name/phone onto a booking this way.
      appt = await Appointment.create({
        userId: req.user._id,
        patientName: req.user.name,
        patientPhone: req.user.phone || '',
        doctorId,
        doctorName: doctor.name,
        doctorImage: doctor.image || '',
        speciality: doctor.speciality,
        date,
        time,
        fee: doctor.fee,
        paymentMethod,
        status: isCash ? 'pending' : 'confirmed',
        paymentStatus: isCash ? 'unpaid' : 'paid',
      });
    } catch (createErr) {
      // FIX: this is the actual race-condition safety net. The `findOne`
      // conflict check above is a best-effort pre-check, but two nearly
      // simultaneous requests can both pass it before either finishes
      // writing. The unique partial index on the Appointment model (see
      // models/Appointment.js) makes MongoDB reject the second write with a
      // duplicate-key error (code 11000) — we catch that specifically here
      // and turn it into the same clean 409 a sequential conflict would get,
      // instead of letting it fall through as a raw 500.
      if (isDuplicateKeyError(createErr)) {
        return res.status(409).json({
          success: false,
          message: 'This slot is already booked. Please choose a different time.',
        });
      }
      throw createErr;
    }
    res.status(201).json({ success: true, data: appt });
  } catch (err) {
    sendServerError(res, err, 'Could not complete booking. Please try again.');
  }
});

// GET /api/appointments/my — the logged-in user's own appointments.
// FIX: preferred over the userId-in-URL pattern below — there is no id to
// tamper with, since it's always derived from the verified JWT.
router.get('/my', protect, async (req, res) => {
  try {
    const appts = await Appointment.find({ userId: req.user._id }).sort({ bookedAt: -1 });
    res.json({ success: true, data: appts });
  } catch (err) {
    sendServerError(res, err, 'Could not load your appointments.');
  }
});

// GET /api/appointments/user/:userId
// Kept for backward compatibility with the existing frontend call site.
// Ownership is still strictly enforced: a user may only ever request their
// own id, and only an admin may request someone else's.
router.get('/user/:userId', protect, async (req, res) => {
  try {
    if (String(req.user._id) !== req.params.userId && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Forbidden' });
    const appts = await Appointment.find({ userId: req.params.userId }).sort({ bookedAt: -1 });
    res.json({ success: true, data: appts });
  } catch (err) {
    sendServerError(res, err, 'Could not load appointments.');
  }
});

// GET /api/appointments/slots/booked?doctorId=&date=
// Returns booked time slots for a doctor on a given date
// FIX 2 (bonus): endpoint so the frontend can grey out taken slots in real time
router.get('/slots/booked', async (req, res) => {
  try {
    const { doctorId, date } = req.query;
    if (typeof doctorId !== 'string' || !doctorId.match(/^[0-9a-fA-F]{24}$/) ||
        typeof date !== 'string' || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return res.status(400).json({ success: false, message: 'Valid doctorId and date are required' });
    }
    const appts = await Appointment.find({
      doctorId,
      date,
      status: { $in: ['pending', 'confirmed'] },
    }).select('time -_id');
    res.json({ success: true, data: appts.map(a => a.time) });
  } catch (err) {
    sendServerError(res, err, 'Could not load slot availability.');
  }
});

// PATCH /api/appointments/:id/status (user can only cancel)
router.patch('/:id/status', protect, async (req, res) => {
  try {
    // FIX: same malformed-id issue as the doctors route — validate the
    // ObjectId format before querying, instead of letting an invalid id
    // fall through to a raw 500 Mongoose CastError.
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    const appt = await Appointment.findById(req.params.id);
    if (!appt) return res.status(404).json({ success: false, message: 'Appointment not found' });
    if (req.user.role !== 'admin' && String(appt.userId) !== String(req.user._id))
      return res.status(403).json({ success: false, message: 'Forbidden' });
    if (req.user.role !== 'admin' && req.body.status !== 'cancelled')
      return res.status(403).json({ success: false, message: 'Users can only cancel appointments' });
    if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(req.body.status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    if (appt.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'This appointment is already cancelled.' });
    }

    // FIX: enforce the cancellation rules already promised in the UI (see
    // "Cancel 24h before slot" in Payment.jsx) but never actually checked
    // server-side — a patient could previously cancel a completed
    // appointment, or one whose slot had already passed, or one starting in
    // the next few minutes. Admins keep an unrestricted override, since
    // operational cancellations (e.g. doctor unavailable) can't always wait
    // 24 hours.
    if (req.user.role !== 'admin') {
      if (appt.status === 'completed') {
        return res.status(400).json({ success: false, message: 'Completed appointments cannot be cancelled.' });
      }
      const apptInstant = istWallTimeToUTCDate(appt.date, appt.time);
      if (apptInstant.getTime() - Date.now() < CANCELLATION_WINDOW_MS) {
        return res.status(400).json({
          success: false,
          message: 'Appointments can only be cancelled at least 24 hours before the scheduled time.',
        });
      }
    }

    appt.status = req.body.status;
    if (req.body.status === 'cancelled') {
      appt.cancelledBy = req.user.role === 'admin' ? 'admin' : 'user';
      appt.cancelReason = typeof req.body.cancelReason === 'string' ? req.body.cancelReason.trim() : '';
    } else {
      appt.cancelledBy = null;
      appt.cancelReason = '';
    }
    await appt.save();
    res.json({ success: true, data: appt });
  } catch (err) {
    sendServerError(res, err, 'Could not update appointment.');
  }
});

module.exports = router;
