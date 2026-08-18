const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const { protect, adminOnly } = require('../middleware/auth');
const { sendServerError } = require('../utils/response');
const { isNonEmptyString } = require('../utils/validators');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again later.' },
});

// Multer config for doctor photos
const uploadDir = path.join(__dirname, '..', 'uploads', 'doctors');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `doctor_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`);
  },
});
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG, PNG, WEBP or GIF image files are allowed'));
  },
});

// Wraps a multer middleware so file-type/size errors return a clean 400
// instead of falling through to an unhandled-error 500.
function handleUpload(field) {
  const mw = upload.single(field);
  return (req, res, next) => {
    mw(req, res, (err) => {
      if (err) return res.status(400).json({ success: false, message: err.message || 'Upload failed' });
      next();
    });
  };
}

// POST /api/admin/login
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!isNonEmptyString(email) || typeof password !== 'string' || password.length === 0) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail, role: 'admin' });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }
    if (!user.active) {
      return res.status(403).json({ success: false, message: 'This admin account has been deactivated.' });
    }
    const token = signToken(user._id);
    res.json({ success: true, data: { id: user._id, name: user.name, email: user.email, token } });
  } catch (err) {
    sendServerError(res, err, 'Login failed. Please try again.');
  }
});

router.use(protect, adminOnly);

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const [
      totalDoctors, totalUsers, totalAppointments,
      pendingAppointments, confirmedAppointments,
      completedAppointments, cancelledAppointments
    ] = await Promise.all([
      Doctor.countDocuments(),
      User.countDocuments({ role: 'user' }),
      Appointment.countDocuments(),
      Appointment.countDocuments({ status: 'pending' }),
      Appointment.countDocuments({ status: 'confirmed' }),
      Appointment.countDocuments({ status: 'completed' }),
      Appointment.countDocuments({ status: 'cancelled' }),
    ]);
    const revenueResult = await Appointment.aggregate([
      { $match: { paymentStatus: 'paid', status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$fee' } } }
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;
    const recentAppointments = await Appointment.find().sort({ bookedAt: -1 }).limit(10);
    const doctors = await Doctor.find().select('name speciality available').limit(20);
    res.json({
      success: true,
      data: {
        totalDoctors, totalUsers, totalAppointments,
        pendingAppointments, confirmedAppointments,
        completedAppointments, cancelledAppointments,
        totalRevenue, recentAppointments, doctors
      }
    });
  } catch (err) {
    sendServerError(res, err, 'Could not load dashboard stats.');
  }
});

// GET /api/admin/appointments
router.get('/appointments', async (req, res) => {
  try {
    const { search, status } = req.query;
    const ALLOWED_STATUSES = ['pending', 'confirmed', 'cancelled', 'completed'];
    let query = {};
    if (status && status !== 'All') {
      const normalized = String(status).toLowerCase();
      if (!ALLOWED_STATUSES.includes(normalized)) {
        return res.status(400).json({ success: false, message: 'Invalid status filter' });
      }
      query.status = normalized;
    }
    if (search) query.$or = [
      { patientName: { $regex: String(search), $options: 'i' } },
      { doctorName: { $regex: String(search), $options: 'i' } }
    ];
    const appts = await Appointment.find(query).sort({ bookedAt: -1 });
    res.json({ success: true, data: appts });
  } catch (err) {
    sendServerError(res, err, 'Could not load appointments.');
  }
});

// PATCH /api/admin/appointments/:id/status
router.patch('/appointments/:id/status', async (req, res) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    const { status, cancelReason } = req.body;
    if (!['pending','confirmed','cancelled','completed'].includes(status))
      return res.status(400).json({ success: false, message: 'Invalid status' });

    const update = { status };
    if (status === 'cancelled') {
      update.cancelledBy = 'admin';
      update.cancelReason = typeof cancelReason === 'string' ? cancelReason.trim() : '';
    } else {
      update.cancelledBy = null;
      update.cancelReason = '';
    }

    const appt = await Appointment.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!appt) return res.status(404).json({ success: false, message: 'Appointment not found' });
    res.json({ success: true, data: appt });
  } catch (err) {
    sendServerError(res, err, 'Could not update appointment status.');
  }
});

// DELETE /api/admin/appointments/:id  (only cancelled appointments can be deleted)
router.delete('/appointments/:id', async (req, res) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    const appt = await Appointment.findById(req.params.id);
    if (!appt) return res.status(404).json({ success: false, message: 'Not found' });
    if (appt.status !== 'cancelled') {
      return res.status(400).json({ success: false, message: 'Only cancelled appointments can be deleted.' });
    }
    await Appointment.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    sendServerError(res, err, 'Could not delete appointment.');
  }
});

