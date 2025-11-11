const express = require('express');
const Restaurant = require('../models/Restaurant');
const router = express.Router();

const ok = (data) => ({ status: 'success', data });
const fail = (message) => ({ status: 'error', message });

/**
 * @openapi
 * /restaurants:
 *   get:
 *     summary: List restaurants
 *     responses:
 *       200:
 *         description: Success
 */
/**
 * GET /restaurants
 * List semua restoran
 */
router.get('/', async (_req, res) => {
  try {
    const data = await Restaurant.find().lean();
    res.json(ok(data));
  } catch (e) {
    res.status(500).json(fail(e.message));
  }
});

/**
 * @openapi
 * /restaurants/{id}:
 *   get:
 *     summary: Get restaurant by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: Restaurant not found
 */
/**
 * GET /restaurants/:id
 * Detail restoran (termasuk menu[])
 */
router.get('/:id', async (req, res) => {
  try {
    const data = await Restaurant.findById(req.params.id).lean();
    if (!data) return res.status(404).json(fail('Restaurant not found'));
    res.json(ok(data));
  } catch (e) {
    res.status(500).json(fail(e.message));
  }
});

/**
 * @openapi
 * /restaurants:
 *   post:
 *     summary: Create restaurant
 *     tags: [Restaurants]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Warung Sederhana"
 *               address:
 *                 type: string
 *                 example: "Bandung"
 *               menu:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "Nasi Goreng"
 *                     description:
 *                       type: string
 *                       example: "Pedas"
 *                     price:
 *                       type: number
 *                       minimum: 0
 *                       example: 18000
 *                     isAvailable:
 *                       type: boolean
 *                       example: true
 *                 example: []
 *           examples:
 *             minimal:
 *               summary: Minimal example (name only)
 *               value:
 *                 name: "Warung Sederhana"
 *                 address: "Bandung"
 *             withMenu:
 *               summary: With menu items
 *               value:
 *                 name: "Warung Sederhana"
 *                 address: "Bandung"
 *                 menu:
 *                   - name: "Nasi Goreng"
 *                     description: "Pedas"
 *                     price: 18000
 *                     isAvailable: true
 *                   - name: "Mie Goreng"
 *                     description: "Jawa"
 *                     price: 17000
 *                     isAvailable: true
 *     responses:
 *       201:
 *         description: Restaurant created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad request (validation error)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "Validation error message"
 */
/**
 * POST /restaurants
 * Tambah restoran (opsional: admin/seed)
 */
router.post('/', async (req, res) => {
  try {
    const doc = await Restaurant.create(req.body);
    res.status(201).json(ok(doc));
  } catch (e) {
    res.status(400).json(fail(e.message));
  }
});

// Menu routes - Must be defined BEFORE /:id routes to avoid route conflicts
/**
 * @openapi
 * /restaurants/{id}/menu:
 *   post:
 *     summary: Add menu item to restaurant
 *     tags: [Restaurants]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "507f1f77bcf86cd799439011"
 *         description: Restaurant ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, price]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Nasi Goreng"
 *               description:
 *                 type: string
 *                 example: "Pedas"
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 example: 18000
 *               isAvailable:
 *                 type: boolean
 *                 default: true
 *                 example: true
 *           examples:
 *             minimal:
 *               summary: Minimal example (name and price only)
 *               value:
 *                 name: "Nasi Goreng"
 *                 price: 18000
 *             complete:
 *               summary: Complete example
 *               value:
 *                 name: "Nasi Goreng"
 *                 description: "Pedas"
 *                 price: 18000
 *                 isAvailable: true
 *     responses:
 *       201:
 *         description: Menu item added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *       404:
 *         description: Restaurant not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "Restaurant not found"
 *       400:
 *         description: Bad request (validation error)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "Validation error message"
 */
/**
 * POST /restaurants/:id/menu
 * Tambah item menu (opsional: admin/seed)
 */
router.post('/:id/menu', async (req, res) => {
  try {
    const { name, description, price, isAvailable } = req.body;
    const r = await Restaurant.findById(req.params.id);
    if (!r) return res.status(404).json(fail('Restaurant not found'));

    r.menu.push({ name, description, price, isAvailable });
    await r.save();

    res.status(201).json(ok(r));
  } catch (e) {
    res.status(400).json(fail(e.message));
  }
});

