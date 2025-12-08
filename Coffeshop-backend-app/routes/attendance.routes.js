const express = require("express");
const router = express.Router();
const Attendance = require("../models/attendance.model");

// Routes check-in và check-out đã được xóa

// --- GET ATTENDANCE HISTORY ---
router.get("/history/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const records = await Attendance.find({ userId }).sort({
      checkInTime: -1,
    });

    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- GET ALL ATTENDANCE (Admin) ---
router.get("/", async (req, res) => {
  try {
    const records = await Attendance.find().sort({ checkInTime: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;