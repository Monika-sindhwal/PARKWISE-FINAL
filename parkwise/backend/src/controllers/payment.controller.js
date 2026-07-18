const crypto = require("crypto");
const Payment = require("../models/Payment");
const Booking = require("../models/Booking");
const getRazorpayInstance = require("../utils/razorpay");

// @route   POST /api/payments/create-order
// @access  Private (customer, must own the booking)
const createOrder = async (req, res, next) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ success: false, message: "bookingId is required" });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only pay for your own bookings",
      });
    }

    if (booking.paymentStatus === "paid") {
      return res.status(400).json({ success: false, message: "This booking is already paid" });
    }

    if (booking.bookingStatus === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cannot pay for a cancelled booking",
      });
    }

    const razorpay = getRazorpayInstance();
    const amountInPaise = Math.round(booking.totalAmount * 100);

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: booking._id.toString(),
    });

    const payment = await Payment.create({
      bookingId: booking._id,
      orderId: order.id,
      amount: booking.totalAmount,
      status: "created",
    });

    res.status(201).json({
      success: true,
      payment,
      razorpayOrder: order,
      // The frontend's Razorpay checkout widget needs this public key
      razorpayKeyId: process.env.RAZORPAY_KEY_ID || "mock_key_for_dev",
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/payments/verify
// @access  Private (customer)
// Verifies the payment signature Razorpay's checkout returns to the frontend.
// This is the step that actually proves the payment is genuine - never trust
// a "payment succeeded" claim from the frontend without this check.
const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message:
          "razorpay_order_id, razorpay_payment_id and razorpay_signature are required",
      });
    }

    const payment = await Payment.findOne({ orderId: razorpay_order_id });
    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment order not found" });
    }

    const booking = await Booking.findById(payment.bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only verify payment for your own bookings",
      });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET || "test_secret";
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      payment.status = "failed";
      await payment.save();

      return res.status(400).json({
        success: false,
        message: "Payment verification failed - signature mismatch",
      });
    }

    payment.status = "success";
    payment.transactionId = razorpay_payment_id;
    await payment.save();

    booking.paymentStatus = "paid";
    booking.bookingStatus = "confirmed";
    await booking.save();

    res.status(200).json({ success: true, payment, booking });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/payments/booking/:bookingId
// @access  Private (the booking's customer, the lot owner, or admin)
const getPaymentByBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.bookingId).populate(
      "parkingLotId",
      "ownerId"
    );
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const isCustomer = booking.userId.toString() === req.user._id.toString();
    const isLotOwner = booking.parkingLotId.ownerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isCustomer && !isLotOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view this payment",
      });
    }

    const payment = await Payment.findOne({ bookingId: booking._id }).sort({
      createdAt: -1,
    });

    if (!payment) {
      return res.status(404).json({ success: false, message: "No payment found for this booking" });
    }

    res.status(200).json({ success: true, payment });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  getPaymentByBooking,
};
