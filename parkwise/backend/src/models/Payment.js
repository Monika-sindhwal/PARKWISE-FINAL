const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    orderId: {
      type: String, // Razorpay order id (created before payment)
      required: true,
    },
    transactionId: {
      type: String, // Razorpay payment id (set only after successful payment)
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["razorpay"],
      default: "razorpay",
    },
    status: {
      type: String,
      enum: ["created", "success", "failed"],
      default: "created",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
