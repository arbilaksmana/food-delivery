require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const { authenticate, authorize } = require('./middleware/auth');

const app = express();

// Environment variables
const PORT = process.env.PORT || 3000;
const USER_SERVICE_TARGET = process.env.USER_SERVICE_TARGET || 'http://localhost:3001';
const RESTAURANT_SERVICE_TARGET = process.env.RESTAURANT_SERVICE_TARGET || 'http://localhost:3002';
const ORDER_SERVICE_TARGET = process.env.ORDER_SERVICE_TARGET || 'http://localhost:3003';

// Middleware
app.use(cors({
  // Echo back the request Origin so credentials can be used safely
  origin: (origin, callback) => callback(null, origin || true),
  credentials: true
}));
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    status: 'error',
    message: 'Too many requests from this IP, please try again later.'
  }
});
app.use(limiter);

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Check if API Gateway is running
 *     tags: [Gateway]
 *     responses:
 *       200:
 *         description: API Gateway is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 *                 service:
 *                   type: string
 *                   example: "api-gateway"
 */
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'api-gateway' });
});

/**
 * @openapi
 * /:
 *   get:
 *     summary: API Gateway root
 *     description: Welcome endpoint for API Gateway with service information
 *     tags: [Gateway]
 *     responses:
 *       200:
 *         description: API Gateway information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "Food Delivery System API Gateway"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 services:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: string
 *                       example: "http://localhost:3001"
 *                     restaurant:
 *                       type: string
 *                       example: "http://localhost:3002"
 *                     order:
 *                       type: string
 *                       example: "http://localhost:3003"
 *                 documentation:
 *                   type: string
 *                   example: "/api-docs"
 */
app.get('/', (_req, res) => {
  res.json({
    status: 'success',
    message: 'Food Delivery System API Gateway',
    version: '1.0.0',
    services: {
      user: USER_SERVICE_TARGET,
      restaurant: RESTAURANT_SERVICE_TARGET,
      order: ORDER_SERVICE_TARGET
    },
    documentation: '/api-docs'
  });
});

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Food Delivery System API Documentation'
}));

// Proxy configuration
const proxyOptions = {
  changeOrigin: true,
  timeout: 10000, // 10 seconds timeout
  proxyTimeout: 10000, // 10 seconds proxy timeout
  pathRewrite: {
    '^/auth': '', // Remove /auth prefix when forwarding to user-service
    '^/users': '', // Remove /users prefix (if needed)
  },
  onProxyReq: (proxyReq, req, res) => {
    // Forward original headers
    if (req.headers['content-type']) {
      proxyReq.setHeader('Content-Type', req.headers['content-type']);
    }
    // Set timeout on proxy request
    proxyReq.setTimeout(10000, () => {
      if (!res.headersSent) {
        res.status(504).json({
          status: 'error',
          message: 'Gateway timeout - Service did not respond in time'
        });
      }
    });
  },
  onProxyRes: (proxyRes, req, res) => {
    // Log successful proxy response
    console.log(`✅ ${req.method} ${req.path} → ${proxyRes.statusCode}`);
  },
  onError: (err, req, res) => {
    console.error(`❌ Proxy error for ${req.method} ${req.path}:`, err.message);
    
    if (!res.headersSent) {
      if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
        res.status(503).json({
          status: 'error',
          message: 'Service unavailable. Please check if the service is running.'
        });
      } else if (err.code === 'ECONNRESET') {
        res.status(502).json({
          status: 'error',
          message: 'Service connection reset'
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Service temporarily unavailable'
        });
      }
    }
  }
};

// Auth routes (user-service) - No authentication required
/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register new user
 *     description: Create a new user account. Proxy to user-service.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, address]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "password123"
 *               address:
 *                 type: string
 *                 example: "123 Main Street"
 *     responses:
 *       201:
 *         description: User created successfully
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
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     address:
 *                       type: string
 *       400:
 *         description: Bad request (validation error or email already exists)
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
 *                   example: "Email already exists"
 */
app.use('/auth/register', createProxyMiddleware({
  target: USER_SERVICE_TARGET,
  ...proxyOptions,
  pathRewrite: {
    '^/auth/register': '/users/register'
  }
}));

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Login user
 *     description: Authenticate user and receive JWT token. Proxy to user-service.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Login successful
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
 *                   properties:
 *                     token:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       401:
 *         description: Invalid credentials
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
 *                   example: "Invalid email or password"
 */
app.use('/auth/login', createProxyMiddleware({
  target: USER_SERVICE_TARGET,
  ...proxyOptions,
  pathRewrite: {
    '^/auth/login': '/users/login'
  }
}));

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     description: Logout endpoint. For JWT stateless authentication, client should remove token from storage after logout. Proxy to user-service.
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "Logout successful. Please remove token from client storage."
 *       500:
 *         description: Server error
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
 */
