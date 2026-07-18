const ParkingLot = require("../models/ParkingLot");
const ParkingSlot = require("../models/ParkingSlot");

// @route   POST /api/parking-lots
// @access  Private (owner)
const createParkingLot = async (req, res, next) => {
  try {
    const {
      name,
      address,
      city,
      lat,
      lng,
      openingTime,
      closingTime,
      totalFloors,
    } = req.body;

    if (!name || !address || !city || !openingTime || !closingTime) {
      return res.status(400).json({
        success: false,
        message:
          "name, address, city, openingTime and closingTime are required",
      });
    }

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({
        success: false,
        message: "lat and lng are required so customers can find this lot nearby",
      });
    }

    const lot = await ParkingLot.create({
      name,
      address,
      city,
      location: {
        type: "Point",
        coordinates: [lng, lat], // GeoJSON order: [longitude, latitude]
      },
      openingTime,
      closingTime,
      totalFloors,
      ownerId: req.user._id,
      status: "pending", // every new lot needs admin approval first
    });

    res.status(201).json({ success: true, parkingLot: lot });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/parking-lots
// @access  Public
// Supports ?city=  and ?search= (matches name) - only shows approved lots
const getAllParkingLots = async (req, res, next) => {
  try {
    const { city, search } = req.query;
    const filter = { status: "approved" };

    if (city) filter.city = new RegExp(`^${city}$`, "i");
    if (search) filter.name = new RegExp(search, "i");

    const lots = await ParkingLot.find(filter).sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: lots.length, parkingLots: lots });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/parking-lots/nearby?lat=..&lng=..&radius=..
// @access  Public
// radius is in kilometers (defaults to 5km). Returns approved lots only,
// automatically sorted nearest-first by MongoDB.
const getNearbyParkingLots = async (req, res, next) => {
  try {
    const { lat, lng, radius } = req.query;

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({
        success: false,
        message: "lat and lng query params are required, e.g. ?lat=30.90&lng=75.85",
      });
    }

    const radiusInMeters = (parseFloat(radius) || 5) * 1000;

    const lots = await ParkingLot.find({
      status: "approved",
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: radiusInMeters,
        },
      },
    });

    res.status(200).json({ success: true, count: lots.length, parkingLots: lots });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/parking-lots/my
// @access  Private (owner)
const getMyParkingLots = async (req, res, next) => {
  try {
    const lots = await ParkingLot.find({ ownerId: req.user._id }).sort({
      createdAt: -1,
    });

    res.status(200).json({ success: true, count: lots.length, parkingLots: lots });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/parking-lots/:id
// @access  Public
// Returns lot details plus slot occupancy counts
const getParkingLotById = async (req, res, next) => {
  try {
    const lot = await ParkingLot.findById(req.params.id);
    if (!lot) {
      return res.status(404).json({ success: false, message: "Parking lot not found" });
    }

    const slots = await ParkingSlot.find({ parkingLotId: lot._id });
    const availableCount = slots.filter((s) => s.status === "available").length;
    const occupiedCount = slots.filter((s) => s.status === "occupied").length;

    res.status(200).json({
      success: true,
      parkingLot: lot,
      slots,
      summary: {
        totalSlots: slots.length,
        available: availableCount,
        occupied: occupiedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/parking-lots/:id
// @access  Private (owner of this lot, or admin)
// req.parkingLot is attached by the isLotOwnerOrAdmin middleware
const updateParkingLot = async (req, res, next) => {
  try {
    const allowedFields = [
      "name",
      "address",
      "city",
      "location",
      "openingTime",
      "closingTime",
      "totalFloors",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        req.parkingLot[field] = req.body[field];
      }
    });

    await req.parkingLot.save();

    res.status(200).json({ success: true, parkingLot: req.parkingLot });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/parking-lots/:id
// @access  Private (owner of this lot, or admin)
const deleteParkingLot = async (req, res, next) => {
  try {
    await ParkingSlot.deleteMany({ parkingLotId: req.parkingLot._id });
    await req.parkingLot.deleteOne();

    res.status(200).json({
      success: true,
      message: "Parking lot and its slots have been deleted",
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/parking-lots/admin/all
// @access  Private (admin) - includes pending/rejected lots too
const getAllParkingLotsAdmin = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const lots = await ParkingLot.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: lots.length, parkingLots: lots });
  } catch (error) {
    next(error);
  }
};

// @route   PATCH /api/parking-lots/:id/approve
// @access  Private (admin)
const approveParkingLot = async (req, res, next) => {
  try {
    const { status } = req.body; // "approved" or "rejected"

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "status must be 'approved' or 'rejected'",
      });
    }

    const lot = await ParkingLot.findById(req.params.id);
    if (!lot) {
      return res.status(404).json({ success: false, message: "Parking lot not found" });
    }

    lot.status = status;
    await lot.save();

    res.status(200).json({ success: true, parkingLot: lot });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createParkingLot,
  getAllParkingLots,
  getNearbyParkingLots,
  getMyParkingLots,
  getParkingLotById,
  updateParkingLot,
  deleteParkingLot,
  getAllParkingLotsAdmin,
  approveParkingLot,
};
