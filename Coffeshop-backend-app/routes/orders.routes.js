const express = require("express");
const router = express.Router();
const Order = require("../models/orders.model");

// --- Tạo đơn ---
router.post("/", async (req, res) => {
  try {
    const order = await Order.create(req.body);
    res.status(201).json({
      message: "Order created successfully",
      order,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- Hủy đơn (cập nhật trạng thái thành Cancelled) ---
router.delete("/usercancell/:id", async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: "Cancelled" },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({
      message: "Order cancelled successfully",
      order,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Xác nhận đơn ---
router.post("/userconfirm/:id", async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: "Confirmed" },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({
      message: "Order confirmed successfully",
      order,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Cập nhật thông tin đơn ---
router.put("/:id", async (req, res) => {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({
      message: "Order updated successfully",
      order: updatedOrder,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Đổi trạng thái đơn (KHÔNG gửi notification nữa) ---
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = [
      "Pending",
      "Unpaid",
      "Confirmed",
      "Delivering",
      "Delivered",
      "Cancelled",
      "Completed" // Thêm Completed để tính doanh thu
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid order status" });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    return res.json({
      message: "Order status updated successfully",
      order,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =======================================================
// [MỚI] API THỐNG KÊ DOANH THU (Bắt buộc đặt trên /:id)
// =======================================================
router.get("/stats/revenue", async (req, res) => {
  try {
    const { type } = req.query; // 'day', 'month', 'year'

    // 1. Chỉ tính đơn đã giao hoặc hoàn thành
    const matchStage = {
      $match: {
        status: { $in: ["Delivered", "Completed"] }
      }
    };

    // 2. Định dạng thời gian cho biểu đồ
    let dateFormat = "%Y-%m-%d"; // Mặc định theo ngày
    if (type === 'month') dateFormat = "%Y-%m";
    if (type === 'year') dateFormat = "%Y";

    const stats = await Order.aggregate([
      matchStage,
      {
        $facet: {
          // Tổng quan: Tổng tiền, tổng đơn
          "summary": [
            { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" }, totalOrders: { $sum: 1 } } }
          ],
          // Biểu đồ: Doanh thu theo thời gian
          "chartData": [
            {
              $group: {
                _id: { $dateToString: { format: dateFormat, date: "$orderDate" } },
                revenue: { $sum: "$totalAmount" },
                count: { $sum: 1 }
              }
            },
            { $sort: { _id: 1 } }
          ],
          // Top sản phẩm bán chạy
          "topProducts": [
            { $unwind: "$items" },
            {
              $group: {
                _id: "$items.productName",
                totalSold: { $sum: "$items.quantity" },
                revenue: { $sum: { $multiply: ["$items.quantity", "$items.finalUnitPrice"] } }
              }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 5 }
          ]
        }
      }
    ]);

    const result = stats[0];
    const summary = result.summary[0] || { totalRevenue: 0, totalOrders: 0 };

    res.json({
      summary: {
        totalRevenue: summary.totalRevenue,
        totalOrders: summary.totalOrders
      },
      chartData: result.chartData,
      topProducts: result.topProducts
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Lấy danh sách đơn ---
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Lọc theo userId và status (hỗ trợ status != ) ---
router.get("/filter", async (req, res) => {
  try {
    const { userId, status, status_ne } = req.query;

    let query = {};

    if (userId) query.userId = userId;
    if (status) query.status = status;
    if (status_ne) query.status = { $ne: status_ne };

    const orders = await Order.find(query);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Lấy đơn theo ID (Luôn để cuối cùng) ---
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;