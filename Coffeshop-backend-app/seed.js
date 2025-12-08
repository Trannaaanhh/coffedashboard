const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Combo = require("./models/combos.model");

dotenv.config();

const seedCombos = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing combos (optional)
    // await Combo.deleteMany({});

    const combosData = [
      {
        _id: "6933ed99ae0e933d6e29fb2d",
        name: "Combo Sáng Tỉnh Táo",
        category: "Combo",
        basePrice: 55000,
        discountedPrice: 49000,
        discount: 11,
        description: "Khởi đầu ngày mới đầy năng lượng với Cà phê đen đậm đà và bánh Croissant thơm lừng.",
        image_url: "https://www.phapfr.vn/nghe-thuat-song-du-lich/wp-content/uploads/sites/23/2021/05/cupfreshcoffeewithcroissants-73387856-1620723162001.jpg",
        isActive: true,
        items: [
          {
            productName: "Cà phê đen",
            quantity: 1,
          },
          {
            productName: "Bánh Croissant",
            quantity: 1,
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: "6933ed99ae0e933d6e29fb2e",
        name: "Combo Trà Bánh Chill",
        category: "Combo",
        basePrice: 75000,
        discountedPrice: 65000,
        discount: 13,
        description: "Sự kết hợp hoàn hảo giữa vị thanh mát của Trà đào và vị ngọt ngào của Tiramisu.",
        image_url: "combo-tra-banh-chill.jpg",
        isActive: true,
        items: [
          {
            productName: "Trà đào cam sả",
            quantity: 1,
          },
          {
            productName: "Bánh Tiramisu",
            quantity: 1,
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: "6933ed99ae0e933d6e29fb2f",
        name: "Combo Béo Ngậy",
        category: "Combo",
        basePrice: 70000,
        discountedPrice: 59000,
        discount: 16,
        description: "Vị béo của Bạc xỉu hòa quyện cùng lớp nhân socola tan chảy của bánh Lava.",
        image_url: "combo-beo-ngay.jpg",
        isActive: true,
        items: [
          {
            productName: "Bạc xỉu",
            quantity: 1,
          },
          {
            productName: "Bánh Socola Lava",
            quantity: 1,
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: "6933ed99ae0e933d6e29fb30",
        name: "Combo Bữa Xế",
        category: "Combo",
        basePrice: 85000,
        discountedPrice: 75000,
        discount: 12,
        description: "Nạp năng lượng buổi chiều với Sinh tố bơ bổ dưỡng và bánh Red Velvet.",
        image_url: "combo-bua-xe.jpg",
        isActive: true,
        items: [
          {
            productName: "Sinh tố bơ",
            quantity: 1,
          },
          {
            productName: "Red Velvet Cupcake",
            quantity: 1,
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: "6933ed99ae0e933d6e29fb31",
        name: "Combo Đôi Bạn Thân",
        category: "Combo",
        basePrice: 60000,
        discountedPrice: 50000,
        discount: 17,
        description: "Mua 2 ly trà sữa trân châu đường đen với giá ưu đãi.",
        image_url: "combo-doi-ban.jpg",
        isActive: true,
        items: [
          {
            productName: "Trà sữa",
            quantity: 2,
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Insert combos with upsert to update existing ones
    const result = await Combo.bulkWrite(
      combosData.map((combo) => ({
        updateOne: {
          filter: { _id: combo._id },
          update: { $set: combo },
          upsert: true,
        },
      }))
    );

    console.log("✅ Combos seeded successfully!");
    console.log("📊 Upserted:", result.upsertedCount);
    console.log("📊 Modified:", result.modifiedCount);

    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");
  } catch (err) {
    console.error("❌ Error seeding combos:", err.message);
    process.exit(1);
  }
};

seedCombos();