require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const Order = require('../src/models/Order');

const { MONGODB_URI = 'mongodb://localhost:27017/order_db' } = process.env;
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
const RESTAURANT_SERVICE_URL = process.env.RESTAURANT_SERVICE_URL || 'http://localhost:3002';

/**
 * Seed script untuk order-service
 * Membutuhkan user-service dan restaurant-service sudah running
 * dan sudah memiliki data (seeded)
 */
(async () => {
  try {
    // 1. Connect to MongoDB
    await mongoose.connect(MONGODB_URI, { autoIndex: true });
    console.log('✅ MongoDB connected');

    // 2. Ambil data users dari user-service
    console.log('📡 Fetching users from user-service...');
    let users;
    try {
      const userRes = await axios.get(`${USER_SERVICE_URL}/users`, {
        timeout: 5000
      });
      // Jika user-service tidak memiliki endpoint GET /users, kita bisa hardcode beberapa userId
      // Tapi untuk sekarang, kita akan menggunakan endpoint yang ada
      if (userRes.data?.status === 'success' && userRes.data?.data) {
        users = Array.isArray(userRes.data.data) 
          ? userRes.data.data 
          : userRes.data.data.users || [];
      }
    } catch (err) {
      console.warn('⚠️  Could not fetch users from user-service. Using fallback method...');
      console.warn('   Make sure user-service is running and has seeded data.');
      // Fallback: ambil userId dari database user-service langsung atau gunakan hardcoded
      users = [];
    }

    // Jika tidak ada users dari API, kita perlu mendapatkan dari database user-service
    // Atau kita bisa membuat seed yang lebih sederhana dengan asumsi userId sudah ada
    // Untuk sekarang, kita akan coba ambil user secara individual
    if (!users || users.length === 0) {
      console.log('📡 Trying to fetch individual users...');
      const userIds = [];
      // Coba ambil beberapa user dengan ID yang mungkin ada (dari seed user-service)
      // Kita akan coba fetch user satu per satu atau gunakan method lain
      console.log('⚠️  No users found. Please ensure user-service is running and seeded.');
      console.log('   Seed will create orders with placeholder userIds.');
      console.log('   You may need to manually update userIds after seeding users.');
      process.exit(1);
    }

    // 3. Ambil data restaurants dari restaurant-service
    console.log('📡 Fetching restaurants from restaurant-service...');
    let restaurants;
    try {
      const restoRes = await axios.get(`${RESTAURANT_SERVICE_URL}/restaurants`, {
        timeout: 5000
      });
      if (restoRes.data?.status === 'success' && restoRes.data?.data) {
        restaurants = Array.isArray(restoRes.data.data) 
          ? restoRes.data.data 
          : [];
      }
    } catch (err) {
      console.error('❌ Error fetching restaurants:', err.message);
      console.error('   Make sure restaurant-service is running and has seeded data.');
      process.exit(1);
    }

    if (!restaurants || restaurants.length === 0) {
      console.error('❌ No restaurants found. Please seed restaurant-service first.');
      process.exit(1);
    }

    console.log(`✅ Found ${users.length} users and ${restaurants.length} restaurants`);

    // 4. Clear existing orders
    await Order.deleteMany({});
    console.log('🗑️  Cleared existing orders');

    // 5. Create sample orders
    const orders = [];

    // Order 1: User pertama memesan dari restoran pertama
    if (users.length > 0 && restaurants.length > 0) {
      const user1 = users[0];
      const restaurant1 = restaurants[0];
      
      if (restaurant1.menu && restaurant1.menu.length > 0) {
        const menuItems = restaurant1.menu.filter(m => m.isAvailable).slice(0, 2);
        if (menuItems.length > 0) {
          const items = menuItems.map(menu => ({
            menuId: mongoose.Types.ObjectId(menu._id),
            quantity: menuItems.indexOf(menu) === 0 ? 2 : 1
          }));
          const totalPrice = items.reduce((sum, item) => {
            const menu = menuItems.find(m => m._id.toString() === item.menuId.toString());
            return sum + (menu.price * item.quantity);
          }, 0);

          orders.push({
            userId: mongoose.Types.ObjectId(user1._id || user1.id),
            restaurantId: mongoose.Types.ObjectId(restaurant1._id),
            items,
            totalPrice,
            status: 'pending'
          });
        }
      }
    }

    // Order 2: User pertama memesan dari restoran kedua (jika ada)
    if (users.length > 0 && restaurants.length > 1) {
      const user1 = users[0];
      const restaurant2 = restaurants[1];
      
      if (restaurant2.menu && restaurant2.menu.length > 0) {
        const menuItems = restaurant2.menu.filter(m => m.isAvailable).slice(0, 1);
        if (menuItems.length > 0) {
          const items = menuItems.map(menu => ({
            menuId: mongoose.Types.ObjectId(menu._id),
            quantity: 1
          }));
          const totalPrice = items.reduce((sum, item) => {
            const menu = menuItems.find(m => m._id.toString() === item.menuId.toString());
            return sum + (menu.price * item.quantity);
          }, 0);

          orders.push({
            userId: mongoose.Types.ObjectId(user1._id || user1.id),
            restaurantId: mongoose.Types.ObjectId(restaurant2._id),
            items,
            totalPrice,
            status: 'paid'
          });
        }
      }
    }

    // Order 3: User kedua memesan dari restoran pertama (jika ada)
    if (users.length > 1 && restaurants.length > 0) {
      const user2 = users[1];
      const restaurant1 = restaurants[0];
      
      if (restaurant1.menu && restaurant1.menu.length > 0) {
        const menuItems = restaurant1.menu.filter(m => m.isAvailable).slice(0, 3);
        if (menuItems.length > 0) {
          const items = menuItems.map(menu => ({
            menuId: mongoose.Types.ObjectId(menu._id),
            quantity: 1
          }));
          const totalPrice = items.reduce((sum, item) => {
            const menu = menuItems.find(m => m._id.toString() === item.menuId.toString());
            return sum + (menu.price * item.quantity);
          }, 0);

          orders.push({
            userId: mongoose.Types.ObjectId(user2._id || user2.id),
            restaurantId: mongoose.Types.ObjectId(restaurant1._id),
            items,
            totalPrice,
            status: 'completed'
          });
        }
      }
    }

    // Order 4: User ketiga memesan dari restoran ketiga (jika ada)
    if (users.length > 2 && restaurants.length > 2) {
      const user3 = users[2];
      const restaurant3 = restaurants[2];
      
      if (restaurant3.menu && restaurant3.menu.length > 0) {
        const menuItems = restaurant3.menu.filter(m => m.isAvailable).slice(0, 2);
        if (menuItems.length > 0) {
          const items = menuItems.map(menu => ({
            menuId: mongoose.Types.ObjectId(menu._id),
            quantity: menuItems.indexOf(menu) === 0 ? 3 : 2
          }));
          const totalPrice = items.reduce((sum, item) => {
            const menu = menuItems.find(m => m._id.toString() === item.menuId.toString());
            return sum + (menu.price * item.quantity);
          }, 0);

          orders.push({
            userId: mongoose.Types.ObjectId(user3._id || user3.id),
            restaurantId: mongoose.Types.ObjectId(restaurant3._id),
            items,
            totalPrice,
            status: 'pending'
          });
        }
      }
    }

    // 6. Insert orders
    if (orders.length > 0) {
      await Order.insertMany(orders);
      console.log(`✅ Seeded ${orders.length} sample orders`);
      console.log(`   - ${orders.filter(o => o.status === 'pending').length} pending orders`);
      console.log(`   - ${orders.filter(o => o.status === 'paid').length} paid orders`);
      console.log(`   - ${orders.filter(o => o.status === 'completed').length} completed orders`);
    } else {
      console.warn('⚠️  No orders created. Check if users and restaurants have available menus.');
    }

  } catch (e) {
    console.error('❌ Seed error:', e.message);
    if (e.response) {
      console.error('   Response:', e.response.data);
    }
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();

