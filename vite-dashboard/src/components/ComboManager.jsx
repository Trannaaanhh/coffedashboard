import React, { useState, useEffect } from "react";
import axios from "axios";
import "./ComboManager.css";

const ComboManager = () => {
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCombo, setEditingCombo] = useState(null);
  
  // State form data
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    basePrice: "",
    image_url: "",
    discount: "",
    items: [],
  });

  const API_URL = "http://localhost:3000";

  // --- 1. FETCH DATA ---
  const fetchCombos = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/combos`);
      // Đảo ngược mảng để combo mới nhất lên đầu (nếu backend chưa sort)
      const sortedCombos = Array.isArray(res.data) ? res.data.reverse() : [];
      setCombos(sortedCombos);
    } catch (error) {
      console.error("❌ Lỗi tải combo:", error);
      // alert("Không thể kết nối đến server!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCombos();
  }, []);

  // --- 2. FORM HANDLERS ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productName: "", quantity: 1 }],
    });
  };

  const handleRemoveItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = field === "quantity" ? parseInt(value) || 1 : value;
    setFormData({ ...formData, items: newItems });
  };

  const handleAddCombo = async (e) => {
    e.preventDefault();
    try {
      if (editingCombo) {
        // Update
        await axios.put(`${API_URL}/combos/${editingCombo._id}`, formData);
        alert("✅ Cập nhật combo thành công!");
      } else {
        // Create
        await axios.post(`${API_URL}/combos`, formData);
        alert("✅ Tạo combo thành công!");
      }
      resetForm();
      fetchCombos();
    } catch (error) {
      alert("❌ Lỗi: " + (error.response?.data?.error || error.message));
    }
  };

  const handleEditCombo = (combo) => {
    setEditingCombo(combo);
    setFormData({
      name: combo.name,
      description: combo.description,
      category: combo.category,
      basePrice: combo.basePrice,
      image_url: combo.image_url,
      discount: combo.discount,
      items: combo.items || [],
    });
    setShowForm(true);
    // Cuộn lên đầu trang form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteCombo = async (id) => {
    if (window.confirm("Bạn chắc chắn muốn xóa combo này?")) {
      try {
        await axios.delete(`${API_URL}/combos/${id}`);
        alert("✅ Xóa combo thành công!");
        fetchCombos();
      } catch (error) {
        alert("❌ Lỗi xóa: " + (error.response?.data?.error || error.message));
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "",
      basePrice: "",
      image_url: "",
      discount: "",
      items: [],
    });
    setEditingCombo(null);
    setShowForm(false);
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  // Tính giá sau giảm (cho hiển thị)
  const calculateDiscountedPrice = (price, discount) => {
    if (!discount || discount <= 0) return price;
    return price * (1 - discount / 100);
  };

  return (
    <div className="combo-container">
      <h2 className="page-title">🎁 Quản Lý Combo</h2>

      <button className="btn-add-combo" onClick={() => setShowForm(!showForm)}>
        {showForm ? "❌ Đóng Form" : "➕ Thêm Combo Mới"}
      </button>

      {/* --- FORM SECTION --- */}
      {showForm && (
        <div className="combo-form">
          <h3>{editingCombo ? "✏️ Chỉnh Sửa Combo" : "➕ Tạo Combo Mới"}</h3>
          <form onSubmit={handleAddCombo}>
            <div className="form-group">
              <label>Tên Combo:</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Vd: Combo Sáng Tỉnh Táo"
                required
              />
            </div>

            <div className="form-group">
              <label>Mô Tả:</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Mô tả chi tiết combo"
                rows="3"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Danh Mục:</label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  placeholder="Vd: Combo"
                />
              </div>

              <div className="form-group">
                <label>Giá Gốc (VND):</label>
                <input
                  type="number"
                  name="basePrice"
                  value={formData.basePrice}
                  onChange={handleInputChange}
                  placeholder="0"
                  required
                />
              </div>

              <div className="form-group">
                <label>Giảm Giá (%):</label>
                <input
                  type="number"
                  name="discount"
                  value={formData.discount}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  max="100"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Ảnh URL:</label>
              <input
                type="text"
                name="image_url"
                value={formData.image_url}
                onChange={handleInputChange}
                placeholder="https://..."
              />
            </div>

            {/* --- Items List Input --- */}
            <div className="items-section">
              <h4>📦 Sản phẩm trong Combo</h4>
              {formData.items.length === 0 ? (
                <p className="no-items">Chưa có sản phẩm. Nhấn nút bên dưới để thêm!</p>
              ) : (
                <div className="items-list-input">
                  {formData.items.map((item, index) => (
                    <div key={`input-${index}`} className="item-input-row">
                      <input
                        type="text"
                        placeholder="Tên sản phẩm (Vd: Cà phê đen)"
                        value={item.productName}
                        onChange={(e) =>
                          handleItemChange(index, "productName", e.target.value)
                        }
                      />
                      <input
                        type="number"
                        placeholder="SL"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(index, "quantity", e.target.value)
                        }
                        min="1"
                        style={{ width: '70px' }}
                      />
                      <button
                        type="button"
                        className="btn-remove-item"
                        onClick={() => handleRemoveItem(index)}
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button
                type="button"
                className="btn-add-item"
                onClick={handleAddItem}
              >
                ➕ Thêm dòng sản phẩm
              </button>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-save">
                {editingCombo ? "🔄 Cập Nhật" : "💾 Lưu Combo"}
              </button>
              <button type="button" className="btn-cancel" onClick={resetForm}>
                ❌ Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- LIST SECTION --- */}
      {loading ? (
        <div className="loading">Đang tải dữ liệu...</div>
      ) : combos.length === 0 ? (
        <div className="empty-state">📭 Chưa có combo nào. Hãy tạo combo mới!</div>
      ) : (
        <div className="combo-grid">
          {combos.map((combo, index) => (
            // --- FIX LỖI DUPLICATE KEY TẠI ĐÂY ---
            // Sử dụng kết hợp ID và Index để đảm bảo key luôn duy nhất
            <div key={combo._id ? `${combo._id}-${index}` : index} className="combo-card">
              
              {/* Hình ảnh */}
              <div className="combo-image-container">
                {combo.image_url ? (
                   <img src={combo.image_url} alt={combo.name} className="combo-image" />
                ) : (
                   <div className="no-image">No Image</div>
                )}
                
                {combo.discount > 0 && (
                  <div className="discount-badge-large">
                    -{combo.discount}%
                  </div>
                )}
              </div>

              <div className="combo-info">
                <h3>{combo.name}</h3>
                <p className="category">
                  <span className="category-badge">{combo.category || "Combo"}</span>
                </p>
                <p className="description">{combo.description}</p>

                {/* Danh sách món trong combo */}
                {combo.items && combo.items.length > 0 && (
                  <div className="combo-items">
                    <strong>📦 Bao gồm:</strong>
                    <ul>
                      {combo.items.map((item, idx) => (
                        <li key={`${combo._id}-item-${idx}`}>
                          <span style={{fontWeight:'bold', color:'#e74c3c'}}>{item.quantity}x</span> {item.productName}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="price-section">
                  {combo.discount > 0 ? (
                    <>
                      <span className="original-price">
                        {formatMoney(combo.basePrice)}
                      </span>
                      <span className="discounted-price">
                        {formatMoney(calculateDiscountedPrice(combo.basePrice, combo.discount))}
                      </span>
                    </>
                  ) : (
                    <span className="discounted-price">{formatMoney(combo.basePrice)}</span>
                  )}
                </div>

                <div className="combo-actions">
                  <button
                    className="btn-edit"
                    onClick={() => handleEditCombo(combo)}
                  >
                    ✏️ Sửa
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => handleDeleteCombo(combo._id)}
                  >
                    🗑️ Xóa
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ComboManager;