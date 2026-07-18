const express = require("express");
const router = express.Router();

const {
  createParkingLot,
  getAllParkingLots,
  getNearbyParkingLots,
  getMyParkingLots,
  getParkingLotById,
  updateParkingLot,
  deleteParkingLot,
  getAllParkingLotsAdmin,
  approveParkingLot,
} = require("../controllers/parkingLot.controller");

const {
  addSlot,
  getSlotsByLot,
  updateSlot,
  deleteSlot,
} = require("../controllers/parkingSlot.controller");

const protect = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/role.middleware");
const isLotOwnerOrAdmin = require("../middlewares/ownership.middleware");

// --- Specific routes first (before /:id) so "my" / "admin" aren't treated as an id ---

// Owner: view own lots
router.get("/my", protect, authorize("owner"), getMyParkingLots);

// Admin: view all lots (any status) + approve/reject
router.get("/admin/all", protect, authorize("admin"), getAllParkingLotsAdmin);
router.patch("/:id/approve", protect, authorize("admin"), approveParkingLot);

// Public
router.get("/nearby", getNearbyParkingLots);
router.get("/", getAllParkingLots);
router.get("/:id", getParkingLotById);

// Owner: create / update / delete a lot
router.post("/", protect, authorize("owner"), createParkingLot);
router.put("/:id", protect, authorize("owner", "admin"), isLotOwnerOrAdmin, updateParkingLot);
router.delete("/:id", protect, authorize("owner", "admin"), isLotOwnerOrAdmin, deleteParkingLot);

// --- Slots (nested under a parking lot) ---

router.get("/:lotId/slots", getSlotsByLot); // public
router.post(
  "/:lotId/slots",
  protect,
  authorize("owner", "admin"),
  isLotOwnerOrAdmin,
  addSlot
);
router.put(
  "/:lotId/slots/:slotId",
  protect,
  authorize("owner", "admin"),
  isLotOwnerOrAdmin,
  updateSlot
);
router.delete(
  "/:lotId/slots/:slotId",
  protect,
  authorize("owner", "admin"),
  isLotOwnerOrAdmin,
  deleteSlot
);

module.exports = router;
