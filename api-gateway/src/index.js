require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const { createProxyMiddleware } = require("http-proxy-middleware");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");
const { authenticate, authorize } = require("./middleware/auth");

const app = express();

// ENV
const PORT = process.env.PORT || 4000;
const USER_SERVICE_TARGET =
  process.env.USER_SERVICE_TARGET ||
  process.env.USER_SERVICE_URL ||
  "http://localhost:3001";
const RESTAURANT_SERVICE_TARGET =
  process.env.RESTAURANT_SERVICE_TARGET ||
  process.env.RESTAURANT_SERVICE_URL ||
  "http://localhost:3002";
const ORDER_SERVICE_TARGET =
  process.env.ORDER_SERVICE_TARGET ||
  process.env.ORDER_SERVICE_URL ||
  "http://localhost:3003";
const PAYMENT_SERVICE_TARGET =
  process.env.PAYMENT_SERVICE_TARGET ||
  process.env.PAYMENT_SERVICE_URL ||
  "http://localhost:3004";

// CORS
app.use(
  require("cors")({
    origin: [/^http:\/\/localhost:3000$/, /^http:\/\/192\.168\.\d+\.\d+:\d+$/],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Authorization"],
  })
);
app.options(/.*/, require("cors")());
app.use(morgan("dev"));
app.use(express.json());

// Rate limit
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 100,
//   message: {
//     status: "error",
//     message: "Too many requests from this IP, please try again later.",
//   },
// });
// app.use(limiter);

// Proxy options (DEKLARASIKAN SEBELUM DIPAKAI)
const proxyOptions = {
  changeOrigin: true,
  timeout: 10000,
  proxyTimeout: 10000,
  onProxyReq: (proxyReq, req, res) => {
    // teruskan header content-type
    if (req.headers["content-type"]) {
      proxyReq.setHeader("Content-Type", req.headers["content-type"]);
    }

    // >>> FIX: tulis ulang body jika sudah diparse oleh express.json()
    const hasBodyMethod = ["POST", "PUT", "PATCH"].includes(req.method);
    const isJSON = (req.headers["content-type"] || "").includes(
      "application/json"
    );
    if (hasBodyMethod && isJSON && req.body && Object.keys(req.body).length) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }

    proxyReq.setTimeout(10000, () => {
      if (!res.headersSent) {
        res.status(504).json({
          status: "error",
          message: "Gateway timeout - Service did not respond in time",
        });
      }
    });
  },
  onProxyRes: (proxyRes, req, _res) => {
    console.log(`✅ ${req.method} ${req.path} → ${proxyRes.statusCode}`);
  },
  onError: (err, req, res) => {
    console.error(`❌ Proxy error for ${req.method} ${req.path}:`, err.message);
    if (!res.headersSent) {
      if (err.code === "ECONNREFUSED" || err.code === "ETIMEDOUT") {
        res.status(503).json({
          status: "error",
          message:
            "Service unavailable. Please check if the service is running.",
        });
      } else if (err.code === "ECONNRESET") {
        res
          .status(502)
          .json({ status: "error", message: "Service connection reset" });
      } else {
        res.status(500).json({
          status: "error",
          message: "Service temporarily unavailable",
        });
      }
    }
  },
};

// Health + root
app.get("/health", (_req, res) =>
  res.json({ status: "ok", service: "api-gateway" })
);
app.get("/", (_req, res) =>
  res.json({
    status: "success",
    message: "Food Delivery System API Gateway",
    version: "1.0.0",
    services: {
      user: USER_SERVICE_TARGET,
      restaurant: RESTAURANT_SERVICE_TARGET,
      order: ORDER_SERVICE_TARGET,
      payment: PAYMENT_SERVICE_TARGET,
    },
    documentation: "/api-docs",
  })
);