app.use('/auth/logout', createProxyMiddleware({
  target: USER_SERVICE_TARGET,
  ...proxyOptions,
  pathRewrite: {
    '^/auth/logout': '/users/logout'
  }
}));

// User routes (user-service) - No authentication required
/**
 * @openapi
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieve user information by user ID. Proxy to user-service.
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "507f1f77bcf86cd799439011"
 *         description: User ID (MongoDB ObjectId)
 *     responses:
 *       200:
 *         description: User found
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
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *                         address:
 *                           type: string
 *       404:
 *         description: User not found
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
 *                   example: "User not found"
 */
app.use('/users', createProxyMiddleware({
  target: USER_SERVICE_TARGET,
  ...proxyOptions,
  pathRewrite: {
    '^/users': '/users'
  }
}));

// Restaurant routes (restaurant-service)
/**
 * @openapi
 * /restaurants:
 *   get:
 *     summary: List all restaurants
 *     description: Get list of all restaurants with their menus. Proxy to restaurant-service.
 *     tags: [Restaurants]
 *     responses:
 *       200:
 *         description: List of restaurants
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       address:
 *                         type: string
 *                       menu:
 *                         type: array
 *                         items:
 *                           type: object
 */
/**
 * @openapi
 * /restaurants:
 *   post:
 *     summary: Create new restaurant
 *     description: Create a new restaurant with optional menu items. Proxy to restaurant-service.
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
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     address:
 *                       type: string
 *                     menu:
 *                       type: array
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
 * @openapi
 * /restaurants/{id}:
 *   get:
 *     summary: Get restaurant by ID
 *     description: Get restaurant details including full menu. Proxy to restaurant-service.
 *     tags: [Restaurants]
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
 *         description: Restaurant found
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
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     address:
 *                       type: string
 *                     menu:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           description:
 *                             type: string
 *                           price:
 *                             type: number
 *                           isAvailable:
 *                             type: boolean
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
 */
/**
 * @openapi
 * /restaurants/{id}/menu:
 *   post:
 *     summary: Add menu item to restaurant
 *     description: Add a new menu item to an existing restaurant. Proxy to restaurant-service. Requires admin authentication.
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
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     address:
 *                       type: string
 *                     menu:
 *                       type: array
 *                       items:
 *                         type: object
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
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       403:
 *         description: Forbidden (insufficient permissions - admin required)
 */
/**
 * @openapi
 * /restaurants/{id}:
 *   put:
 *     summary: Update restaurant
 *     description: Update restaurant information (name, address). Requires admin authentication. Proxy to restaurant-service.
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
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin required)
 */
/**
 * @openapi
 * /restaurants/{id}:
 *   delete:
 *     summary: Delete restaurant
 *     description: Delete a restaurant. Requires admin authentication. Proxy to restaurant-service.
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "Restaurant deleted successfully"
 *       404:
 *         description: Restaurant not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin required)
 */
/**
 * @openapi
 * /restaurants/{id}/menu:
 *   patch:
 *     summary: Update menu item
 *     description: Update an existing menu item in a restaurant. Requires admin authentication. Proxy to restaurant-service.
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
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin required)
 */
/**
 * @openapi
 * /restaurants/{id}/menu:
 *   delete:
 *     summary: Delete menu item
 *     description: Delete a menu item from a restaurant. Requires admin authentication. Proxy to restaurant-service.
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
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin required)
 */
// Admin protection for write operations on restaurants
app.use('/restaurants', (req, res, next) => {
  const writeMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (writeMethods.includes(req.method)) {
    return authenticate(req, res, () => authorize(['admin'])(req, res, next));
  }
  next();
}, createProxyMiddleware({
  target: RESTAURANT_SERVICE_TARGET,
  ...proxyOptions,
  pathRewrite: {
    '^/restaurants': '/restaurants'
  }
}));

