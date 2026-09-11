require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const discussionRoutes = require('./routes/discussionRoutes');
const applicantRoutes = require('./routes/applicantRoutes');
const interestRoutes = require('./routes/interestRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: ['http://localhost:8000', 'http://127.0.0.1:8000', 'http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'TCEMate backend is running'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/discussions', discussionRoutes);
app.use('/api/applicants', applicantRoutes);
app.use('/api/interests', interestRoutes);
app.use('/api/notifications', notificationRoutes);

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

const startServer = async () => {
  const connected = await connectDB();
  if (!connected) {
    console.warn('Server started without a valid MongoDB connection. Add MONGO_URI to backend/.env to enable persistence.');
  }

  app.listen(PORT, () => {
    console.log(`TCEMate backend running on http://localhost:${PORT}`);
  });
};

startServer();
