require('dotenv').config();
const mongoose = require('mongoose');
const Restaurant = require('../src/models/Restaurant');

const { MONGODB_URI = 'mongodb://localhost:27017/restaurant_db' } = process.env;

const data = [
  {
    name: 'Warung Sederhana',
    address: 'Bandung',
    menu: [
      { name: 'Nasi Goreng', description: 'Pedas', price: 18000, isAvailable: true },
      { name: 'Mie Goreng', description: 'Jawa', price: 17000, isAvailable: true },
      { name: 'Ayam Bakar', description: 'Manis', price: 25000, isAvailable: true },
      { name: 'Soto Ayam', description: '', price: 16000, isAvailable: true },
      { name: 'Es Teh', description: '', price: 6000, isAvailable: true }
    ]
  },
  {
    name: 'Bakso Mantul',
    address: 'Cimahi',
    menu: [
      { name: 'Bakso Urat', description: '', price: 20000, isAvailable: true },
      { name: 'Bakso Halus', description: '', price: 18000, isAvailable: true },
      { name: 'Mie Bakso', description: '', price: 22000, isAvailable: true },
      { name: 'Cuanki', description: '', price: 15000, isAvailable: false },
      { name: 'Es Jeruk', description: '', price: 7000, isAvailable: true }
    ]
  },
  {
    name: 'Sushi Hemat',
    address: 'Jakarta',
    menu: [
      { name: 'Salmon Roll', description: '', price: 32000, isAvailable: true },
      { name: 'Tuna Roll', description: '', price: 29000, isAvailable: true },
      { name: 'Kani Roll', description: '', price: 26000, isAvailable: true },
      { name: 'Tamago', description: '', price: 12000, isAvailable: true },
      { name: 'Ocha', description: '', price: 5000, isAvailable: true }
    ]
  }
];

(async () => {
  try {
    await mongoose.connect(MONGODB_URI, { autoIndex: true });
    console.log('✅ MongoDB connected');

    await Restaurant.deleteMany({});
    await Restaurant.insertMany(data);

    console.log('✅ Seeded sample restaurants & menus');
  } catch (e) {
    console.error('❌ Seed error:', e.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();
