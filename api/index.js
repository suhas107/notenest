// Vercel serverless entry point: connects to MongoDB, then hands the request to Express
const app = require('../server/app');
const connectDB = require('../server/config/db');

module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    return res.status(500).json({ message: 'Database connection failed' });
  }
  return app(req, res);
};
