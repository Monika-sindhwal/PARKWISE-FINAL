const Booking = require("../models/Booking");
const ParkingSlot = require("../models/ParkingSlot");
const ParkingLot = require("../models/ParkingLot");

// Statuses that count as "the slot is actually reserved" for overlap checks.
// A cancelled booking should NOT block a new booking for that time.
const ACTIVE_STATUSES = ["pending", "confirmed"];

// @route   POST /api/bookings
// @access  Private (customer)
const createBooking = async (req, res, next) => {
  try {
    const { parkingLotId, slotId, entryTime, exitTime } = req.body;

    if (!parkingLotId || !slotId || !entryTime || !exitTime) {
      return res.status(400).json({
        success: false,
        message: "parkingLotId, slotId, entryTime and exitTime are required",
      });
    }

    const entry = new Date(entryTime);
    const exit = new Date(exitTime);

    if (isNaN(entry.getTime()) || isNaN(exit.getTime())) {
      return res.status(400).json({
        success: false,
        message: "entryTime and exitTime must be valid dates (ISO format)",
      });
    }

    if (exit <= entry) {
      return res.status(400).json({
        success: false,
        message: "exitTime must be after entryTime",
      });
    }

    if (entry < new Date()) {
      return res.status(400).json({
        success: false,
        message: "entryTime cannot be in the past",
      });
    }

    const slot = await ParkingSlot.findOne({ _id: slotId, parkingLotId });
    if (!slot) {
      return res.status(404).json({
        success: false,
        message: "Slot not found for this parking lot",
      });
    }

    if (slot.status === "maintenance") {
      return res.status(400).json({
        success: false,
        message: "This slot is under maintenance and cannot be booked",
      });
    }

    // Overlap check: does any active booking for this slot intersect the
    // requested [entry, exit) window?
    // Two ranges overlap when: existing.entryTime < newExit AND existing.exitTime > newEntry
    const overlapping = await Booking.findOne({
      slotId,
      bookingStatus: { $in: ACTIVE_STATUSES },
      entryTime: { $lt: exit },
      exitTime: { $gt: entry },
    });

    if (overlapping) {
      return res.status(409).json({
        success: false,
        message: "This slot is already booked for the selected time range",
      });
    }

    const durationHours = (exit - entry) / (1000 * 60 * 60);
    const totalAmount = Math.round(durationHours * slot.pricePerHour * 100) / 100;

    const booking = await Booking.create({
      userId: req.user._id,
      parkingLotId,
      slotId,
      entryTime: entry,
      exitTime: exit,
      totalAmount,
    });

    res.status(201).json({ success: true, booking });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/bookings/my
// @access  Private (customer)
const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ userId: req.user._id })
      .populate("parkingLotId", "name city address")
      .populate("slotId", "slotNumber vehicleType")
      .sort({ entryTime: -1 });

    res.status(200).json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/bookings/owner
// @access  Private (owner)
// Returns bookings across every parking lot this owner owns
const getOwnerBookings = async (req, res, next) => {
  try {
    const lots = await ParkingLot.find({ ownerId: req.user._id }).select("_id");
    const lotIds = lots.map((lot) => lot._id);

    const bookings = await Booking.find({ parkingLotId: { $in: lotIds } })
      .populate("userId", "name email phone")
      .populate("parkingLotId", "name city")
      .populate("slotId", "slotNumber vehicleType")
      .sort({ entryTime: -1 });

    res.status(200).json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/bookings/:id
// @access  Private (the customer who booked it, the owner of that lot, or admin)
const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("parkingLotId", "name city address ownerId")
      .populate("slotId", "slotNumber vehicleType pricePerHour");

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const isCustomer = booking.userId.toString() === req.user._id.toString();
    const isLotOwner =
      booking.parkingLotId.ownerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isCustomer && !isLotOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view this booking",
      });
    }

    res.status(200).json({ success: true, booking });
  } catch (error) {
    next(error);
  }
};

// @route   PATCH /api/bookings/:id/cancel
// @access  Private (the customer who made the booking)
const cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only cancel your own bookings",
      });
    }

    if (!ACTIVE_STATUSES.includes(booking.bookingStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a booking that is already '${booking.bookingStatus}'`,
      });
    }

    booking.bookingStatus = "cancelled";
    await booking.save();

    res.status(200).json({ success: true, booking });
  } catch (error) {
    next(error);
  }
};

// @route   PATCH /api/bookings/:id/status
// @access  Private (owner of the lot, or admin)
// Manual status control for now (e.g. confirming or completing a booking).
// Module 4 (Payment) will automate pending -> confirmed via a payment webhook.
const updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ["confirmed", "completed", "cancelled"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `status must be one of: ${allowedStatuses.join(", ")}`,
      });
    }

    const booking = await Booking.findById(req.params.id).populate(
      "parkingLotId",
      "ownerId"
    );

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const isLotOwner =
      booking.parkingLotId.ownerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isLotOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Only the lot owner or an admin can update this booking",
      });
    }

    booking.bookingStatus = status;
    await booking.save();

    res.status(200).json({ success: true, booking });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getOwnerBookings,
  getBookingById,
  cancelBooking,
  updateBookingStatus,
};