const openapiSpec = {
  openapi: "3.0.0",
  info: {
    title: "Food Delivery – API Gateway",
    version: "1.0.0",
    description:
      "Dokumentasi OpenAPI untuk API Gateway yang mem-proxy ke user-service, restaurant-service, order-service, dan payment-service.",
  },
  servers: [{ url: `http://localhost:${PORT}`, description: "Local gateway" }],
  tags: [
    { name: "Gateway", description: "Health & root" },
    { name: "Auth", description: "Registrasi, login, logout" },
    { name: "Users", description: "User passthrough" },
    { name: "Restaurants", description: "CRUD restoran & menu" },
    { name: "Orders", description: "Pemesanan pengguna & admin" },
    { name: "Payments", description: "Pembayaran" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      // Shared
      ApiStatus: {
        type: "object",
        properties: {
          status: { type: "string", example: "success" },
          message: { type: "string", example: "OK" },
        },
      },
      // Users/Auth
      User: {
        type: "object",
        properties: {
          _id: { type: "string" },
          name: { type: "string" },
          email: { type: "string" },
          address: { type: "string" },
          role: { type: "string", enum: ["user", "admin"] },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      RegisterRequest: {
        type: "object",
        required: ["name", "email", "password", "address"],
        properties: {
          name: { type: "string", example: "John Doe" },
          email: { type: "string", format: "email", example: "john@example.com" },
          password: { type: "string", format: "password", example: "password123" },
          address: { type: "string", example: "Bandung" },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "john@example.com" },
          password: { type: "string", format: "password", example: "password123" },
        },
      },
      LoginResponse: {
        type: "object",
        properties: {
          status: { type: "string", example: "success" },
          data: {
            type: "object",
            properties: { token: { type: "string", example: "eyJhbGciOi..." } },
          },
        },
      },
      // Restaurants
      MenuItem: {
        type: "object",
        properties: {
          _id: { type: "string" },
          name: { type: "string" },
          description: { type: "string" },
          price: { type: "number", minimum: 0 },
          isAvailable: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Restaurant: {
        type: "object",
        properties: {
          _id: { type: "string" },
          name: { type: "string" },
          address: { type: "string" },
          menu: { type: "array", items: { $ref: "#/components/schemas/MenuItem" } },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      RestaurantCreateRequest: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", example: "Warung Sederhana" },
          address: { type: "string", example: "Bandung" },
          menu: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string", example: "Nasi Goreng" },
                description: { type: "string", example: "Pedas" },
                price: { type: "number", example: 18000 },
                isAvailable: { type: "boolean", example: true },
              },
            },
          },
        },
      },
      MenuUpsertRequest: {
        type: "object",
        properties: {
          itemId: { type: "string", description: "Wajib untuk PATCH/DELETE" },
          name: { type: "string" },
          description: { type: "string" },
          price: { type: "number", minimum: 0 },
          isAvailable: { type: "boolean" },
        },
      },
      // Orders
      OrderItem: {
        type: "object",
        required: ["menuId", "quantity"],
        properties: {
          menuId: { type: "string" },
          quantity: { type: "number", minimum: 1 },
          name: { type: "string" },
          price: { type: "number" },
          description: { type: "string" },
        },
      },
      Order: {
        type: "object",
        properties: {
          _id: { type: "string" },
          userId: { type: "string" },
          restaurantId: { type: "string" },
          restaurantName: { type: "string" },
          items: { type: "array", items: { $ref: "#/components/schemas/OrderItem" } },
          totalPrice: { type: "number" },
          status: { type: "string", enum: ["pending", "paid", "cancelled", "completed"] },
          paymentMethod: { type: "string", example: "wallet" },
          paymentStatus: { type: "string", example: "pending" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      OrderCreateRequest: {
        type: "object",
        required: ["userId", "restaurantId", "items"],
        properties: {
          userId: { type: "string" },
          restaurantId: { type: "string" },
          items: { type: "array", items: { $ref: "#/components/schemas/OrderItem" } },
          notes: { type: "string" },
          paymentMethod: {
            type: "string",
            description: "Metode pembayaran pilihan user",
            example: "wallet",
          },
        },
      },
      OrderStatusUpdateRequest: {
        type: "object",
        required: ["status"],
        properties: {
          status: { type: "string", enum: ["pending", "paid", "cancelled", "completed"] },
        },
      },
      // Payments
      Payment: {
        type: "object",
        properties: {
          _id: { type: "string" },
          orderId: { type: "string" },
          userId: { type: "string" },
          amount: { type: "number" },
          currency: { type: "string", example: "IDR" },
          method: { type: "string", enum: ["cod", "wallet", "bank_transfer", "qris"], example: "wallet" },
          status: { type: "string", enum: ["pending", "paid", "failed", "cancelled", "refunded"], example: "pending" },
          metadata: { type: "object", additionalProperties: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      PaymentCreateRequest: {
        type: "object",
        required: ["orderId", "userId", "amount", "method"],
        properties: {
          orderId: { type: "string" },
          userId: { type: "string" },
          amount: { type: "number", example: 45000 },
          method: { type: "string", enum: ["cod", "wallet", "bank_transfer", "qris"], example: "wallet" },
          currency: { type: "string", example: "IDR" },
          metadata: { type: "object", additionalProperties: true },
        },
      },
      PaymentStatusUpdateRequest: {
        type: "object",
        required: ["toStatus"],
        properties: {
          toStatus: { type: "string", enum: ["paid", "failed", "cancelled", "refunded"], example: "paid" },
          metadata: { type: "object", additionalProperties: true },
        },
      },
    },
  },
  paths: {
    // Gateway
    "/health": {
      get: {
        tags: ["Gateway"],
        summary: "Health check",
        responses: {
          200: { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiStatus" } } } },
        },
      },
    },
    "/": {
      get: {
        tags: ["Gateway"],
        summary: "Root info",
        responses: {
          200: {
            description: "Gateway info",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string" },
                    message: { type: "string" },
                    version: { type: "string" },
                    services: { type: "object" },
                    documentation: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    // Auth
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/RegisterRequest" } } },
        },
        responses: { 201: { description: "Created" }, 400: { description: "Bad request" } },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/LoginRequest" } } },
        },
        responses: {
          200: { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/LoginResponse" } } } },
          401: { description: "Invalid credentials" },
        },
      },
    },
    "/auth/logout": { post: { tags: ["Auth"], summary: "Logout", responses: { 200: { description: "OK" } } } },
    // Users
    "/users/{id}": {
      get: {
        tags: ["Users"],
        summary: "Get user by ID",
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } } },
          404: { description: "Not found" },
        },
      },
    },
    // Restaurants
    "/restaurants": {
      get: {
        tags: ["Restaurants"],
        summary: "List restaurants",
        responses: {
          200: {
            description: "OK",
            content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Restaurant" } } } },
          },
        },
      },
      post: {
        tags: ["Restaurants"],
        summary: "Create restaurant (admin)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/RestaurantCreateRequest" } } },
        },
        responses: { 201: { description: "Created" }, 401: { description: "Unauthorized" }, 403: { description: "Forbidden" } },
      },
    },
    "/restaurants/{id}": {
      get: {
        tags: ["Restaurants"],
        summary: "Get restaurant detail",
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/Restaurant" } } } },
          404: { description: "Not found" },
        },
      },
      put: {
        tags: ["Restaurants"],
        summary: "Update restaurant (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", properties: { name: { type: "string" }, address: { type: "string" } } } } },
        },
        responses: { 200: { description: "OK" }, 401: { description: "Unauthorized" }, 403: { description: "Forbidden" }, 404: { description: "Not found" } },
      },
      delete: {
        tags: ["Restaurants"],
        summary: "Delete restaurant (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Deleted" }, 401: { description: "Unauthorized" }, 403: { description: "Forbidden" }, 404: { description: "Not found" } },
      },
    },
    "/restaurants/{id}/menu": {
      post: {
        tags: ["Restaurants"],
        summary: "Add menu item (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "price"],
                properties: { name: { type: "string" }, description: { type: "string" }, price: { type: "number" }, isAvailable: { type: "boolean" } },
              },
            },
          },
        },
        responses: { 201: { description: "Created" }, 401: { description: "Unauthorized" }, 403: { description: "Forbidden" }, 404: { description: "Restaurant not found" } },
      },
      patch: {
        tags: ["Restaurants"],
        summary: "Update menu item (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/MenuUpsertRequest" } } } },
        responses: { 200: { description: "OK" }, 401: { description: "Unauthorized" }, 403: { description: "Forbidden" }, 404: { description: "Restaurant/menu item not found" } },
      },
      delete: {
        tags: ["Restaurants"],
        summary: "Delete menu item (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", required: ["itemId"], properties: { itemId: { type: "string" } } } } },
        },
        responses: { 200: { description: "Deleted" }, 401: { description: "Unauthorized" }, 403: { description: "Forbidden" }, 404: { description: "Restaurant/menu item not found" } },
      },
    },
    // Orders
    "/orders": {
      post: {
        tags: ["Orders"],
        summary: "Create order",
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/OrderCreateRequest" } } } },
        responses: {
          201: { description: "Created", content: { "application/json": { schema: { $ref: "#/components/schemas/Order" } } } },
          400: { description: "Bad request" },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/orders/user/{userId}": {
      get: {
        tags: ["Orders"],
        summary: "List orders by user",
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "userId", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "OK", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Order" } } } } },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/orders/{id}/status": {
      patch: {
        tags: ["Orders"],
        summary: "Update order status (user/admin)",
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/OrderStatusUpdateRequest" } } } },
        responses: { 200: { description: "OK" }, 400: { description: "Bad request" }, 401: { description: "Unauthorized" }, 404: { description: "Not found" } },
      },
    },
    // Orders admin
    "/orders/admin": {
      get: {
        tags: ["Orders"],
        summary: "List all orders (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: "query", name: "status", schema: { type: "string", enum: ["pending", "paid", "cancelled", "completed"] } },
          { in: "query", name: "restaurantId", schema: { type: "string" } },
          { in: "query", name: "userId", schema: { type: "string" } },
        ],
        responses: {
          200: { description: "OK", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Order" } } } } },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
        },
      },
    },
    "/orders/admin/{orderId}/status": {
      patch: {
        tags: ["Orders"],
        summary: "Update order status (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "orderId", required: true, schema: { type: "string" } }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/OrderStatusUpdateRequest" } } } },
        responses: { 200: { description: "OK" }, 400: { description: "Bad request" }, 401: { description: "Unauthorized" }, 403: { description: "Forbidden" }, 404: { description: "Not found" } },
      },
    },
    // Payments
    "/payments": {
      get: {
        tags: ["Payments"],
        summary: "List payments",
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: "query", name: "userId", schema: { type: "string" } },
          { in: "query", name: "status", schema: { type: "string", enum: ["pending", "paid", "failed", "cancelled", "refunded"] } },
        ],
        responses: {
          200: { description: "OK", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Payment" } } } } },
          401: { description: "Unauthorized" },
        },
      },
      post: {
        tags: ["Payments"],
        summary: "Create/init payment",
        description: "Membuat payment dengan status awal `pending`.",
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/PaymentCreateRequest" } } } },
        responses: {
          201: { description: "Created", content: { "application/json": { schema: { $ref: "#/components/schemas/Payment" } } } },
          400: { description: "Bad request" },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/payments/{orderId}": {
      get: {
        tags: ["Payments"],
        summary: "Payment detail by orderId",
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "orderId", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/Payment" } } } },
          404: { description: "Not found" },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/payments/{orderId}/status": {
      patch: {
        tags: ["Payments"],
        summary: "Update payment status",
        description: "Transisi valid: pending→(paid|failed|cancelled), paid→refunded.",
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "orderId", required: true, schema: { type: "string" } }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/PaymentStatusUpdateRequest" } } } },
        responses: { 200: { description: "OK" }, 400: { description: "Bad request" }, 401: { description: "Unauthorized" }, 404: { description: "Not found" }, 409: { description: "Invalid transition" } },
      },
    },
  },
};

