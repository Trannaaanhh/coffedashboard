import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './PromotionManager.css';

const PromotionManager = () => {
  const [promotions, setPromotions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);

  const API_URL = "http://localhost:3000";

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "PERCENT",
    scope: "ORDER",
    value: "",
    startDate: "",
    endDate: "",
    minOrderTotal: "",
    isActive: true,
    productIds: [],
    categories: [],
    comboItems: []
  });

  const fetchPromotions = async () => {
    try {
      const res = await axios.get(`${API_URL}/promotions`);
      setPromotions(res.data);
    } catch (err) {
      toast.error("Failed to load promotions");
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const data = { ...formData };

      data.value = Number(data.value);
      if (data.minOrderTotal) data.minOrderTotal = Number(data.minOrderTotal);

      // convert productIds
      if (data.productIds.length > 0) {
        data.productIds = data.productIds.map(id => id.trim());
      }

      // convert combo items
      if (data.comboItems.length > 0) {
        data.comboItems = data.comboItems.map(i => ({
          productId: i.productId.trim(),
          requiredQty: Number(i.requiredQty)
        }));
      }

      if (editingPromotion) {
        await axios.put(`${API_URL}/promotions/${editingPromotion._id}`, data);
        toast.success("Updated successfully");
      } else {
        await axios.post(`${API_URL}/promotions`, data);
        toast.success("Created successfully");
      }

      fetchPromotions();
      resetForm();

    } catch (err) {
      toast.error(err.response?.data?.error || "Error while saving promotion");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      type: "PERCENT",
      scope: "ORDER",
      value: "",
      startDate: "",
      endDate: "",
      minOrderTotal: "",
      isActive: true,
      productIds: [],
      categories: [],
      comboItems: []
    });
    setEditingPromotion(null);
    setShowForm(false);
  };

  const handleEdit = (promo) => {
    setFormData({
      name: promo.name,
      description: promo.description || "",
      type: promo.type,
      scope: promo.scope,
      value: promo.value.toString(),
      startDate: promo.startDate.split("T")[0],
      endDate: promo.endDate.split("T")[0],
      minOrderTotal: promo.minOrderTotal?.toString() || "",
      isActive: promo.isActive,
      productIds: promo.productIds || [],
      categories: promo.categories || [],
      comboItems: promo.comboItems || []
    });

    setEditingPromotion(promo);
    setShowForm(true);
  };

  const handleToggleActive = async (id, curr) => {
    try {
      await axios.put(`${API_URL}/promotions/${id}`, {
        isActive: !curr
      });
      fetchPromotions();
    } catch (err) {
      toast.error("Failed to toggle");
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/promotions/${id}`);
      toast.success("Deleted");
      fetchPromotions();
    } catch {
      toast.error("Delete failed");
    }
  };

  // -------- dynamic fields ----------
  const addProductId = () =>
    setFormData(prev => ({ ...prev, productIds: [...prev.productIds, ""] }));

  const updateProductId = (i, val) =>
    setFormData(prev => ({
      ...prev,
      productIds: prev.productIds.map((x, idx) => (idx === i ? val : x))
    }));

  const removeProductId = (i) =>
    setFormData(prev => ({
      ...prev,
      productIds: prev.productIds.filter((_, idx) => idx !== i)
    }));

  const addCategory = () =>
    setFormData(prev => ({ ...prev, categories: [...prev.categories, ""] }));

  const updateCategory = (i, val) =>
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.map((x, idx) => (idx === i ? val : x))
    }));

  const removeCategory = (i) =>
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.filter((_, idx) => idx !== i)
    }));

  const addComboItem = () =>
    setFormData(prev => ({
      ...prev,
      comboItems: [...prev.comboItems, { productId: "", requiredQty: 1 }]
    }));

  const updateComboItem = (i, field, val) =>
    setFormData(prev => ({
      ...prev,
      comboItems: prev.comboItems.map((it, idx) =>
        idx === i ? { ...it, [field]: val } : it
      )
    }));

  const removeComboItem = (i) =>
    setFormData(prev => ({
      ...prev,
      comboItems: prev.comboItems.filter((_, idx) => idx !== i)
    }));

  return (
    <div className="promotion-manager">

      {/* BUTTON + HEADER */}
      <div className="promotion-header">
        <h2>🎁 Promotion Manager</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ Add Promotion"}
        </button>
      </div>

      {/* FORM */}
      {showForm && (
        <form onSubmit={handleSubmit} className="promotion-form">

          {/* BASIC INFO */}
          <div className="form-row">
            <div className="form-group">
              <label>Name *</label>
              <input value={formData.name}
                onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                required />
            </div>

            <div className="form-group">
              <label>Type *</label>
              <select value={formData.type}
                onChange={(e) => setFormData(p => ({ ...p, type: e.target.value }))}>
                <option value="PERCENT">Percent</option>
                <option value="FIXED_AMOUNT">Fixed Amount</option>
                <option value="FIXED_PRICE_COMBO">Fixed Price Combo</option>
              </select>
            </div>
          </div>

          {/* SCOPE + VALUE */}
          <div className="form-row">
            <div className="form-group">
              <label>Scope *</label>
              <select value={formData.scope}
                onChange={(e) => setFormData(p => ({ ...p, scope: e.target.value }))}>
                <option value="ORDER">Order</option>
                <option value="PRODUCT">Product</option>
                <option value="CATEGORY">Category</option>
                <option value="COMBO">Combo</option>
              </select>
            </div>

            <div className="form-group">
              <label>Value *</label>
              <input type="number" value={formData.value}
                onChange={(e) => setFormData(p => ({ ...p, value: e.target.value }))} />
            </div>
          </div>

          {/* DATES */}
          <div className="form-row">
            <div className="form-group">
              <label>Start Date *</label>
              <input type="date" value={formData.startDate}
                onChange={(e) => setFormData(p => ({ ...p, startDate: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>End Date *</label>
              <input type="date" value={formData.endDate}
                onChange={(e) => setFormData(p => ({ ...p, endDate: e.target.value }))} />
            </div>
          </div>

          {/* DESCRIPTION */}
          <div className="form-group">
            <label>Description</label>
            <textarea value={formData.description}
              onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))} />
          </div>

          {/* ACTIVE */}
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" checked={formData.isActive}
                onChange={(e) => setFormData(p => ({ ...p, isActive: e.target.checked }))} />
              Enable this promotion
            </label>
          </div>

          {/* SCOPE FIELDS */}
          {formData.scope === "ORDER" && (
            <div className="form-group">
              <label>Min Order Total</label>
              <input type="number"
                value={formData.minOrderTotal}
                onChange={(e) => setFormData(p => ({ ...p, minOrderTotal: e.target.value }))} />
            </div>
          )}

          {formData.scope === "PRODUCT" && (
            <div className="form-group">
              <label>Product IDs (Mongo ObjectId)</label>
              {formData.productIds.map((id, idx) => (
                <div key={idx} className="array-item">
                  <input value={id}
                    onChange={(e) => updateProductId(idx, e.target.value)}
                    placeholder="Product ObjectId" />
                  <button type="button" onClick={() => removeProductId(idx)}>Remove</button>
                </div>
              ))}
              <button type="button" onClick={addProductId}>Add Product</button>
            </div>
          )}

          {formData.scope === "CATEGORY" && (
            <div className="form-group">
              <label>Categories</label>
              {formData.categories.map((cat, idx) => (
                <div key={idx} className="array-item">
                  <input value={cat}
                    onChange={(e) => updateCategory(idx, e.target.value)}
                    placeholder="Category" />
                  <button type="button" onClick={() => removeCategory(idx)}>Remove</button>
                </div>
              ))}
              <button type="button" onClick={addCategory}>Add Category</button>
            </div>
          )}

          {formData.scope === "COMBO" && (
            <div className="form-group">
              <label>Combo Items</label>
              {formData.comboItems.map((item, idx) => (
                <div key={idx} className="combo-item">
                  <input value={item.productId}
                    onChange={(e) => updateComboItem(idx, "productId", e.target.value)}
                    placeholder="Product ObjectId" />

                  <input type="number" min="1"
                    value={item.requiredQty}
                    onChange={(e) => updateComboItem(idx, "requiredQty", e.target.value)} />

                  <button type="button" onClick={() => removeComboItem(idx)}>Remove</button>
                </div>
              ))}
              <button type="button" onClick={addComboItem}>Add Combo Item</button>
            </div>
          )}

          {/* BUTTONS */}
          <div className="form-actions">
            <button type="submit" className="btn-primary">
              {editingPromotion ? "Update" : "Create"}
            </button>
            <button type="button" className="btn-secondary" onClick={resetForm}>
              Cancel
            </button>
          </div>

        </form>
      )}

      {/* LIST */}
      <div className="promotions-list">
        <h3>Active Promotions</h3>

        {promotions.length === 0 ? (
          <p>No promotions</p>
        ) : (
          <div className="promotion-cards">

            {promotions.map(promo => (
              <div key={promo._id} className="promotion-card">
                <div className="promotion-header">
                  <h4>{promo.name}</h4>
                  <span className={`status-badge ${promo.isActive ? "active" : "inactive"}`}>
                    {promo.isActive ? "🟢 Active" : "🔴 Inactive"}
                  </span>
                </div>

                <p>{promo.description}</p>

                <div className="promotion-details">
                  <span>Type: {promo.type}</span>
                  <span>Scope: {promo.scope}</span>
                  <span>Value: {promo.value}</span>
                  <span>
                    Valid: {new Date(promo.startDate).toLocaleDateString()} -{" "}
                    {new Date(promo.endDate).toLocaleDateString()}
                  </span>
                </div>

                <div className="promotion-actions">
                  <button
                    className={`btn-toggle ${promo.isActive ? "btn-disable" : "btn-enable"}`}
                    onClick={() => handleToggleActive(promo._id, promo.isActive)}
                  >
                    {promo.isActive ? "Disable" : "Enable"}
                  </button>

                  <button className="btn-edit" onClick={() => handleEdit(promo)}>
                    Edit
                  </button>

                  <button className="btn-delete" onClick={() => handleDelete(promo._id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}

          </div>
        )}
      </div>

    </div>
  );
};

export default PromotionManager;
