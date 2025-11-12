require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { connectDB } = require('./db.js');

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

connectDB();

app.use("/api/payments", require("./routes/payments"));

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`payment-service on :${PORT}`));