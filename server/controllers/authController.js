const jwt = require('jsonwebtoken');
const User = require('../models/User');

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function userResponse(user) {
  return { id: user._id, name: user.name, email: user.email };
}

// POST /api/auth/register
async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const exists = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (exists) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const user = await User.create({ name, email, password });
    res.status(201).json({ token: signToken(user._id), user: userResponse(user) });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // password has select:false in the schema, so ask for it explicitly
    const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({ token: signToken(user._id), user: userResponse(user) });
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/me (protected)
function me(req, res) {
  res.json({ user: userResponse(req.user) });
}

module.exports = { register, login, me };
