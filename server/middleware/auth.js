const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protects routes: requires a valid "Authorization: Bearer <token>" header
async function protect(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user no longer exists' });
    }
    req.user = user; // available in every protected controller
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized, token invalid or expired' });
  }
}

module.exports = protect;