/**
 * @openapi
 * /restaurants/{id}/menu:
 *   patch:
 *     summary: Update menu item
 *     description: Update an existing menu item in a restaurant. Requires admin authentication.
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "507f1f77bcf86cd799439011"
 *         description: Restaurant ID (MongoDB ObjectId)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [itemId]
 *             properties:
 *               itemId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439012"
 *                 description: Menu item ID to update
 *               name:
 *                 type: string
 *                 example: "Nasi Goreng Spesial"
 *               description:
 *                 type: string
 *                 example: "Extra pedas"
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 example: 20000
 *               isAvailable:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Menu item updated successfully
 *       404:
 *         description: Restaurant or menu item not found
 *       400:
 *         description: Bad request (validation error)
 */
/**
 * PATCH /restaurants/:id/menu
 * Update item menu
 */
router.patch('/:id/menu', async (req, res) => {
  try {
    const { itemId, name, description, price, isAvailable } = req.body;
    if (!itemId) return res.status(400).json(fail('itemId is required'));

    const r = await Restaurant.findById(req.params.id);
    if (!r) return res.status(404).json(fail('Restaurant not found'));

    const menuItem = r.menu.id(itemId);
    if (!menuItem) return res.status(404).json(fail('Menu item not found'));

    if (name !== undefined) menuItem.name = name;
    if (description !== undefined) menuItem.description = description;
    if (price !== undefined) menuItem.price = price;
    if (isAvailable !== undefined) menuItem.isAvailable = isAvailable;

    await r.save();
    res.json(ok(r));
  } catch (e) {
    res.status(400).json(fail(e.message));
  }
});

/**
 * @openapi
 * /restaurants/{id}/menu:
 *   delete:
 *     summary: Delete menu item
 *     description: Delete a menu item from a restaurant. Requires admin authentication.
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "507f1f77bcf86cd799439011"
 *         description: Restaurant ID (MongoDB ObjectId)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [itemId]
 *             properties:
 *               itemId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439012"
 *                 description: Menu item ID to delete
 *     responses:
 *       200:
 *         description: Menu item deleted successfully
 *       404:
 *         description: Restaurant or menu item not found
 *       400:
 *         description: Bad request (itemId required)
 */
/**
 * DELETE /restaurants/:id/menu
 * Hapus item menu
 */
router.delete('/:id/menu', async (req, res) => {
  try {
    const { itemId } = req.body;
    if (!itemId) return res.status(400).json(fail('itemId is required'));

    const r = await Restaurant.findById(req.params.id);
    if (!r) return res.status(404).json(fail('Restaurant not found'));

    const menuItem = r.menu.id(itemId);
    if (!menuItem) return res.status(404).json(fail('Menu item not found'));

    menuItem.deleteOne();
    await r.save();
    res.json(ok(r));
  } catch (e) {
    res.status(400).json(fail(e.message));
  }
});

// Restaurant CRUD routes - Must be defined AFTER menu routes
/**
 * @openapi
 * /restaurants/{id}:
 *   put:
 *     summary: Update restaurant
 *     description: Update restaurant information (name, address). Requires admin authentication.
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "507f1f77bcf86cd799439011"
 *         description: Restaurant ID (MongoDB ObjectId)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Warung Sederhana Updated"
 *               address:
 *                 type: string
 *                 example: "Jakarta"
 *     responses:
 *       200:
 *         description: Restaurant updated successfully
 *       404:
 *         description: Restaurant not found
 *       400:
 *         description: Bad request (validation error)
 */
/**
 * PUT /restaurants/:id
 * Update restoran
 */
router.put('/:id', async (req, res) => {
  try {
    const { name, address } = req.body;
    const r = await Restaurant.findByIdAndUpdate(
      req.params.id,
      { name, address },
      { new: true, runValidators: true }
    );
    if (!r) return res.status(404).json(fail('Restaurant not found'));
    res.json(ok(r));
  } catch (e) {
    res.status(400).json(fail(e.message));
  }
});

/**
 * @openapi
 * /restaurants/{id}:
 *   delete:
 *     summary: Delete restaurant
 *     description: Delete a restaurant. Requires admin authentication.
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "507f1f77bcf86cd799439011"
 *         description: Restaurant ID (MongoDB ObjectId)
 *     responses:
 *       200:
 *         description: Restaurant deleted successfully
 *       404:
 *         description: Restaurant not found
 */
/**
 * DELETE /restaurants/:id
 * Hapus restoran
 */
router.delete('/:id', async (req, res) => {
  try {
    const r = await Restaurant.findByIdAndDelete(req.params.id);
    if (!r) return res.status(404).json(fail('Restaurant not found'));
    res.json(ok({ message: 'Restaurant deleted successfully' }));
  } catch (e) {
    res.status(500).json(fail(e.message));
  }
});

module.exports = router;
