require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const { emailConfigurationPresent } = require('./services/emailService');
const { normalizeEmail } = require('./services/emailValidation');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const discussionRoutes = require('./routes/discussionRoutes');
const applicantRoutes = require('./routes/applicantRoutes');
const interestRoutes = require('./routes/interestRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = Number(process.env.PORT) || 5000;
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  });
  next();
});

const configuredOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
const developmentOrigins = ['http://localhost:8000', 'http://127.0.0.1:8000', 'http://localhost:3000', 'http://127.0.0.1:3000'];
if (process.env.NODE_ENV === 'production' && !configuredOrigins.length) {
  throw new Error('CLIENT_URL must contain the exact frontend origin in production.');
}
if (process.env.NODE_ENV === 'production') {
  if (!process.env.APP_BASE_URL || !emailConfigurationPresent()) {
    throw new Error('APP_BASE_URL and SMTP_* email settings are required in production.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(process.env.ADMIN_SETUP_EMAIL))) {
    throw new Error('ADMIN_SETUP_EMAIL must be a valid, pre-authorized administrator address in production.');
  }
  const clientUrls = configuredOrigins.map((value) => new URL(value));
  const appUrl = new URL(process.env.APP_BASE_URL);
  if (clientUrls.some((url) => url.protocol !== 'https:') || appUrl.protocol !== 'https:') {
    throw new Error('CLIENT_URL and APP_BASE_URL must use HTTPS in production.');
  }
  const smtpPort = Number(process.env.SMTP_PORT || process.env.MAIL_PORT);
  if (!Number.isInteger(smtpPort) || smtpPort < 1 || smtpPort > 65535) {
    throw new Error('SMTP_PORT must be a valid TCP port in production.');
  }
}
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? configuredOrigins
  : [...configuredOrigins, ...developmentOrigins];

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || (process.env.NODE_ENV !== 'production' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))) return callback(null, true);
    const error = new Error('Origin is not allowed by CORS.');
    error.status = 403;
    return callback(error);
  },
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  return res.status(connected ? 200 : 503).json({
    success: connected,
    status: connected ? 'ready' : 'not_ready',
    database: connected ? 'connected' : 'disconnected'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/discussions', discussionRoutes);
app.use('/api/applicants', applicantRoutes);
app.use('/api/interests', interestRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => res.status(404).json({ success: false, message: 'API route not found.' }));
app.use((error, req, res, next) => {
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Malformed JSON request.' });
  }
  if (error.status === 403 && error.message === 'Origin is not allowed by CORS.') {
    return res.status(403).json({ success: false, message: 'Origin is not allowed.' });
  }
  console.error('Unhandled API error:', error.name || 'UnknownError');
  return res.status(error.status || 500).json({
    success: false,
    message: error.status && error.status < 500 ? error.message : 'Internal server error'
  });
});

const startServer = async () => {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters.');
  }
  const connected = await connectDB();
  if (!connected) throw new Error('MongoDB connection is required; refusing to start without persistence.');
  return app.listen(PORT, () => {
    console.log(`TCEMate API listening on port ${PORT}`);
  });
};

if (require.main === module) {
  startServer().catch((error) => {
    console.error('TCEMate API startup failed:', error.message);
    process.exitCode = 1;
  });
}

module.exports = { app, startServer };