// GET /api/admin/doctors
router.get('/doctors', async (req, res) => {
  try {
    const doctors = await Doctor.find().sort({ createdAt: -1 });
    const withCounts = await Promise.all(doctors.map(async d => {
      const count = await Appointment.countDocuments({ doctorId: d._id });
      return { ...d.toObject(), appointmentCount: count };
    }));
    res.json({ success: true, data: withCounts });
  } catch (err) {
    sendServerError(res, err, 'Could not load doctors.');
  }
});

// POST /api/admin/doctors
router.post('/doctors', handleUpload('image'), async (req, res) => {
  try {
    const { name, speciality, degree, experience, fee, about, location, available } = req.body;
    if (!isNonEmptyString(name) || !isNonEmptyString(speciality)) {
      return res.status(400).json({ success: false, message: 'Name and speciality are required' });
    }
    const feeNum = Number(fee);
    if (!fee || isNaN(feeNum) || feeNum < 0) {
      return res.status(400).json({ success: false, message: 'Enter a valid consultation fee' });
    }
    const imageUrl = req.file ? `/uploads/doctors/${req.file.filename}` : '';
    const doctor = await Doctor.create({
      name: name.trim(),
      speciality: speciality.trim(),
      degree: degree ? String(degree).trim() : undefined,
      experience: experience ? String(experience).trim() : undefined,
      fee: feeNum,
      about: about ? String(about).trim() : '',
      location: location ? String(location).trim() : '',
      available: available === undefined ? true : (available === 'true' || available === true),
      image: imageUrl,
    });
    res.status(201).json({ success: true, data: doctor });
  } catch (err) {
    sendServerError(res, err, 'Could not add doctor.');
  }
});

// PATCH /api/admin/doctors/:id/availability
router.patch('/doctors/:id/availability', async (req, res) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ success: false, message: 'Not found' });
    doctor.available = !doctor.available;
    await doctor.save();
    res.json({ success: true, data: doctor });
  } catch (err) {
    sendServerError(res, err, 'Could not update availability.');
  }
});

// PATCH /api/admin/doctors/:id
// FIX: this used to pass req.body straight into findByIdAndUpdate() with no
// whitelist — a mass-assignment risk (a caller could set arbitrary schema
// fields, or attempt to inject Mongo update operators via nested keys).
// Only known, editable doctor fields are accepted here.
const DOCTOR_EDITABLE_FIELDS = ['name', 'speciality', 'degree', 'experience', 'fee', 'about', 'location', 'available', 'image'];
router.patch('/doctors/:id', async (req, res) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    const update = {};
    for (const field of DOCTOR_EDITABLE_FIELDS) {
      if (req.body[field] === undefined) continue;
      if (field === 'fee') {
        const feeNum = Number(req.body.fee);
        if (isNaN(feeNum) || feeNum < 0) {
          return res.status(400).json({ success: false, message: 'Enter a valid consultation fee' });
        }
        update.fee = feeNum;
      } else if (field === 'available') {
        update.available = req.body.available === true || req.body.available === 'true';
      } else if (field === 'name' || field === 'speciality') {
        if (!isNonEmptyString(req.body[field])) {
          return res.status(400).json({ success: false, message: `${field} cannot be empty` });
        }
        update[field] = String(req.body[field]).trim();
      } else {
        update[field] = String(req.body[field]).trim();
      }
    }
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!doctor) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: doctor });
  } catch (err) {
    sendServerError(res, err, 'Could not update doctor.');
  }
});

// DELETE /api/admin/doctors/:id
router.delete('/doctors/:id', async (req, res) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    const doctor = await Doctor.findByIdAndDelete(req.params.id);
    if (!doctor) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    sendServerError(res, err, 'Could not delete doctor.');
  }
});

// PATCH /api/admin/users/:id/status
router.patch('/users/:id/status', async (req, res) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const { active } = req.body;
    if (typeof active !== 'boolean')
      return res.status(400).json({ success: false, message: 'active must be a boolean' });
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { active },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    sendServerError(res, err, 'Could not update user status.');
  }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }).select('-password').sort({ createdAt: -1 });
    const withCounts = await Promise.all(users.map(async u => {
      const count = await Appointment.countDocuments({ userId: u._id });
      return { ...u.toObject(), appointmentCount: count };
    }));
    res.json({ success: true, data: withCounts });
  } catch (err) {
    sendServerError(res, err, 'Could not load users.');
  }
});

module.exports = router;
