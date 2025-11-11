require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { connectDB } = require('./db');
const restaurantsRouter = require('./routes/restaurants');

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// healthcheck
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Swagger setup
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: { title: 'Restaurant Service API', version: '1.0.0' }
  },
  apis: ['./src/routes/*.js']
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// routes
app.use('/restaurants', restaurantsRouter);

const { PORT = 3002, MONGODB_URI } = process.env;

(async () => {
  await connectDB(MONGODB_URI);
  app.listen(PORT, () => {
    console.log(`🚀 restaurant-service running at http://localhost:${PORT}`);
  });
})();
