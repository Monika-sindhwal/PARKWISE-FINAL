const ParkingSlot = require("../models/ParkingSlot");

// @route   POST /api/parking-lots/:lotId/slots
// @access  Private (owner of this lot, or admin)
const addSlot = async (req, res, next) => {
  try {
    const { slotNumber, floor, vehicleType, pricePerHour } = req.body;

    if (!slotNumber || !vehicleType || pricePerHour === undefined) {
      return res.status(400).json({
        success: false,
        message: "slotNumber, vehicleType and pricePerHour are required",
      });
    }

    const slot = await ParkingSlot.create({
      parkingLotId: req.parkingLot._id,
      slotNumber,
      floor: floor || 0,
      vehicleType,
      pricePerHour,
    });

    res.status(201).json({ success: true, slot });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/parking-lots/:lotId/slots
// @access  Public
// Supports ?status=available and ?vehicleType=car
const getSlotsByLot = async (req, res, next) => {
  try {
    const { status, vehicleType } = req.query;
    const filter = { parkingLotId: req.params.lotId };

    if (status) filter.status = status;
    if (vehicleType) filter.vehicleType = vehicleType;

    const slots = await ParkingSlot.find(filter).sort({ floor: 1, slotNumber: 1 });

    res.status(200).json({ success: true, count: slots.length, slots });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/parking-lots/:lotId/slots/:slotId
// @access  Private (owner of this lot, or admin)
const updateSlot = async (req, res, next) => {
  try {
    const slot = await ParkingSlot.findOne({
      _id: req.params.slotId,
      parkingLotId: req.params.lotId,
    });

    if (!slot) {
      return res.status(404).json({ success: false, message: "Slot not found" });
    }

    const allowedFields = ["slotNumber", "floor", "vehicleType", "status", "pricePerHour"];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        slot[field] = req.body[field];
      }
    });

    await slot.save();

    res.status(200).json({ success: true, slot });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/parking-lots/:lotId/slots/:slotId
// @access  Private (owner of this lot, or admin)
const deleteSlot = async (req, res, next) => {
  try {
    const slot = await ParkingSlot.findOneAndDelete({
      _id: req.params.slotId,
      parkingLotId: req.params.lotId,
    });

    if (!slot) {
      return res.status(404).json({ success: false, message: "Slot not found" });
    }

    res.status(200).json({ success: true, message: "Slot deleted" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addSlot,
  getSlotsByLot,
  updateSlot,
  deleteSlot,
};
