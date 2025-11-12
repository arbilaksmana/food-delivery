const svc = require("../services/payment.service");

exports.create = async (req, res) => {
  try {
    const { orderId, userId, amount, method, currency, metadata } = req.body;
    const row = await svc.create({
      orderId,
      userId,
      amount,
      method,
      currency,
      metadata,
    });
    res.status(201).json({ message: "created", data: row });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { toStatus, metadata } = req.body; // "paid" | "failed" | "cancelled" | "refunded"
    const row = await svc.updateStatus({
      orderId: req.params.orderId,
      toStatus,
      metadata,
    });
    res.json({ message: "updated", data: row });
  } catch (e) {
    const code = e.code === "INVALID_TRANSITION" ? 409 : 400;
    res.status(code).json({ error: e.message });
  }
};

exports.detail = async (req, res) => {
  const row = await svc.getByOrderId(req.params.orderId);
  if (!row) return res.status(404).json({ error: "not_found" });
  res.json({ data: row });
};

exports.list = async (req, res) => {
  const { userId, status } = req.query;
  const q = {};
  if (userId) q.userId = userId;
  if (status) q.status = status;
  const rows = await svc.list(q);
  res.json({ data: rows });
};
