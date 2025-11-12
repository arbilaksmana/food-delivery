require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { connectDB } = require("./db.js");

const app = express();
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

connectDB();

app.get("/health", (_req, res) =>
  res.json({ status: "ok", service: "payment-service" })
);

// MOUNT ROUTER DI ROOT (pastikan path sama dengan nama file: ./routes/payment)
app.use("/", require("./routes/payment"));

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => console.log(`payment-service on :${PORT}`));
