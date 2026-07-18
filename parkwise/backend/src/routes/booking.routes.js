const express = require("express");
const router = express.Router();

const {
  createBooking,
  getMyBookings,
  getOwnerBookings,
  getBookingById,
  cancelBooking,
  updateBookingStatus,
} = require("../controllers/booking.controller");

const protect = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/role.middleware");

// Specific routes before /:id
router.get("/my", protect, authorize("customer"), getMyBookings);
router.get("/owner", protect, authorize("owner"), getOwnerBookings);

router.post("/", protect, authorize("customer"), createBooking);
router.get("/:id", protect, getBookingById);
router.patch("/:id/cancel", protect, authorize("customer"), cancelBooking);
router.patch("/:id/status", protect, authorize("owner", "admin"), updateBookingStatus);

module.exports = router;
