const Payment = require("../models/Payment");

// Graf transisi yang diizinkan
const ALLOWED = {
  pending: new Set(["paid", "failed", "cancelled"]),
  paid: new Set(["refunded"]),
  failed: new Set([]),
  cancelled: new Set([]),
  refunded: new Set([]),
};

exports.create = async ({
  orderId,
  userId,
  amount,
  method = "cod",
  currency = "IDR",
  metadata,
}) => {
  const exists = await Payment.findOne({ orderId });
  if (exists) return exists;
  return Payment.create({
    orderId,
    userId,
    amount,
    method,
    currency,
    metadata,
    status: "pending",
  });
};

exports.updateStatus = async ({ orderId, toStatus, metadata }) => {
  const row = await Payment.findOne({ orderId });
  if (!row) throw new Error("payment_not_found");

  const from = row.status;
  if (!ALLOWED[from]?.has(toStatus)) {
    const msg = `invalid_transition:${from}->${toStatus}`;
    const err = new Error(msg);
    err.code = "INVALID_TRANSITION";
    throw err;
  }
  row.status = toStatus;
  if (metadata) row.metadata = { ...(row.metadata || {}), ...metadata };
  await row.save();
  return row;
};

exports.getByOrderId = (orderId) => Payment.findOne({ orderId });
exports.list = (q = {}) => Payment.find(q).sort({ createdAt: -1 });
