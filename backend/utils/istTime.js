// Centralized, explicit Asia/Kolkata (IST) time helpers for appointment
// business logic (past-date / past-slot validation, "is this today" checks).
//
// FIX: this logic used to be `new Date()` combined with the server
// process's own local getters (getFullYear/getMonth/getDate/getHours/
// getMinutes) — correct only if the server's OS/process timezone happens to
// be IST. A production server running in UTC (or any other timezone) would
// compute the wrong "today" and "now", silently blocking valid slots or
// allowing past ones. This app is for Indian users, so appointment
// availability must always be evaluated in Asia/Kolkata, regardless of
// what timezone the server itself is running in.
//
// No extra date library is introduced — Node's built-in Intl API (ICU is
// bundled with Node by default) can format any Date into a given IANA
// timezone directly, which is all that's needed here.

const IST_TIMEZONE = 'Asia/Kolkata';

// Current date in India as "YYYY-MM-DD" — the same format appointments are
// stored in (see models/Appointment.js), so it can be compared directly
// with stored `date` strings using plain string comparison.
function getISTDateStr(date = new Date()) {
  // en-CA locale formats as YYYY-MM-DD, which is exactly the stored shape.
  return date.toLocaleDateString('en-CA', { timeZone: IST_TIMEZONE });
}

// Current time in India as 24-hour "HH:MM" — matches the stored `time`
// shape (see SlotPicker.jsx / models/Appointment.js).
function getISTTimeStr(date = new Date()) {
  return date.toLocaleTimeString('en-GB', {
    timeZone: IST_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

// Convenience: both values for "right now", computed from a single
// Date instance so date and time are always consistent with each other.
function getISTNow() {
  const now = new Date();
  return { dateStr: getISTDateStr(now), timeStr: getISTTimeStr(now) };
}

// FIX: validates that a "YYYY-MM-DD" string is a real calendar date, not
// just the right shape. The booking route only checked the string against
// /^\d{4}-\d{2}-\d{2}$/, which happily accepts non-existent dates like
// "2026-02-30" or "2026-13-01" — Mongoose would then store it as-is (the
// schema-level match is the same shape-only regex), and every downstream
// comparison against it (today/tomorrow, calendar display, etc.) would be
// operating on a date that never happened.
function isValidCalendarDateStr(dateStr) {
  if (typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  if (m < 1 || m > 12) return false;
  // Constructing in UTC and reading the components back is the standard way
  // to detect JS's Date "overflow" behavior (e.g. new Date(2026, 1, 30)
  // silently becomes March 2nd instead of throwing).
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

// FIX: converts an appointment's stored IST wall-clock date+time (e.g.
// "2026-08-20" / "14:30") into the actual UTC instant it represents, so it
// can be compared against Date.now() for time-based rules like the 24-hour
// cancellation window. IST is a fixed UTC+5:30 offset (no DST), so treating
// the wall-clock values as if they were UTC and then subtracting 5h30m
// yields the true UTC instant — the same technique used by getISTNow()'s
// counterparts, just inverted.
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
function istWallTimeToUTCDate(dateStr, timeStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = timeStr.split(':').map(Number);
  return new Date(Date.UTC(y, m - 1, d, hh, mm, 0) - IST_OFFSET_MS);
}

module.exports = {
  IST_TIMEZONE, getISTDateStr, getISTTimeStr, getISTNow,
  isValidCalendarDateStr, istWallTimeToUTCDate,
};
