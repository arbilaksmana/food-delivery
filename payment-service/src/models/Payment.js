const { Schema, model } = require("mongoose");

const PaymentSchema = new Schema({
  orderId: { type: String, required: true, index: true, unique: true },
  userId: { type: String, required: true, index: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: "IDR" },
  method: { type: String, enum: ["cod","wallet","bank_transfer","qris"], default: "cod" },
  status: {
    type: String,
    enum: ["pending","paid","failed","cancelled","refunded"],
    default: "pending",
    index: true
  },
  metadata: { type: Object }
}, { timestamps: true });

module.exports = model("Payment", PaymentSchema);