// Ganti bagian Swagger lama dengan ini:
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(openapiSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Food Delivery – API Gateway",
  })
);

// Payments
app.use(
  '/payments',
  authenticate,
  createProxyMiddleware({
    target: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3004',
    ...proxyOptions,
    pathRewrite: { '^/payments': '' } // /payments -> /
  })
);


// Auth → user-service
app.use(
  "/auth/register",
  createProxyMiddleware({
    target: USER_SERVICE_TARGET,
    ...proxyOptions,
    pathRewrite: { "^/auth/register": "/users/register" },
  })
);
app.use(
  "/auth/login",
  createProxyMiddleware({
    target: USER_SERVICE_TARGET,
    ...proxyOptions,
    pathRewrite: { "^/auth/login": "/users/login" },
  })
);
app.use(
  "/auth/logout",
  createProxyMiddleware({
    target: USER_SERVICE_TARGET,
    ...proxyOptions,
    pathRewrite: { "^/auth/logout": "/users/logout" },
  })
);

// Users passthrough
app.use(
  "/users",
  createProxyMiddleware({
    target: USER_SERVICE_TARGET,
    ...proxyOptions,
    pathRewrite: { "^/users": "/users" },
  })
);

// Restaurants (write = admin)
app.use(
  "/restaurants",
  (req, res, next) => {
    const write = ["POST", "PUT", "PATCH", "DELETE"];
    if (write.includes(req.method))
      return authenticate(req, res, () => authorize(["admin"])(req, res, next));
    next();
  },
  createProxyMiddleware({
    target: RESTAURANT_SERVICE_TARGET,
    ...proxyOptions,
    pathRewrite: { "^/restaurants": "/restaurants" },
  })
);

