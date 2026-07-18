const express = require("express");
const router = express.Router();

const {
  createOrder,
  verifyPayment,
  getPaymentByBooking,
} = require("../controllers/payment.controller");

const protect = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/role.middleware");

router.post("/create-order", protect, authorize("customer"), createOrder);
router.post("/verify", protect, authorize("customer"), verifyPayment);
router.get("/booking/:bookingId", protect, getPaymentByBooking);

module.exports = router;
