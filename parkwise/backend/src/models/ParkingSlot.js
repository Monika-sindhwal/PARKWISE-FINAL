const mongoose = require("mongoose");

const parkingSlotSchema = new mongoose.Schema(
  {
    parkingLotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ParkingLot",
      required: true,
    },
    floor: {
      type: Number,
      default: 0,
      min: 0,
    },
    slotNumber: {
      type: String,
      required: [true, "Slot number is required"],
      trim: true,
      uppercase: true,
    },
    vehicleType: {
      type: String,
      enum: ["car", "bike", "truck", "ev"],
      required: [true, "Vehicle type is required"],
    },
    status: {
      type: String,
      enum: ["available", "occupied", "maintenance"],
      default: "available",
    },
    pricePerHour: {
      type: Number,
      required: [true, "Price per hour is required"],
      min: 0,
    },
  },
  { timestamps: true }
);

// A slot number must be unique within a given floor of a given parking lot
parkingSlotSchema.index(
  { parkingLotId: 1, floor: 1, slotNumber: 1 },
  { unique: true }
);

module.exports = mongoose.model("ParkingSlot", parkingSlotSchema);
