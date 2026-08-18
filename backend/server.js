require('dotenv').config();
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// FIX: previously `app.listen()` ran immediately while app.js opened the
// MongoDB connection asynchronously in the background — the HTTP server
// could start accepting (and failing) requests before the database was
// actually ready. Startup order is now strict and sequential:
//   load env vars -> connect to MongoDB -> verify it succeeded -> start HTTP server
// `require('./app')` is deliberately deferred until *after* the DB
// connection succeeds, so every route module (and anything it does at
// load time) only ever runs against a live connection.
async function startServer() {
  try {
    await connectDB();
    console.log('✅ MongoDB connected');

    const app = require('./app');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    // Log a clear, generic failure — never the raw error, which can include
    // the connection string (and therefore credentials) in some Mongoose
    // driver error messages.
    console.error('MongoDB connection failed.');
    console.error('Server not started.');
    process.exit(1);
  }
}

startServer();
