const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const authRoutes = require("./routes/auth.routes");
const parkingLotRoutes = require("./routes/parkingLot.routes");
const errorHandler = require("./middlewares/error.middleware");

const app = express();

// Core middleware
app.use(cors());
app.use(express.json());
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// Health check - useful to confirm the server is alive during testing
app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "ParkWise API is running" });
});

// Module routes
app.use("/api/auth", authRoutes);
app.use("/api/parking-lots", parkingLotRoutes);

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
