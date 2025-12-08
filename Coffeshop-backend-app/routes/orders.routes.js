const express = require("express");
const router = express.Router();
const Order = require("../models/orders.model");

// --- Tạo đơn (CÓ THÔNG BÁO SOCKET) ---
router.post("/", async (req, res) => {
  try {
    const order = await Order.create(req.body);

    // [MỚI] Phát sự kiện 'newOrder' tới tất cả client
    req.io.emit("newOrder", order);

    res.status(201).json({
      message: "Order created successfully",
      order,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- Các route khác giữ nguyên ---
router.delete("/:id", async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { status: "Cancelled" }, { new: true });
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json({ message: "Order cancelled successfully", order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id", async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { status: "Confirmed" }, { new: true });
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json({ message: "Order confirmed successfully", order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedOrder) return res.status(404).json({ error: "Order not found" });
    res.json({ message: "Order updated successfully", order: updatedOrder });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["Pending", "Unpaid", "Confirmed", "Delivering", "Delivered", "Cancelled"];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: "Invalid order status" });
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json({ message: "Order status updated successfully", order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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