const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    parkingLotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ParkingLot",
      required: true,
    },
    slotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ParkingSlot",
      required: true,
    },
    entryTime: {
      type: Date,
      required: [true, "Entry time is required"],
    },
    exitTime: {
      type: Date,
      required: [true, "Exit time is required"],
    },
    bookingStatus: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded"],
      default: "unpaid",
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    // Set the first time this booking's QR code is successfully scanned
    // at the parking entrance (see Module 5: QR Code)
    checkInTime: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Speeds up the overlap-check query (find bookings for a slot within a time range)
bookingSchema.index({ slotId: 1, entryTime: 1, exitTime: 1 });

module.exports = mongoose.model("Booking", bookingSchema);
