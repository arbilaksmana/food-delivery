const mongoose = require("mongoose");

const OrderItemSchema = new mongoose.Schema(
  {
    menuId: { type: mongoose.Schema.Types.ObjectId, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
    items: { type: [OrderItemSchema], validate: (v) => v && v.length > 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    // tambahkan:
    paymentMethod: {
      type: String,
      enum: ["cod", "wallet", "bank_transfer", "qris"],
      required: false,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "cancelled", "refunded"],
      required: false,
    },
    notes: { type: String },
    status: {
      type: String,
      enum: ["pending", "paid", "cancelled", "completed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", OrderSchema);
