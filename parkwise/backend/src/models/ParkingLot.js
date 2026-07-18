const mongoose = require("mongoose");

const parkingLotSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Parking lot name is required"],
      trim: true,
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Stored as GeoJSON so MongoDB can run geospatial "nearby" queries.
    // coordinates order is [longitude, latitude] - this is GeoJSON convention,
    // the OPPOSITE of how most APIs give you (lat, lng). Don't flip it by accident.
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: [true, "Location coordinates are required"],
      },
    },
    openingTime: {
      type: String, // e.g. "08:00"
      required: [true, "Opening time is required"],
    },
    closingTime: {
      type: String, // e.g. "22:00"
      required: [true, "Closing time is required"],
    },
    totalFloors: {
      type: Number,
      default: 1,
      min: 1,
    },
    // Admin approval workflow
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// Required for geospatial $near queries (search by current location)
parkingLotSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("ParkingLot", parkingLotSchema);
