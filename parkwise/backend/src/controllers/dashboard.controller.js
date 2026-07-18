const User = require("../models/User");
const ParkingLot = require("../models/ParkingLot");
const ParkingSlot = require("../models/ParkingSlot");
const Booking = require("../models/Booking");

// @route   GET /api/dashboard/customer
// @access  Private (customer)
const getCustomerDashboard = async (req, res, next) => {
  try {
    const now = new Date();

    const upcomingBookings = await Booking.find({
      userId: req.user._id,
      bookingStatus: { $in: ["pending", "confirmed"] },
      entryTime: { $gte: now },
    })
      .populate("parkingLotId", "name city address")
      .populate("slotId", "slotNumber vehicleType")
      .sort({ entryTime: 1 });

    const bookingHistory = await Booking.find({
      userId: req.user._id,
      $or: [{ entryTime: { $lt: now } }, { bookingStatus: { $in: ["completed", "cancelled"] } }],
    })
      .populate("parkingLotId", "name city address")
      .populate("slotId", "slotNumber vehicleType")
      .sort({ entryTime: -1 });

    const paidBookings = await Booking.find({ userId: req.user._id, paymentStatus: "paid" });
    const totalSpent = paidBookings.reduce((sum, b) => sum + b.totalAmount, 0);

    res.status(200).json({
      success: true,
      upcomingBookings,
      bookingHistory,
      totalSpent,
      stats: {
        upcomingCount: upcomingBookings.length,
        historyCount: bookingHistory.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/dashboard/owner
// @access  Private (owner)
const getOwnerDashboard = async (req, res, next) => {
  try {
    const lots = await ParkingLot.find({ ownerId: req.user._id }).select("_id");
    const lotIds = lots.map((lot) => lot._id);

    const totalBookings = await Booking.countDocuments({ parkingLotId: { $in: lotIds } });

    const paidBookings = await Booking.find({
      parkingLotId: { $in: lotIds },
      paymentStatus: "paid",
    });
    const revenue = paidBookings.reduce((sum, b) => sum + b.totalAmount, 0);

    const availableSlots = await ParkingSlot.countDocuments({
      parkingLotId: { $in: lotIds },
      status: "available",
    });
    const occupiedSlots = await ParkingSlot.countDocuments({
      parkingLotId: { $in: lotIds },
      status: "occupied",
    });

    res.status(200).json({
      success: true,
      totalLots: lotIds.length,
      totalBookings,
      revenue,
      availableSlots,
      occupiedSlots,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/dashboard/admin
// @access  Private (admin)
const getAdminDashboard = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalParkingLots = await ParkingLot.countDocuments();
    const totalBookings = await Booking.countDocuments();

    const paidBookings = await Booking.find({ paymentStatus: "paid" });
    const totalRevenue = paidBookings.reduce((sum, b) => sum + b.totalAmount, 0);

    const lotsByStatusRaw = await ParkingLot.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const lotsByStatus = lotsByStatusRaw.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    const usersByRoleRaw = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]);
    const usersByRole = usersByRoleRaw.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      totalUsers,
      totalParkingLots,
      totalBookings,
      totalRevenue,
      lotsByStatus,
      usersByRole,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCustomerDashboard,
  getOwnerDashboard,
  getAdminDashboard,
};
