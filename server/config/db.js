const mongoose = require('mongoose');

// Cache the connection so serverless functions (Vercel) reuse it between requests
let connectionPromise = null;

async function connectDB(uri = process.env.MONGODB_URI) {
  if (!uri) {
    throw new Error('MONGODB_URI is not set. Add it to your .env file.');
  }
  if (mongoose.connection.readyState === 1) return mongoose.connection;

  // 0 = disconnected: an idle serverless function can lose its connection,
  // so forget the old cached attempt and connect again
  if (mongoose.connection.readyState === 0) connectionPromise = null;

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(uri)
      .then((m) => {
        console.log(`MongoDB connected: ${m.connection.host}`);
        return m.connection;
      })
      .catch((err) => {
        connectionPromise = null; // allow a retry on the next request
        throw err;
      });
  }
  return connectionPromise;
}

module.exports = connectDB;
