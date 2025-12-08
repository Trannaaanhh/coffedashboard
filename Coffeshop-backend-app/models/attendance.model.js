const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  userId: String,
  username: String,
  fullName: String,
  checkInTime: { type: Date, required: true },
  checkOutTime: Date,
  checkInPhoto: String, // URL or base64 of photo
  checkOutPhoto: String,
  status: {
    type: String,
    enum: ["checked-in", "checked-out"],
    default: "checked-in",
  },
  date: { type: Date, default: new Date().setHours(0, 0, 0, 0) },
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("attendance", attendanceSchema);