// Orders (user must auth)
app.use(
  "/orders",
  authenticate,
  createProxyMiddleware({
    target: ORDER_SERVICE_TARGET,
    ...proxyOptions,
    pathRewrite: { "^/orders": "/orders" },
  })
);

// Orders admin
app.use(
  "/orders/admin",
  authenticate,
  authorize(["admin"]),
  createProxyMiddleware({
    target: ORDER_SERVICE_TARGET,
    ...proxyOptions,
    pathRewrite: { "^/orders/admin": "/orders/admin" },
  })
);

// 404
app.use((_req, res) =>
  res.status(404).json({ status: "error", message: "Route not found" })
);

app.use(
  "/orders/:id/status",
  authenticate,
  createProxyMiddleware({
    target: ORDER_SERVICE_TARGET,
    changeOrigin: true,
    pathRewrite: { "^/orders": "/orders" },
  })
)


// Error handler
app.use((err, _req, res, _next) => {
  console.error("Gateway error:", err);
  res
    .status(err.status || 500)
    .json({ status: "error", message: err.message || "Internal server error" });
});

// Start
app.listen(PORT, () => {
  console.log(`🚀 API Gateway running at http://localhost:${PORT}`);
  console.log(`📚 Swagger docs: http://localhost:${PORT}/api-docs`);
  console.log(`  - User Service: ${USER_SERVICE_TARGET}`);
  console.log(`  - Restaurant Service: ${RESTAURANT_SERVICE_TARGET}`);
  console.log(`  - Order Service: ${ORDER_SERVICE_TARGET}`);
  console.log(`  - Payment Service: ${PAYMENT_SERVICE_TARGET}`);
});
