const express = require("express");
const router = express.Router();

const Promotion = require("../models/promotions.model");
const Product = require("../models/products.model");

// --- Helper: Chuyển đổi ID sang String an toàn ---
// Giúp tránh lỗi crash "Cannot read properties of undefined (reading 'toString')"
const safeStr = (val) => (val ? String(val) : "");

// --- Helper function: Validate promotion uniqueness ---
const validatePromotion = async (scope, productIds, categories, comboItems, excludePromotionId = null) => {
    const errors = [];
    
    // Base query: loại trừ promotion hiện tại (khi update)
    const baseQuery = excludePromotionId ? { _id: { $ne: excludePromotionId } } : {};

    try {
        // 1. Validate PRODUCT Scope
        if (scope === "PRODUCT" && productIds && productIds.length > 0) {
            for (const productId of productIds) {
                const existing = await Promotion.findOne({
                    ...baseQuery,
                    scope: "PRODUCT",
                    productIds: productId
                }).lean();

                if (existing) {
                    errors.push(`Sản phẩm ${productId} đã có khuyến mãi (ID: ${existing._id}).`);
                }
            }
        }

        // 2. Validate CATEGORY Scope
        if (scope === "CATEGORY" && categories && categories.length > 0) {
            for (const category of categories) {
                const existing = await Promotion.findOne({
                    ...baseQuery,
                    scope: "CATEGORY",
                    categories: category
                }).lean();

                if (existing) {
                    errors.push(`Danh mục "${category}" đã có khuyến mãi (ID: ${existing._id}).`);
                }
            }
        }

        // 3. Validate COMBO Scope (Phần hay gây lỗi nhất)
        if (scope === "COMBO" && comboItems && comboItems.length > 0) {
            // Sort combo hiện tại để so sánh
            const sortedComboItems = [...comboItems].sort((a, b) =>
                safeStr(a.productId).localeCompare(safeStr(b.productId))
            );

            // Lấy tất cả combo khác trong DB
            const existingCombos = await Promotion.find({
                ...baseQuery,
                scope: "COMBO"
            }).lean();

            for (const existingCombo of existingCombos) {
                // Bỏ qua nếu số lượng item không khớp
                if (!existingCombo.comboItems || existingCombo.comboItems.length !== sortedComboItems.length) {
                    continue;
                }

                // Sort combo trong DB
                const existingSorted = [...existingCombo.comboItems].sort((a, b) =>
                    safeStr(a.productId).localeCompare(safeStr(b.productId))
                );

                // So sánh từng phần tử
                const isMatch = existingSorted.every((item, index) => {
                    const sortedItem = sortedComboItems[index];
                    return safeStr(item.productId) === safeStr(sortedItem.productId)
                        && Number(item.requiredQty) === Number(sortedItem.requiredQty);
                });

                if (isMatch) {
                    errors.push(`Combo này đã tồn tại trong khuyến mãi khác (ID: ${existingCombo._id}).`);
                    break;
                }
            }
        }
    } catch (err) {
        console.error("❌ Validation Logic Error:", err);
        errors.push("Lỗi kiểm tra dữ liệu: " + err.message);
    }

    return errors;
};

