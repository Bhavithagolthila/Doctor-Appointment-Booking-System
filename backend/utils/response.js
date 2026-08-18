// FIX: nearly every route handler previously did `res.status(500).json({
// message: err.message })`, which leaks raw Mongoose/MongoDB internals
// (field paths, driver error text, sometimes connection strings in cast
// errors) straight to the client. This helper logs the real error
// server-side and always returns a generic, safe message to the caller.
function sendServerError(res, err, fallbackMessage = 'Something went wrong. Please try again.') {
  console.error(err);
  return res.status(500).json({ success: false, message: fallbackMessage });
}

// Mongoose duplicate-key errors (E11000) are the one "expected" error type
// that's safe and useful to surface distinctly (e.g. duplicate email).
function isDuplicateKeyError(err) {
  return err && err.code === 11000;
}

module.exports = { sendServerError, isDuplicateKeyError };
