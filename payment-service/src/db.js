const mongoose = require('mongoose');

async function connectDB(uri) {
  try {
    await mongoose.connect(uri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000, // 5 seconds timeout for server selection
      socketTimeoutMS: 45000, // 45 seconds socket timeout
      connectTimeoutMS: 10000, // 10 seconds connection timeout
    });
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
}

module.exports = { connectDB };