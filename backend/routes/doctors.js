const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');
const { sendServerError } = require('../utils/response');

// GET /api/doctors/stats  — public, no auth needed
router.get('/stats', async (req, res) => {
  try {
    const Appointment = require('../models/Appointment');
    const User = require('../models/User');
    const [totalDoctors, totalAppointments, totalPatients, specialities] = await Promise.all([
      Doctor.countDocuments({ available: true }),
      Appointment.countDocuments(),
      User.countDocuments({ role: 'user' }),
      Doctor.distinct('speciality'),
    ]);
    res.json({ success: true, data: { totalDoctors, totalAppointments, totalPatients, totalSpecialities: specialities.length } });
  } catch (err) {
    sendServerError(res, err, 'Could not load site stats.');
  }
});

// GET /api/doctors
router.get('/', async (req, res) => {
  try {
    const { speciality } = req.query;
    const filter = { available: true };
    if (speciality) filter.speciality = String(speciality);
    const doctors = await Doctor.find(filter);
    res.json({ success: true, data: doctors });
  } catch (err) {
    sendServerError(res, err, 'Could not load doctors.');
  }
});

// GET /api/doctors/:id
router.get('/:id', async (req, res) => {
  try {
    // FIX: a malformed id (not a valid 24-char ObjectId) used to fall through
    // to findById(), which throws a Mongoose CastError caught below as a 500
    // with a raw internal error message. Validate the format first so a bad
    // id is treated as "not found" (404), same as any other missing doctor.
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
    res.json({ success: true, data: doctor });
  } catch (err) {
    sendServerError(res, err, 'Could not load doctor profile.');
  }
});

module.exports = router;
