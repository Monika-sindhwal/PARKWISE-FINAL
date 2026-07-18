const ParkingLot = require("../models/ParkingLot");

// Fetches the parking lot referenced by req.params.lotId (or req.params.id)
// and ensures req.user is either its owner or an admin.
// Attaches the found lot to req.parkingLot so controllers don't re-fetch it.
const isLotOwnerOrAdmin = async (req, res, next) => {
  try {
    const lotId = req.params.lotId || req.params.id;
    const lot = await ParkingLot.findById(lotId);

    if (!lot) {
      return res.status(404).json({
        success: false,
        message: "Parking lot not found",
      });
    }

    const isOwner = lot.ownerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to modify this parking lot",
      });
    }

    req.parkingLot = lot;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = isLotOwnerOrAdmin;
