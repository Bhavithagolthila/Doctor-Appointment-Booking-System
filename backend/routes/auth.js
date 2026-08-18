const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { sendServerError, isDuplicateKeyError } = require('../utils/response');
const {
  validateName, validateEmail, validatePhone, validatePassword, normalizeEmail, isNonEmptyString,
} = require('../utils/validators');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

// FIX: basic brute-force protection on the two credential-guessing endpoints.
// Doesn't block legitimate retries (20 attempts / 15 min per IP) but slows
// down automated password-spraying against known/guessed emails.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again later.' },
});

// POST /api/auth/register
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { name, email, password, confirmPassword, phone } = req.body;

    // ── FIX: real server-side validation ────────────────────────────────
    // Previously this only checked "name && email && password" were
    // present — no email format check, no phone format check, no password
    // strength requirement, and confirmPassword (when sent) was ignored
    // entirely. The frontend enforced all of this, but frontend validation
    // is trivially bypassable via direct API calls, so none of it was
    // actually enforced.
    const errors = {};
    const nameErr = validateName(name); if (nameErr) errors.name = nameErr;
    const emailErr = validateEmail(email); if (emailErr) errors.email = emailErr;
    const phoneErr = validatePhone(phone); if (phoneErr) errors.phone = phoneErr;
    const passwordErr = validatePassword(password); if (passwordErr) errors.password = passwordErr;
    if (confirmPassword !== undefined && confirmPassword !== password) {
      errors.confirmPassword = 'Passwords do not match';
    }
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ success: false, message: Object.values(errors)[0], errors });
    }

    const normalizedEmail = normalizeEmail(email);
    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Email already registered. Please log in.' });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      phone: phone.trim(),
    });
    const token = signToken(user._id);
    res.status(201).json({
      success: true,
      data: { id: user._id, name: user.name, email: user.email, token },
    });
  } catch (err) {
    // Race-condition fallback: two near-simultaneous registrations with the
    // same email could both pass the findOne() check above before either
    // finishes writing. The unique index on User.email is the real safety
    // net; this turns that into a clean 400 instead of a raw 500.
    if (isDuplicateKeyError(err)) {
      return res.status(400).json({ success: false, message: 'Email already registered. Please log in.' });
    }
    sendServerError(res, err, 'Registration failed. Please try again.');
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    // FIX: explicit type/emptiness checks before the query — without this,
    // a crafted request body like { "email": { "$ne": null } } would be
    // passed straight into User.findOne({ email }), a classic NoSQL
    // operator-injection pattern that could match an arbitrary user.
    if (!isNonEmptyString(email) || typeof password !== 'string' || password.length === 0) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail });
    // Same generic message whether the email doesn't exist or the password
    // is wrong — never reveal which one it was.
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    if (!user.active) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated. Please contact support.' });
    }

    const token = signToken(user._id);
    res.json({
      success: true,
      data: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, token },
    });
  } catch (err) {
    sendServerError(res, err, 'Login failed. Please try again.');
  }
});

// GET /api/auth/me
router.get('/me', protect, (req, res) => {
  res.json({ success: true, data: req.user });
});

// PATCH /api/auth/me — update the logged-in user's own profile (name, phone)
// FIX: the frontend Profile page used to "save" to an unused localStorage
// key and never actually persisted changes. This makes it real, and
// validates both fields server-side rather than trusting the frontend.
router.patch('/me', protect, async (req, res) => {
  try {
    const { name, phone } = req.body;
    const update = {};

    if (name !== undefined) {
      const nameErr = validateName(name);
      if (nameErr) return res.status(400).json({ success: false, message: nameErr });
      update.name = name.trim();
    }
    if (phone !== undefined) {
      // Phone is optional on profile edits (user may want to clear it),
      // but if a non-empty value is sent it must be a valid Indian mobile.
      if (isNonEmptyString(phone)) {
        const phoneErr = validatePhone(phone);
        if (phoneErr) return res.status(400).json({ success: false, message: phoneErr });
        update.phone = phone.trim();
      } else {
        update.phone = '';
      }
    }

    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true, runValidators: true }).select('-password');
    res.json({ success: true, data: user });
  } catch (err) {
    sendServerError(res, err, 'Could not update profile. Please try again.');
  }
});

module.exports = router;
