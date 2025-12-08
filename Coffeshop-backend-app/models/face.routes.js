const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../models/users.model");
const { authenticateToken, requireAdmin } = require("../middleware/auth.middleware");

// Endpoint to enroll or update face for a user
// CHỈ ADMIN MỚI CÓ QUYỀN ĐĂNG KÝ FACE-ID CHO NHÂN VIÊN
// This receives face descriptor from frontend
router.post("/enroll-face", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId, faceDescriptor, enrollmentPhoto, name, username, email, phone, role } = req.body;

    // Nếu có userId, cập nhật face-id cho nhân viên đó
    // Nếu không có userId nhưng có thông tin nhân viên, tạo nhân viên mới và đăng ký face-id
    if (userId) {
      // Trường hợp 1: Đăng ký face-id cho nhân viên đã tồn tại
      if (!faceDescriptor || !Array.isArray(faceDescriptor)) {
        return res.status(400).json({
          error: "faceDescriptor (array) required",
        });
      }

      // Validate face descriptor is 128-dimensional
      if (faceDescriptor.length !== 128) {
        return res.status(400).json({
          error: `Face descriptor must be 128-dimensional, got ${faceDescriptor.length}`,
        });
      }

      const user = await User.findByIdAndUpdate(
        userId,
        {
          faceDescriptor,
          faceEnrolled: true,
          enrollmentPhoto,
          updatedAt: new Date(),
        },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        message: "✅ Đăng ký Face ID thành công cho nhân viên!",
        faceEnrolled: true,
        user: {
          _id: user._id,
          username: user.username,
          name: user.name,
          faceEnrolled: user.faceEnrolled,
        },
      });
    } else {
      // Trường hợp 2: Tạo nhân viên mới và đăng ký face-id
      if (!faceDescriptor || !Array.isArray(faceDescriptor)) {
        return res.status(400).json({
          error: "faceDescriptor (array) required",
        });
      }

      if (!name || !username) {
        return res.status(400).json({
          error: "name và username là bắt buộc khi tạo nhân viên mới",
        });
      }

      // Validate face descriptor is 128-dimensional
      if (faceDescriptor.length !== 128) {
        return res.status(400).json({
          error: `Face descriptor must be 128-dimensional, got ${faceDescriptor.length}`,
        });
      }

      // Kiểm tra username đã tồn tại chưa
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ error: "Username đã tồn tại" });
      }

      // Hash password nếu có, nếu không thì tạo password mặc định
      const password = req.body.password || "123456"; // Password mặc định
      const hashedPassword = await bcrypt.hash(password, 10);

      // Tạo nhân viên mới với face-id
      const newUser = await User.create({
        name,
        username,
        email: email || "",
        phone: phone || "",
        role: role || "employee",
        password: hashedPassword,
        faceDescriptor,
        faceEnrolled: true,
        enrollmentPhoto,
      });

      res.status(201).json({
        message: "✅ Tạo nhân viên mới và đăng ký Face ID thành công!",
        faceEnrolled: true,
        user: {
          _id: newUser._id,
          username: newUser.username,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          role: newUser.role,
          faceEnrolled: newUser.faceEnrolled,
        },
      });
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get face enrollment status
router.get("/face-status/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      faceEnrolled: user.faceEnrolled || false,
      message: user.faceEnrolled
        ? "✅ Face enrolled"
        : "⏳ Face not enrolled yet",
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;