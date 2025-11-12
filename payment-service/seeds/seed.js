require('dotenv').config();
const mongoose = require('mongoose');
const Payment = require("../src/models/Payment");

const { MONGODB_URI = 'mongodb://localhost:27017/restaurant_db' } = process.env;

(async () => {
  await mongoose.connect(MONGODB_URI, { autoIndex: true });
  await Payment.deleteMany({});
  await Payment.create([
    { orderId: "ORD-1", userId: "U1", amount: 25000, method: "cod", status: "pending" },
    { orderId: "ORD-2", userId: "U2", amount: 78000, method: "wallet", status: "paid" }
  ]);
  console.log("seeded");
  process.exit(0);
})();