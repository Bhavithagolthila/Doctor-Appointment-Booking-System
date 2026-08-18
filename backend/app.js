const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoSanitize = require('express-mongo-sanitize');
require('dotenv').config();

// FIX: the MongoDB connection used to be opened here, as a fire-and-forget
// `.then()/.catch()` — app.js was required (and app.listen() called) by
// server.js immediately afterwards, with no guarantee the connection had
// actually finished by the time the first request came in. Connecting is
// now server.js's job: it awaits a successful connection *before* it even
// requires this file, so by the time this module (and its routes) load,
// MongoDB is already connected. See server.js and config/db.js.

const app = express();

// FIX: CORS origins are now environment-driven (comma-separated
// CORS_ORIGINS) instead of hardcoded, so the same code works across
// dev/staging without editing app.js. Falls back to the standard local dev
// ports (frontend 5173, admin 5174) when the env var isn't set.
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
  : ['http://localhost:5173', 'http://localhost:5174'];

app.use(cors({
  origin: corsOrigins,
  credentials: true,
}));
app.use(express.json());
// FIX: strips any request key starting with '$' or containing '.' from
// req.body/req.query/req.params — the standard defense against NoSQL
// operator injection (e.g. { "email": { "$ne": null } }). Combined with the
// explicit type checks added in the route handlers, this is defense in depth
// rather than the only line of protection.
app.use(mongoSanitize());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/doctors', require('./routes/doctors'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/admin', require('./routes/admin'));

// 404 fallback for unmatched API routes
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: 'Not found' });
});

// FIX: last-resort error handler no longer echoes err.message (which can
// contain raw Mongoose/driver internals) back to the client — logs the full
// error server-side and returns a generic message instead.
app.use((err, req, res, next) => {
  console.error(err.stack || err);
  res.status(err.status || 500).json({ success: false, message: 'Internal Server Error' });
});

module.exports = app;
