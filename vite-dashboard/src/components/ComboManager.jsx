import React, { useState, useEffect } from "react";
import axios from "axios";
import "./ComboManager.css";

const ComboManager = () => {
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCombo, setEditingCombo] = useState(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    basePrice: "",
    image_url: "",
    discount: "",
    items: [],
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const API_URL = "http://localhost:3000";

  const fetchCombos = async () => {
    try {
      const res = await axios.get(`${API_URL}/combos`);
      const sortedCombos = Array.isArray(res.data) ? res.data.reverse() : [];
      setCombos(sortedCombos);
    } catch (error) {
      console.error("Lỗi tải combo:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCombos();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setFormData({ ...formData, image_url: reader.result });
      };
      reader.readAsDataURL(file);
    }
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
      // Prepare data with proper type conversion
      const dataToSend = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        basePrice: parseInt(formData.basePrice) || 0,
        image_url: formData.image_url,
        discount: parseInt(formData.discount) || 0,
        items: formData.items || [],
      };

      if (editingCombo) {
        await axios.put(`${API_URL}/combos/${editingCombo._id}`, dataToSend);
        alert("✅ Cập nhật thành công!");
      } else {
        await axios.post(`${API_URL}/combos`, dataToSend);
        alert("✅ Tạo mới thành công!");
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
    setImagePreview(combo.image_url);
    setImageFile(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteCombo = async (id) => {
    if (window.confirm("Bạn chắc chắn muốn xóa combo này?")) {
      try {
        console.log("Deleting combo with ID:", id, "Type:", typeof id);
        await axios.delete(`${API_URL}/combos/${id}`);
        alert("✅ Đã xóa!");
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
    setImageFile(null);
    setImagePreview("");
  };

  const formatMoney = (amount) => {
    const num = parseFloat(amount) || 0;
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num);
  };

  return (
    <div className="combo-container">
      <h2 className="page-title">🎁 Quản Lý Combo</h2>

      <button className="btn-add-combo" onClick={() => setShowForm(!showForm)}>
        {showForm ? "❌ Đóng Form" : "➕ Thêm Combo Mới"}
      </button>

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
                  min="0"
                  max="100"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Ảnh Combo:</label>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ flex: 1 }}
                />
                <span style={{ fontSize: '12px', color: '#999' }}>hoặc</span>
              </div>
              <input
                type="text"
                name="image_url"
                value={typeof formData.image_url === 'string' && !formData.image_url.startsWith('data:') ? formData.image_url : ''}
                onChange={handleInputChange}
                placeholder="Dán URL ảnh từ internet..."
              />
              {imagePreview && (
                <div style={{ marginTop: '10px', textAlign: 'center' }}>
                  <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '5px' }} />
                </div>
              )}
            </div>

            <div className="items-section">
              <h4>📦 Sản phẩm trong Combo</h4>
              {formData.items.length === 0 ? (
                <p className="no-items">Chưa có sản phẩm.</p>
              ) : (
                <div className="items-list">
                  {formData.items.map((item, index) => (
                    <div key={index} className="item-input-row">
                      <input
                        type="text"
                        placeholder="Tên sản phẩm"
                        value={item.productName}
                        onChange={(e) => handleItemChange(index, "productName", e.target.value)}
                      />
                      <input
                        type="number"
                        placeholder="SL"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                        min="1"
                        style={{ width: '70px' }}
                      />
                      <button type="button" className="btn-remove-item" onClick={() => handleRemoveItem(index)}>
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button type="button" className="btn-add-item" onClick={handleAddItem}>
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

      {loading ? (
        <div className="loading">Đang tải dữ liệu...</div>
      ) : combos.length === 0 ? (
        <div className="empty-state">📭 Chưa có combo nào.</div>
      ) : (
        <div className="combo-grid">
          {combos.map((combo, index) => (
            <div key={combo._id} className="combo-card">
              <div className="combo-image-container">
                {combo.image_url ? (
                   <img src={combo.image_url} alt={combo.name} className="combo-image" />
                ) : (
                   <div className="no-image">No Image</div>
                )}
                {combo.discount > 0 && (
                  <div className="discount-badge-large">-{combo.discount}%</div>
                )}
              </div>

              <div className="combo-info">
                <h3>{combo.name}</h3>
                <p className="category"><span className="category-badge">{combo.category}</span></p>
                <p className="description">{combo.description}</p>

                {combo.items?.length > 0 && (
                  <div className="combo-items">
                    <strong>📦 Bao gồm:</strong>
                    <ul>
                      {combo.items.map((item, idx) => (
                        <li key={idx}>
                          <b>{item.quantity}x</b> {item.productName}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="price-section">
                  {combo.discount && combo.discount > 0 ? (
                    <>
                      <span className="original-price">{formatMoney(combo.basePrice || 0)}</span>
                      <span className="discounted-price">
                        {formatMoney(combo.discountedPrice || Math.round((combo.basePrice || 0) * (1 - (combo.discount || 0) / 100)))}
                      </span>
                    </>
                  ) : (
                    <span className="discounted-price">{formatMoney(combo.basePrice || 0)}</span>
                  )}
                </div>

                <div className="combo-actions">
                  <button className="btn-edit" onClick={() => handleEditCombo(combo)}>✏️ Sửa</button>
                  <button className="btn-delete" onClick={() => handleDeleteCombo(combo._id)}>🗑️ Xóa</button>
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