// Order routes (order-service) - Requires authentication for user endpoints
/**
 * @openapi
 * /orders:
 *   post:
 *     summary: Create new order
 *     description: Create a new food order. Requires authentication. Proxy to order-service.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
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
 *                 description: User ID (MongoDB ObjectId)
 *               restaurantId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439012"
 *                 description: Restaurant ID (MongoDB ObjectId)
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required: [menuId, quantity]
 *                   properties:
 *                     menuId:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439013"
 *                       description: Menu item ID (MongoDB ObjectId)
 *                     quantity:
 *                       type: number
 *                       minimum: 1
 *                       example: 2
 *           examples:
 *             example1:
 *               summary: Single item order
 *               value:
 *                 userId: "507f1f77bcf86cd799439011"
 *                 restaurantId: "507f1f77bcf86cd799439012"
 *                 items:
 *                   - menuId: "507f1f77bcf86cd799439013"
 *                     quantity: 2
 *             example2:
 *               summary: Multiple items order
 *               value:
 *                 userId: "507f1f77bcf86cd799439011"
 *                 restaurantId: "507f1f77bcf86cd799439012"
 *                 items:
 *                   - menuId: "507f1f77bcf86cd799439013"
 *                     quantity: 2
 *                   - menuId: "507f1f77bcf86cd799439014"
 *                     quantity: 1
 *     responses:
 *       201:
 *         description: Order created successfully
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
 *                   properties:
 *                     order:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         userId:
 *                           type: string
 *                         restaurantId:
 *                           type: string
 *                         items:
 *                           type: array
 *                         totalPrice:
 *                           type: number
 *                         status:
 *                           type: string
 *                           example: "pending"
 *       400:
 *         description: Bad request (validation error, menu not available, etc.)
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
 *                   example: "Item menu tidak tersedia"
 *       401:
 *         description: Unauthorized (missing or invalid token)
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
 *                   example: "Authorization token required"
 */
/**
 * @openapi
 * /orders/user/{userId}:
 *   get:
 *     summary: Get orders by user ID
 *     description: Retrieve all orders for a specific user. Requires authentication. Proxy to order-service.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         example: "507f1f77bcf86cd799439011"
 *         description: User ID (MongoDB ObjectId)
 *     responses:
 *       200:
 *         description: List of user orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       userId:
 *                         type: string
 *                       restaurantId:
 *                         type: string
 *                       items:
 *                         type: array
 *                       totalPrice:
 *                         type: number
 *                       status:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       400:
 *         description: Bad request (invalid user ID format)
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
 *                   example: "Format user ID tidak valid"
 *       401:
 *         description: Unauthorized (missing or invalid token)
 */
app.use('/orders', authenticate, createProxyMiddleware({
  target: ORDER_SERVICE_TARGET,
  ...proxyOptions,
  pathRewrite: {
    '^/orders': '/orders'
  }
}));

// Admin routes for orders (list all, update status)
/**
 * @openapi
 * /orders/admin:
 *   get:
 *     summary: Get all orders (Admin only)
 *     description: Retrieve all orders with optional filters (status, restaurantId, userId). Requires admin authentication. Proxy to order-service. Endpoint: GET /orders/admin
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, paid, cancelled, completed]
 *         description: Filter by order status
 *         example: "pending"
 *       - in: query
 *         name: restaurantId
 *         schema:
 *           type: string
 *         description: Filter by restaurant ID
 *         example: "507f1f77bcf86cd799439012"
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: List of orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       userId:
 *                         type: string
 *                       restaurantId:
 *                         type: string
 *                       restaurantName:
 *                         type: string
 *                       items:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             menuId:
 *                               type: string
 *                             name:
 *                               type: string
 *                             quantity:
 *                               type: number
 *                             price:
 *                               type: number
 *                       totalPrice:
 *                         type: number
 *                       status:
 *                         type: string
 *                         enum: [pending, paid, cancelled, completed]
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       403:
 *         description: Forbidden (insufficient permissions - admin required)
 */
/**
 * @openapi
 * /orders/admin/{orderId}/status:
 *   patch:
 *     summary: Update order status (Admin only)
 *     description: Update the status of an order. Requires admin authentication. Proxy to order-service.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         example: "507f1f77bcf86cd799439014"
 *         description: Order ID (MongoDB ObjectId)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, paid, cancelled, completed]
 *                 example: "paid"
 *                 description: New order status
 *     responses:
 *       200:
 *         description: Order status updated successfully
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
 *                   properties:
 *                     order:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         status:
 *                           type: string
 *                           example: "paid"
 *       400:
 *         description: Bad request (invalid order ID format or invalid status)
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
 *                   example: "Status tidak valid"
 *       404:
 *         description: Order not found
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       403:
 *         description: Forbidden (insufficient permissions - admin required)
 */
app.use('/orders/admin', authenticate, authorize(['admin']), createProxyMiddleware({
  target: ORDER_SERVICE_TARGET,
  ...proxyOptions,
  pathRewrite: {
    '^/orders/admin': '/orders/admin'
  }
}));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Gateway error:', err);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Gateway running at http://localhost:${PORT}`);
  console.log(`📚 Swagger docs: http://localhost:${PORT}/api-docs`);
  console.log(`\nProxying to:`);
  console.log(`  - User Service: ${USER_SERVICE_TARGET}`);
  console.log(`  - Restaurant Service: ${RESTAURANT_SERVICE_TARGET}`);
  console.log(`  - Order Service: ${ORDER_SERVICE_TARGET}`);
});

