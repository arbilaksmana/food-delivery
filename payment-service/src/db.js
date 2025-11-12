const mongoose = require("mongoose");

const DEFAULT_URI = "mongodb://127.0.0.1:27017/food_payment";

async function connectDB(uri = process.env.MONGODB_URI || DEFAULT_URI) {
  try {
    await mongoose.connect(uri, { maxPoolSize: 10 });
    console.log("✅ MongoDB connected (payment-service)");
  } catch (e) {
    console.error("❌ MongoDB connection error:", e.message);
    process.exit(1);
  }
}

module.exports = { connectDB };
