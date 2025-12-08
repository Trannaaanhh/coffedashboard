const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const cors = require("cors");
const morgan = require("morgan");
const jwt = require("jsonwebtoken");
const http = require("http");               
const { Server } = require("socket.io");    

// Import Models & Routes
const User = require("./models/users.model");
const Item = require("./models/products.model");
const orderRoutes = require("./routes/orders.routes");
const comboRoutes = require("./routes/combos.routes");
// const attendanceRoutes = require("./routes/attendance.routes");

dotenv.config();
const app = express();
const server = http.createServer(app);     

// --- CẤU HÌNH SOCKET.IO ---
const io = new Server(server, {
  cors: {
    origin: "*", // Cho phép mọi nguồn (Frontend) kết nối
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
  }
});

// Middleware chèn biến 'io' vào req để dùng ở Route
app.use((req, res, next) => {
  req.io = io;
  next();
});

// --- MIDDLEWARES ---
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cors());
app.use(morgan("dev"));

// --- Kết nối MongoDB ---
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// --- Route test ---
app.get("/", (req, res) => {
  res.send("Hello from Express + MongoDB!");
});

// --- API User ---
app.post("/users", async (req, res) => {
    try {
        if(req.body.password) {
            req.body.password = await bcrypt.hash(req.body.password, 10);
        }
        const newUser = await User.create(req.body);
        res.status(201).json(newUser);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.get("/users", async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- API Đăng Ký ---
app.post("/register", async (req, res) => {
    try {
        const { name, username, password, email, phone, role } = req.body;
        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ error: "Username already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({
            name, username, email, phone, role,
            password: hashedPassword,
        });
        res.status(201).json({ message: "✅ User registered", user: newUser });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// --- API Đăng Nhập ---
app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ error: "❌ Username not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: "❌ Invalid password" });

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || "secret_key_tam_thoi",
            { expiresIn: "1d" }
        );

        const { password: _, ...userData } = user.toObject();
        res.json({ message: "✅ Login successful", token, user: userData });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- API Items ---
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

// Routes
app.use("/orders", orderRoutes);
app.use("/combos", comboRoutes);

app.get("/testconnection", (req, res) => res.json("Connection OK"));

// --- Server Start bằng server.listen ---
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));