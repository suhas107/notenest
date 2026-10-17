// 404 for unknown API routes
function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// Central error handler - turns errors into clean JSON responses
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Mongoose schema validation failed
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: errors.join(', '), errors });
  }
  // Invalid MongoDB ObjectId in the URL
  if (err.name === 'CastError') {
    return res.status(400).json({ message: `Invalid ${err.path}: ${err.value}` });
  }
  // Duplicate key (e.g. email already registered)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({ message: `That ${field} is already in use` });
  }
  // Malformed JSON body
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Request body must be valid JSON' });
  }

  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
}

module.exports = { notFound, errorHandler };
