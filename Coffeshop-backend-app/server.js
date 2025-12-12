const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");

// Models
const Item = require("./models/products.model");

//Routes (Import các route file)
const orderRoutes = require("./routes/orders.routes");
const promotionRoutes = require("./routes/promotions.routes"); // <--- MỚI THÊM

dotenv.config();
const app = express();
const server = http.createServer(app);

// ⚙️ Middleware
app.use(express.json()); // Để parse JSON request bodies
app.use(morgan("dev")); // Để log các request HTTP
app.use(cors({
  origin: "http://localhost:5173", // Cho phép yêu cầu từ frontend của bạn
  methods: ["GET", "POST", "PUT", "DELETE"], // Các phương thức HTTP được phép
  credentials: true, // Cho phép gửi cookies và header authorization
}));

// ⚡ Socket.io
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.set("io", io);

// 🔌 Socket.io
io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// 🧵 MongoDB connect
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log("📡 Socket.io ready");

      // === MongoDB Change Stream: theo dõi đơn mới ===
      const orders = mongoose.connection.collection("orders");

      const changeStream = orders.watch(
        [{ $match: { operationType: "insert" } }],
        { fullDocument: "updateLookup" }
      );

      changeStream.on("change", (change) => {
        const order = change.fullDocument;

        if (order) {
          io.emit("newOrder", {
            message: "📦 Có đơn hàng mới!",
            order,
            timestamp: new Date(),
          });

          console.log("📡 ChangeStream emitted newOrder:", order._id);
        }
      });

      changeStream.on("error", (err) => {
        console.error("❌ ChangeStream error:", err);
      });
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// ================================
// 📦 ITEMS API
// ================================
app.get("/items", async (req, res) => {
  try {
    const { category, search } = req.query;

    let query = { isActive: true };

    if (category && category !== "all") query.category = category;
    if (search) query.name = { $regex: search, $options: "i" };

    const items = await Item.find(query);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================================
// 📦 ROUTES
// ================================
app.use("/orders", orderRoutes);
app.use("/promotions", promotionRoutes); 
// Test
app.get("/testconnection", (req, res) => res.json("OK"));