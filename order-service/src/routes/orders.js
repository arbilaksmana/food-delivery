const express = require("express");
const axios = require("axios");
const mongoose = require("mongoose");
const Order = require("../models/Order");

const router = express.Router();
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://localhost:3001";
const RESTAURANT_SERVICE_URL = process.env.RESTAURANT_SERVICE_URL || "http://localhost:3002";

const ok = (data) => ({ status: 'success', data });
const fail = (message) => ({ status: 'error', message });

/**
 * @openapi
 * /orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, restaurantId, items]
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *               restaurantId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439012"
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     menuId:
 *                       type: string
 *                     quantity:
 *                       type: number
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Bad request (validation error, menu not available, etc.)
 */
router.post("/", async (req, res) => {
  try {
    const { userId, restaurantId, items } = req.body;

    // Validasi request body
    if (!userId || !restaurantId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json(fail("userId, restaurantId, dan items (array) harus diisi"));
    }

    // Validasi items
    for (const item of items) {
      if (!item.menuId || !item.quantity || item.quantity < 1) {
        return res.status(400).json(fail("Setiap item harus memiliki menuId dan quantity >= 1"));
      }
    }

    // 1️⃣ Validasi user
    try {
      const userRes = await axios.get(`${USER_SERVICE_URL}/users/${userId}`, {
        timeout: 5000
      });
      
      // User-service response: {status: "success", data: {user: {...}}}
      if (userRes.data?.status !== 'success' || !userRes.data?.data?.user) {
        return res.status(404).json(fail("User tidak ditemukan"));
      }
    } catch (err) {
      if (err.response?.status === 404) {
        return res.status(404).json(fail("User tidak ditemukan"));
      }
      console.error('Error calling user-service:', err.message);
      return res.status(500).json(fail("Gagal memvalidasi user. Service tidak tersedia"));
    }

    // 2️⃣ Ambil restoran & menu
    let restaurant;
    try {
      const restoRes = await axios.get(`${RESTAURANT_SERVICE_URL}/restaurants/${restaurantId}`, {
        timeout: 5000
      });
      
      // Restaurant-service response: {status: "success", data: restaurant}
      if (restoRes.data?.status !== 'success' || !restoRes.data?.data) {
        return res.status(404).json(fail("Restoran tidak ditemukan"));
      }
      restaurant = restoRes.data.data;
    } catch (err) {
      if (err.response?.status === 404) {
        return res.status(404).json(fail("Restoran tidak ditemukan"));
      }
      console.error('Error calling restaurant-service:', err.message);
      return res.status(500).json(fail("Gagal mengambil data restoran. Service tidak tersedia"));
    }

    // 3️⃣ Build menu map (konversi _id ke string untuk matching)
    const menuMap = new Map();
    if (restaurant.menu && Array.isArray(restaurant.menu)) {
      restaurant.menu.forEach(menu => {
        // Konversi _id ke string untuk matching (bisa ObjectId atau string)
        const menuIdStr = menu._id?.toString() || menu._id;
        menuMap.set(menuIdStr, menu);
      });
    }

    // 4️⃣ Validasi dan hitung total harga
    let totalPrice = 0;
    for (const item of items) {
      // Konversi menuId ke string untuk matching
      const menuIdStr = item.menuId?.toString() || item.menuId;
      const menu = menuMap.get(menuIdStr);
      
      if (!menu) {
        return res.status(400).json(fail(`Menu dengan ID ${menuIdStr} tidak ditemukan di restoran ini`));
      }
      
      if (!menu.isAvailable) {
        return res.status(400).json(fail(`Menu "${menu.name}" sedang tidak tersedia`));
      }
      
      totalPrice += menu.price * item.quantity;
    }

    // 5️⃣ Simpan order
    const order = await Order.create({
      userId: new mongoose.Types.ObjectId(userId),
      restaurantId: new mongoose.Types.ObjectId(restaurantId),
      items: items.map(item => ({
        menuId: new mongoose.Types.ObjectId(item.menuId),
        quantity: item.quantity
      })),
      totalPrice,
      status: "pending"
    });

    return res.status(201).json(ok({ order }));
  } catch (err) {
    console.error('Error creating order:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json(fail(err.message));
    }
    if (err.name === 'CastError') {
      return res.status(400).json(fail("Format ID tidak valid"));
    }
    return res.status(500).json(fail(err.message || "Terjadi kesalahan saat membuat order"));
  }
});

/**
 * @openapi
 * /orders/user/{userId}:
 *   get:
 *     summary: Get orders by user ID
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of orders
 *       400:
 *         description: Bad request
 */
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validasi ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json(fail("Format user ID tidak valid"));
    }

    const orders = await Order.find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .lean();

    return res.json(ok(orders));
  } catch (err) {
    console.error('Error fetching orders:', err);
    return res.status(500).json(fail(err.message || "Terjadi kesalahan saat mengambil order"));
  }
});

/**
 * Admin: list all orders with optional filters
 * Query: status, restaurantId, userId
 */
router.get("/admin", async (req, res) => {
  try {
    const { status, restaurantId, userId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (restaurantId && mongoose.Types.ObjectId.isValid(restaurantId)) {
      filter.restaurantId = new mongoose.Types.ObjectId(restaurantId);
    }
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      filter.userId = new mongoose.Types.ObjectId(userId);
    }
    const orders = await Order.find(filter).sort({ createdAt: -1 }).lean();
    return res.json(ok(orders));
  } catch (err) {
    console.error('Error fetching admin orders:', err);
    return res.status(500).json(fail(err.message || "Terjadi kesalahan saat mengambil order"));
  }
});

/**
 * Admin: update order status
 */
router.patch("/admin/:orderId/status", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json(fail("Format order ID tidak valid"));
    }
    const allowed = ["pending", "paid", "cancelled", "completed"];
    if (!allowed.includes(status)) {
      return res.status(400).json(fail("Status tidak valid"));
    }
    const updated = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    ).lean();
    if (!updated) {
      return res.status(404).json(fail("Order tidak ditemukan"));
    }
    return res.json(ok({ order: updated }));
  } catch (err) {
    console.error('Error updating order status:', err);
    return res.status(500).json(fail(err.message || "Terjadi kesalahan saat mengubah status order"));
  }
});

module.exports = router;
