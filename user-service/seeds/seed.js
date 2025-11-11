require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

const { MONGODB_URI = 'mongodb://localhost:27017/user_db' } = process.env;

const users = [
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    address: '123 Main Street'
  },
  {
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: 'password123',
    address: '456 Oak Avenue'
  },
  {
    name: 'Bob Johnson',
    email: 'bob@example.com',
    password: 'password123',
    address: '789 Pine Road'
  }
];

(async () => {
  try {
    await mongoose.connect(MONGODB_URI, { autoIndex: true });
    console.log('✅ MongoDB connected');

    await User.deleteMany({});
    await User.insertMany(users);

    console.log('✅ Seeded sample users');
    console.log(`✅ Created ${users.length} users`);
  } catch (e) {
    console.error('❌ Seed error:', e.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();