// --- API: Get all promotions ---
router.get("/", async (req, res) => {
    try {
        const { isActive, scope, type } = req.query;

        // Build filter object
        const filter = {};
        if (isActive !== undefined) {
            filter.isActive = isActive === "true";
        }
        if (scope) {
            filter.scope = scope;
        }
        if (type) {
            filter.type = type;
        }

        const promotions = await Promotion.find(filter).sort({ createdAt: -1 });
        res.json(promotions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- API: Get active promotions (currently valid) ---
router.get("/active", async (req, res) => {
    try {
        const now = new Date();
        const promotions = await Promotion.find({
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now }
        }).sort({ startDate: -1 });

        res.json(promotions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- API: Get promotion by ID ---
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const promotion = await Promotion.findById(id);

        if (!promotion) {
            return res.status(404).json({ error: "Promotion not found" });
        }
        res.json(promotion);
    } catch (err) {
        if (err.name === "CastError") {
            return res.status(400).json({ error: "Invalid promotion ID" });
        }
        res.status(500).json({ error: err.message });
    }
});

// --- API: Create new promotion ---
router.post("/", async (req, res) => {
    try {
        const {
            name, description, type, scope, value,
            startDate, endDate, minOrderTotal, isActive,
            productIds, categories, comboItems
        } = req.body;

        // Validation
        if (!name || !type || !scope || value === undefined || !startDate || !endDate) {
            return res.status(400).json({
                error: "Missing required fields: name, type, scope, value, startDate, endDate"
            });
        }

        // Validate type enum
        if (!["PERCENT", "FIXED_AMOUNT", "FIXED_PRICE_COMBO"].includes(type)) {
            return res.status(400).json({ error: "Invalid type" });
        }

        // Validate scope enum
        if (!["ORDER", "PRODUCT", "CATEGORY", "COMBO"].includes(scope)) {
            return res.status(400).json({ error: "Invalid scope" });
        }

        // Validate scope-specific fields
        if (scope === "PRODUCT" && (!productIds || productIds.length === 0)) {
            return res.status(400).json({ error: "productIds is required for PRODUCT scope" });
        }
        if (scope === "CATEGORY" && (!categories || categories.length === 0)) {
            return res.status(400).json({ error: "categories is required for CATEGORY scope" });
        }
        if (scope === "COMBO" && (!comboItems || comboItems.length === 0)) {
            return res.status(400).json({ error: "comboItems is required for COMBO scope" });
        }

        // *** VALIDATE UNIQUENESS ***
        const validationErrors = await validatePromotion(scope, productIds, categories, comboItems);
        if (validationErrors.length > 0) {
            return res.status(409).json({
                error: "Promotion validation failed",
                details: validationErrors
            });
        }

        const promotionData = {
            name, description, type, scope, value,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            minOrderTotal,
            isActive: isActive !== undefined ? isActive : true
        };

        // Add scope-specific fields
        if (scope === "PRODUCT") promotionData.productIds = productIds;
        if (scope === "CATEGORY") promotionData.categories = categories;
        if (scope === "COMBO") promotionData.comboItems = comboItems;

        const promotion = await Promotion.create(promotionData);
        res.status(201).json(promotion);
    } catch (err) {
        console.error("POST Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// --- API: Update promotion ---
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name, description, type, scope, value,
            startDate, endDate, minOrderTotal, isActive,
            productIds, categories, comboItems
        } = req.body;

        const promotion = await Promotion.findById(id);
        if (!promotion) {
            return res.status(404).json({ error: "Promotion not found" });
        }

        // Validate uniqueness only if scope fields change
        const scopeToValidate = scope !== undefined ? scope : promotion.scope;
        const productIdsToValidate = productIds !== undefined ? productIds : (promotion.productIds ? [...promotion.productIds] : []);
        const categoriesToValidate = categories !== undefined ? categories : (promotion.categories ? [...promotion.categories] : []);
        const comboItemsToValidate = comboItems !== undefined ? comboItems : (promotion.comboItems ? promotion.comboItems.toObject() : []);

        const validationErrors = await validatePromotion(
            scopeToValidate,
            productIdsToValidate,
            categoriesToValidate,
            comboItemsToValidate,
            id
        );

        if (validationErrors.length > 0) {
            return res.status(409).json({
                error: "Promotion validation failed",
                details: validationErrors
            });
        }

        // Build update object
        const updateFields = {};
        if (name !== undefined) updateFields.name = name;
        if (description !== undefined) updateFields.description = description;
        if (type !== undefined) updateFields.type = type;
        if (scope !== undefined) updateFields.scope = scope;
        if (value !== undefined) updateFields.value = value;
        if (startDate !== undefined) updateFields.startDate = new Date(startDate);
        if (endDate !== undefined) updateFields.endDate = new Date(endDate);
        if (minOrderTotal !== undefined) updateFields.minOrderTotal = minOrderTotal;
        if (isActive !== undefined) updateFields.isActive = isActive;

        // Reset arrays if scope changes
        if (scope !== undefined) {
            updateFields.productIds = [];
            updateFields.categories = [];
            updateFields.comboItems = [];
        }

        // Update arrays based on logic
        if (productIds !== undefined && (scope === "PRODUCT" || (scope === undefined && promotion.scope === "PRODUCT"))) {
            updateFields.productIds = productIds;
        }
        if (categories !== undefined && (scope === "CATEGORY" || (scope === undefined && promotion.scope === "CATEGORY"))) {
            updateFields.categories = categories;
        }
        if (comboItems !== undefined && (scope === "COMBO" || (scope === undefined && promotion.scope === "COMBO"))) {
            updateFields.comboItems = comboItems;
        }

        const updatedPromotion = await Promotion.findByIdAndUpdate(
            id,
            updateFields,
            { new: true, runValidators: false }
        );

        res.json(updatedPromotion);
    } catch (err) {
        console.error("PUT Error:", err);
        if (err.name === "CastError") {
            return res.status(400).json({ error: "Invalid promotion ID" });
        }
        res.status(500).json({ error: err.message });
    }
});

// --- API: Delete promotion ---
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const promotion = await Promotion.findById(id);

        if (!promotion) {
            return res.status(404).json({ error: "Promotion not found" });
        }

        await promotion.deleteOne();
        res.json({ message: "Promotion deleted successfully" });
    } catch (err) {
        if (err.name === "CastError") {
            return res.status(400).json({ error: "Invalid promotion ID" });
        }
        res.status(500).json({ error: err.message });
    }
});

// --- API: Calculate applicable promotions for an order ---
router.post("/calculate", async (req, res) => {
    try {
        const { items, subtotal } = req.body;

        if (!items || !Array.isArray(items) || subtotal === undefined) {
            return res.status(400).json({
                error: "Missing required fields: items (array), subtotal (number)"
            });
        }

        // Get active promotions
        const now = new Date();
        const promotions = await Promotion.find({
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now }
        });

        // Get product details for items
        const productIds = items.map(item => item.productId);
        const products = await Product.find({ _id: { $in: productIds } });
        const productMap = {};
        products.forEach(p => productMap[p._id.toString()] = p);

        // Count items by product
        const itemCounts = {};
        items.forEach(item => {
            const pid = item.productId.toString();
            itemCounts[pid] = (itemCounts[pid] || 0) + item.quantity;
        });

        const applicablePromotions = [];
        let totalDiscount = 0;

        for (const promo of promotions) {
            let discount = 0;
            let applies = false;

            // 1. ORDER SCOPE
            if (promo.scope === "ORDER") {
                if (subtotal >= (promo.minOrderTotal || 0)) {
                    applies = true;
                    if (promo.type === "PERCENT") {
                        discount = subtotal * (promo.value / 100);
                    } else if (promo.type === "FIXED_AMOUNT") {
                        discount = promo.value;
                    }
                }
            } 
            // 2. CATEGORY SCOPE
            else if (promo.scope === "CATEGORY") {
                const categoryItems = items.filter(item => {
                    const prod = productMap[item.productId.toString()];
                    return prod && promo.categories.includes(prod.category);
                });
                
                if (categoryItems.length > 0) {
                    applies = true;
                    const categorySubtotal = categoryItems.reduce((sum, item) => {
                        const prod = productMap[item.productId.toString()];
                        return sum + (prod ? prod.price * item.quantity : 0); // Assuming 'price' field
                    }, 0);

                    if (promo.type === "PERCENT") {
                        discount = categorySubtotal * (promo.value / 100);
                    } else if (promo.type === "FIXED_AMOUNT") {
                        discount = promo.value;
                    }
                }
            } 
            // 3. PRODUCT SCOPE
            else if (promo.scope === "PRODUCT") {
                const productItems = items.filter(item => 
                    promo.productIds.some(pid => pid.toString() === item.productId.toString())
                );

                if (productItems.length > 0) {
                    applies = true;
                    const productSubtotal = productItems.reduce((sum, item) => {
                        const prod = productMap[item.productId.toString()];
                        return sum + (prod ? prod.price * item.quantity : 0);
                    }, 0);

                    if (promo.type === "PERCENT") {
                        discount = productSubtotal * (promo.value / 100);
                    } else if (promo.type === "FIXED_AMOUNT") {
                        discount = promo.value;
                    }
                }
            } 
            // 4. COMBO SCOPE
            else if (promo.scope === "COMBO") {
                const comboMet = promo.comboItems.every(comboItem => {
                    const count = itemCounts[comboItem.productId.toString()] || 0;
                    return count >= comboItem.requiredQty;
                });

                if (comboMet) {
                    applies = true;
                    if (promo.type === "FIXED_PRICE_COMBO") {
                        // Calculate original price of the combo items involved
                        const originalComboPrice = promo.comboItems.reduce((sum, comboItem) => {
                            const prod = productMap[comboItem.productId.toString()];
                            return sum + (prod ? prod.price * comboItem.requiredQty : 0);
                        }, 0);
                        // Discount is the difference
                        discount = Math.max(originalComboPrice - promo.value, 0);
                    } else if (promo.type === "PERCENT") {
                        const comboPrice = promo.comboItems.reduce((sum, comboItem) => {
                            const prod = productMap[comboItem.productId.toString()];
                            return sum + (prod ? prod.price * comboItem.requiredQty : 0);
                        }, 0);
                        discount = comboPrice * (promo.value / 100);
                    } else if (promo.type === "FIXED_AMOUNT") {
                        discount = promo.value;
                    }
                }
            }

            if (applies && discount > 0) {
                applicablePromotions.push({
                    promotionId: promo._id,
                    name: promo.name,
                    discountAmount: discount
                });
                totalDiscount += discount;
            }
        }

        const finalTotal = Math.max(subtotal - totalDiscount, 0);

        res.json({
            applicablePromotions,
            totalDiscount,
            finalTotal
        });

    } catch (err) {
        console.error("Calculate Error:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;