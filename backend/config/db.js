const mongoose = require('mongoose');

// Establishes the single MongoDB connection for the whole app. Called once
// from server.js, and awaited there before the HTTP server starts listening
// — see server.js for the reasoning.
async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is not set. Check your .env file.');
  }
  // Mongoose's default serverSelectionTimeoutMS is 30s, which makes a dead
  // database take a long time to fail loudly at startup. 5s is plenty for
  // a local/same-network MongoDB instance and gives a much faster, clearer
  // failure signal without changing any other behavior.
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
}

module.exports = connectDB;
