const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  slotNumber: { type: Number, required: true, unique: true },
  status: {
    type: String,
    enum: ["available", "occupied", "parked"],
    default: "available",
  },
  bookingStart: {
    type: Date,
    default: null,
  },
  bookingEnd: {
    type: Date,
    default: null,
  },
  bookedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  vehicleNumber: { type: String, default: null },
  isParked: { type: Boolean, default: false },
  lastUpdated: { type: Date, default: Date.now },
  sensorId: { type: String, required: true },
});

slotSchema.index({ status: 1, bookingStart: 1, bookingEnd: 1 });

module.exports = mongoose.model('Slot', slotSchema);
 