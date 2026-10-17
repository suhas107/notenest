const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/authRoutes');
const noteRoutes = require('./routes/noteRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || true }));
app.use(express.json({ limit: '1mb' })); // parse JSON request bodies

// Health check - handy for testing the deployment
app.get('/api/health', (req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.json({ status: 'ok', database: states[mongoose.connection.readyState] || 'unknown' });
});

app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api', notFound);

// After "npm run build", serve the React app from this same server
const clientBuild = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientBuild)) {
  app.use(express.static(clientBuild));
  app.get(/^\/(?!api).*/, (req, res) => res.sendFile(path.join(clientBuild, 'index.html')));
}

app.use(errorHandler);

module.exports = app;
