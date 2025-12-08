const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const User = require("./models/users.model");

dotenv.config();

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Demo users data
    const usersData = [
      {
        fullName: "Nguyễn Văn A (Quản trị viên)",
        username: "nguyenvana",
        email: "nguyenvana@coffeeshop.vn",
        phone: "0901234567",
        password: "admin",
        role: "admin",
        addresses: [
          {
            street: "100 Đường Nguyễn Huệ",
            ward: "Phường Bến Nghé",
            district: "Quận 1",
            city: "TP. Hồ Chí Minh",
            isDefault: true,
          },
        ],
      },
      {
        fullName: "Trần Thị B (Nhân viên)",
        username: "tranthib",
        email: "tranthib@coffeeshop.vn",
        phone: "0912345678",
        password: "staff",
        role: "staff",
        addresses: [
          {
            street: "200 Đường Lê Lợi",
            ward: "Phường Bến Nghé",
            district: "Quận 1",
            city: "TP. Hồ Chí Minh",
            isDefault: true,
          },
        ],
      },
      {
        fullName: "Phạm Minh C (Nhân viên)",
        username: "phamminhc",
        email: "phamminhc@coffeeshop.vn",
        phone: "0923456789",
        password: "staff",
        role: "staff",
        addresses: [
          {
            street: "300 Đường Ngô Đức Kế",
            ward: "Phường Bến Thành",
            district: "Quận 1",
            city: "TP. Hồ Chí Minh",
            isDefault: true,
          },
        ],
      },
      {
        fullName: "Lê Văn D (Nhân viên)",
        username: "levand",
        email: "levand@coffeeshop.vn",
        phone: "0934567890",
        password: "staff",
        role: "staff",
        addresses: [
          {
            street: "400 Đường Pasteur",
            ward: "Phường Thạch Thị Thanh",
            district: "Quận 1",
            city: "TP. Hồ Chí Minh",
            isDefault: true,
          },
        ],
      },
    ];

    // Hash passwords and upsert users
    const result = await User.bulkWrite(
      await Promise.all(
        usersData.map(async (user) => ({
          updateOne: {
            filter: { username: user.username },
            update: {
              $set: {
                ...user,
                password: await bcrypt.hash(user.password, 10),
              },
            },
            upsert: true,
          },
        }))
      )
    );

    console.log("✅ Users seeded successfully!");
    console.log("📊 Upserted:", result.upsertedCount);
    console.log("📊 Modified:", result.modifiedCount);

    console.log("\n📝 Demo Accounts Created:");
    console.log("\n🔐 ADMIN:");
    console.log("   Username: nguyenvana");
    console.log("   Password: admin");
    console.log("   Email: nguyenvana@coffeeshop.vn");

    console.log("\n👥 STAFF:");
    console.log("   1. Username: tranthib / Password: staff");
    console.log("   2. Username: phamminhc / Password: staff");
    console.log("   3. Username: levand / Password: staff");

    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
  } catch (err) {
    console.error("❌ Error seeding users:", err.message);
    process.exit(1);
  }
};

seedUsers();
