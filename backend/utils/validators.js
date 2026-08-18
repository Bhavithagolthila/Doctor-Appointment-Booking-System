// Centralized, reusable validation helpers used across auth/admin routes.
// Keeping these in one place means the "rules" (password strength, Indian
// phone format, etc.) are defined exactly once and can't drift between
// registration, profile updates, and admin user creation.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Indian mobile numbers: exactly 10 digits, first digit 6-9.
const PHONE_RE = /^[6-9]\d{9}$/;
// At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character.
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

function validateName(name) {
  if (!isNonEmptyString(name)) return 'Full name is required';
  const trimmed = name.trim();
  if (trimmed.length < 2) return 'Full name must be at least 2 characters';
  if (trimmed.length > 80) return 'Full name is too long';
  return null;
}

function validateEmail(email) {
  if (!isNonEmptyString(email)) return 'Email is required';
  if (!EMAIL_RE.test(email.trim())) return 'Enter a valid email address';
  return null;
}

function validatePhone(phone, { required = true } = {}) {
  if (!isNonEmptyString(phone)) return required ? 'Enter a valid 10-digit Indian mobile number' : null;
  if (!PHONE_RE.test(phone.trim())) return 'Enter a valid 10-digit Indian mobile number starting with 6-9';
  return null;
}

function validatePassword(password) {
  if (typeof password !== 'string' || password.length === 0) return 'Password is required';
  if (!PASSWORD_RE.test(password)) {
    return 'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character';
  }
  return null;
}

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : email;
}

module.exports = {
  EMAIL_RE, PHONE_RE, PASSWORD_RE,
  isNonEmptyString,
  validateName, validateEmail, validatePhone, validatePassword,
  normalizeEmail,
};
