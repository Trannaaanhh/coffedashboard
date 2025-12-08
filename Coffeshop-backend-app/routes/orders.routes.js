const express = require("express");
const router = express.Router();
const Order = require("../models/orders.model");

// --- 1. API THỐNG KÊ DOANH THU (MỚI) ---
router.get("/stats/revenue", async (req, res) => {
  try {
    // Thống kê doanh thu theo ngày (Chỉ tính đơn Delivered)
    const dailyStats = await Order.aggregate([
      { $match: { status: "Delivered" } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$orderDate" } },
          totalRevenue: { $sum: "$totalAmount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } } // Sắp xếp theo ngày tăng dần
    ]);

    // Thống kê tỷ lệ trạng thái đơn hàng
    const statusStats = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({ daily: dailyStats, status: statusStats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 2. TẠO ĐƠN MỚI (KÈM SOCKET IO) ---
router.post("/", async (req, res) => {
  try {
    const order = await Order.create(req.body);

    // Bắn Socket thông báo
    try {
      const io = req.app.get("socketio");
      const customerName = order.deliveryAddress?.fullName || "Khách vãng lai";
      const totalMoney = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount);

      io.emit("new_order", {
        title: "🔔 Đơn hàng mới!",
        message: `${customerName} vừa đặt đơn: ${totalMoney}`,
        orderData: order
      });
      console.log("📡 Socket sent: new_order");
    } catch (e) { console.error("Socket error:", e); }

    res.status(201).json({ message: "Order created successfully", order });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// --- 3. CÁC API CƠ BẢN KHÁC (GIỮ NGUYÊN) ---

// Hủy đơn
router.delete("/:id", async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { status: "Cancelled" }, { new: true });
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json({ message: "Order cancelled", order });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Cập nhật thông tin
router.put("/:id", async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json({ message: "Order updated", order });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Đổi trạng thái
router.patch("/:id/status", async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json({ message: "Status updated", order });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Lọc đơn hàng
router.get("/filter", async (req, res) => {
  try {
    const { userId, status, status_ne, keyword } = req.query;
    let query = {};
    if (userId) query.userId = userId;
    if (status) query.status = status;
    if (status_ne) query.status = { $ne: status_ne };
    if (keyword) {
       const kw = keyword.trim();
       query.$or = [
         { _id: kw.length === 24 ? kw : null }, // Chỉ tìm ID nếu đúng độ dài ObjectId
         { 'deliveryAddress.fullName': { $regex: kw, $options: 'i' } },
         { 'deliveryAddress.phone': { $regex: kw, $options: 'i' } }
       ].filter(Boolean); // Lọc bỏ null
    }
    const orders = await Order.find(query).sort({ orderDate: -1 });
    res.json(orders);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Lấy tất cả
router.get("/", async (req, res) => {
  try { res.json(await Order.find().sort({ orderDate: -1 })); } 
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;