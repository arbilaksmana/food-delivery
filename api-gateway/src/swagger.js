const swaggerJsdoc = require('swagger-jsdoc');

/**
 * Swagger configuration untuk API Gateway
 * Menggabungkan dokumentasi dari semua services
 */
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Food Delivery System API',
      version: '1.0.0',
      description: 'API Gateway - Unified API documentation for all microservices',
      contact: {
        name: 'API Support'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'API Gateway (Development)'
      }
    ],
    tags: [
      {
        name: 'Auth',
        description: 'User authentication endpoints (user-service)'
      },
      {
        name: 'Users',
        description: 'User management endpoints (user-service)'
      },
      {
        name: 'Restaurants',
        description: 'Restaurant and menu endpoints (restaurant-service)'
      },
      {
        name: 'Orders',
        description: 'Order management endpoints (order-service)'
      },
      {
        name: 'Gateway',
        description: 'API Gateway endpoints and information'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token obtained from /auth/login'
        }
      }
    }
  },
  apis: ['./src/index.js'] // Path untuk JSDoc comments
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

module.exports = swaggerSpec;

