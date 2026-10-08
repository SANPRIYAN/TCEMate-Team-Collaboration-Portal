const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.error('MONGO_URI is missing. Configure MongoDB before starting the API.');
    return false;
  }

  try {
    await mongoose.connect(mongoUri);
    await mongoose.connection.collection('users').createIndex(
      { role: 1 },
      {
        unique: true,
        partialFilterExpression: { role: 'admin' },
        name: 'uniq_single_admin'
      }
    );
    console.log('MongoDB connected successfully');
    return true;
  } catch (error) {
    console.error('MongoDB connection failed:', error.name || 'UnknownError');
    return false;
  }
};

module.exports = connectDB;
