const jwt = require("jsonwebtoken");
const User = require("../models/users.model");

// Middleware để xác thực JWT token
const authenticateToken = async (req, res, next) => {
  try {
    // Lấy token từ header Authorization
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Format: "Bearer TOKEN"

    if (!token) {
      return res.status(401).json({ error: "❌ Không có token xác thực. Vui lòng đăng nhập." });
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "secret_key_tam_thoi"
    );

    // Lấy thông tin user từ database
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: "❌ Người dùng không tồn tại." });
    }

    // Lưu thông tin user vào request để sử dụng ở các route tiếp theo
    req.user = {
      id: user._id,
      role: user.role,
      username: user.username,
    };

    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "❌ Token không hợp lệ." });
    }
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "❌ Token đã hết hạn. Vui lòng đăng nhập lại." });
    }
    return res.status(500).json({ error: err.message });
  }
};

// Middleware để kiểm tra quyền admin
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "❌ Chưa xác thực người dùng." });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({ 
      error: "❌ Chỉ quản trị viên mới có quyền thực hiện thao tác này." 
    });
  }

  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
};
