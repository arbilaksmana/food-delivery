const mongoose = require('mongoose');

const MenuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    isAvailable: { type: Boolean, default: true }
  },
  { _id: true, timestamps: true }
);

const RestaurantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, trim: true },
    menu: { type: [MenuItemSchema], default: [] }
  },
  { timestamps: true }
);

// index bantu lookup menu._id (order-service hitung totalPrice)
RestaurantSchema.index({ 'menu._id': 1 });

module.exports = mongoose.model('Restaurant', RestaurantSchema);
