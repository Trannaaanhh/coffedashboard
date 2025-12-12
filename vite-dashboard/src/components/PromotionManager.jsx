import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './PromotionManager.css';

const PromotionManager = () => {
  const [promotions, setPromotions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [stats, setStats] = useState({
    totalPromotions: 0,
    activePromotions: 0,
    totalDiscount: 0,
    upcomingPromotions: 0
  });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'PERCENT',
    scope: 'ORDER',
    value: '',
    startDate: '',
    endDate: '',
    minOrderTotal: '',
    isActive: true,
    productIds: [],
    categories: [],
    comboItems: []
  });

  const formatMoney = (amount) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      const response = await axios.get('http://localhost:3000/promotions');
      setPromotions(response.data);
      calculateStats(response.data);
    } catch (error) {
      toast.error('Failed to fetch promotions');
    }
  };

  const calculateStats = (promoList) => {
    const now = new Date();
    const active = promoList.filter(p => p.isActive && new Date(p.startDate) <= now && new Date(p.endDate) >= now);
    const upcoming = promoList.filter(p => p.isActive && new Date(p.startDate) > now);
    const totalDiscount = active.reduce((sum, p) => sum + (p.value || 0), 0);

    setStats({
      totalPromotions: promoList.length,
      activePromotions: active.length,
      totalDiscount: totalDiscount,
      upcomingPromotions: upcoming.length
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...formData };

      // Clean data based on scope to prevent sending irrelevant/invalid data
      if (data.scope === 'ORDER') {
        data.productIds = [];
        data.categories = [];
        data.comboItems = [];
      } else if (data.scope === 'PRODUCT') {
        data.categories = [];
        data.comboItems = [];
      } else if (data.scope === 'CATEGORY') {
        data.productIds = [];
        data.comboItems = [];
      } else if (data.scope === 'COMBO') {
        data.productIds = [];
        data.categories = [];
      }

      // Convert strings to numbers
      if (data.value) data.value = parseFloat(data.value);
      
      // Handle minOrderTotal: set to null if empty to avoid CastError (sending "" to Number field)
      if (data.minOrderTotal !== '' && data.minOrderTotal !== null && data.minOrderTotal !== undefined) {
        data.minOrderTotal = parseFloat(data.minOrderTotal);
      } else {
        data.minOrderTotal = null;
      }
      
      // Filter empty values
      if (data.productIds.length > 0) {
        data.productIds = data.productIds.map(id => id.trim()).filter(id => id !== '');
        // Validate ObjectIds (must be 24 hex characters)
        const invalidIds = data.productIds.filter(id => !/^[0-9a-fA-F]{24}$/.test(id));
        if (invalidIds.length > 0) {
          toast.error(`Invalid Product IDs: ${invalidIds.join(', ')}`);
          return;
        }
      }
      
      if (data.categories.length > 0) data.categories = data.categories.map(cat => cat.trim()).filter(cat => cat !== '');
      if (data.comboItems.length > 0) {
        data.comboItems = data.comboItems
          .map(item => ({
            productId: item.productId.trim(),
            requiredQty: parseInt(item.requiredQty)
          }))
          .filter(item => item.productId !== '' && !isNaN(item.requiredQty));
          
        // Validate ObjectIds in Combo
        const invalidComboIds = data.comboItems
          .filter(item => !/^[0-9a-fA-F]{24}$/.test(item.productId))
          .map(item => item.productId);
          
        if (invalidComboIds.length > 0) {
          toast.error(`Invalid Product IDs in Combo: ${invalidComboIds.join(', ')}`);
          return;
        }
      }

      if (editingPromotion) {
        await axios.put(`http://localhost:3000/promotions/${editingPromotion._id}`, data);
        toast.success('Promotion updated successfully');
      } else {
        await axios.post('http://localhost:3000/promotions', data);
        toast.success('Promotion created successfully');
      }
      fetchPromotions();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save promotion');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'PERCENT',
      scope: 'ORDER',
      value: '',
      startDate: '',
      endDate: '',
      minOrderTotal: '',
      isActive: true,
      productIds: [],
      categories: [],
      comboItems: []
    });
    setEditingPromotion(null);
    setShowForm(false);
  };

  const handleEdit = (promotion) => {
    setFormData({
      name: promotion.name,
      description: promotion.description || '',
      type: promotion.type,
      scope: promotion.scope,
      value: promotion.value.toString(),
      startDate: promotion.startDate.split('T')[0],
      endDate: promotion.endDate.split('T')[0],
      minOrderTotal: promotion.minOrderTotal?.toString() || '',
      isActive: promotion.isActive !== undefined ? promotion.isActive : true,
      productIds: promotion.productIds || [],
      categories: promotion.categories || [],
      comboItems: promotion.comboItems || []
    });
    setEditingPromotion(promotion);
    setShowForm(true);
  };

  const handleToggleActive = async (promotionId, currentStatus) => {
    try {
      await axios.put(`http://localhost:3000/promotions/${promotionId}`, {
        isActive: !currentStatus
      });
      toast.success(`Promotion ${!currentStatus ? 'enabled' : 'disabled'} successfully`);
      fetchPromotions();
    } catch (error) {
      toast.error('Failed to update promotion status');
    }
  };

  const addProductId = () => {
    setFormData(prev => ({
      ...prev,
      productIds: [...prev.productIds, '']
    }));
  };

  const updateProductId = (index, value) => {
    setFormData(prev => ({
      ...prev,
      productIds: prev.productIds.map((id, i) => i === index ? value : id)
    }));
  };

  const removeProductId = (index) => {
    setFormData(prev => ({
      ...prev,
      productIds: prev.productIds.filter((_, i) => i !== index)
    }));
  };

  const addCategory = () => {
    setFormData(prev => ({
      ...prev,
      categories: [...prev.categories, '']
    }));
  };

  const updateCategory = (index, value) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.map((cat, i) => i === index ? value : cat)
    }));
  };

  const removeCategory = (index) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.filter((_, i) => i !== index)
    }));
  };

  const addComboItem = () => {
    setFormData(prev => ({
      ...prev,
      comboItems: [...prev.comboItems, { productId: '', requiredQty: 1 }]
    }));
  };

  const updateComboItem = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      comboItems: prev.comboItems.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const removeComboItem = (index) => {
    setFormData(prev => ({
      ...prev,
      comboItems: prev.comboItems.filter((_, i) => i !== index)
    }));
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this promotion?')) {
      try {
        await axios.delete(`http://localhost:3000/promotions/${id}`);
        toast.success('Promotion deleted successfully');
        fetchPromotions();
      } catch (error) {
        toast.error('Failed to delete promotion');
      }
    }
  };

  return (
    <div className="promotion-manager">
      <div className="promotion-header">
        <h2>🎁 Promotion Manager</h2>
        <button
          className="btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ Add Promotion'}
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="stats-cards">
        <div className="stat-card total-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>{stats.totalPromotions}</h3>
            <p>Total Promotions</p>
          </div>
        </div>
        <div className="stat-card active-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.activePromotions}</h3>
            <p>Active Promotions</p>
          </div>
        </div>
        <div className="stat-card discount-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>{formatMoney(stats.totalDiscount)}</h3>
            <p>Total Discount Value</p>
          </div>
        </div>
        <div className="stat-card upcoming-card">
          <div className="stat-icon">⏰</div>
          <div className="stat-content">
            <h3>{stats.upcomingPromotions}</h3>
            <p>Upcoming Promotions</p>
          </div>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="promotion-form">
          <div className="form-row">
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label>Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              >
                <option value="PERCENT">Percent Discount</option>
                <option value="FIXED_AMOUNT">Fixed Amount</option>
                <option value="FIXED_PRICE_COMBO">Fixed Price Combo</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Scope *</label>
              <select
                value={formData.scope}
                onChange={(e) => setFormData(prev => ({ ...prev, scope: e.target.value }))}
              >
                <option value="ORDER">Order</option>
                <option value="PRODUCT">Product</option>
                <option value="CATEGORY">Category</option>
                <option value="COMBO">Combo</option>
              </select>
            </div>
            <div className="form-group">
              <label>Value *</label>
              <input
                type="number"
                step="0.01"
                value={formData.value}
                onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Start Date *</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label>End Date *</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              />
              <span>Active (Enable this promotion)</span>
            </label>
          </div>

          {formData.scope === 'ORDER' && (
            <div className="form-group">
              <label>Minimum Order Total</label>
              <input
                type="number"
                step="0.01"
                value={formData.minOrderTotal}
                onChange={(e) => setFormData(prev => ({ ...prev, minOrderTotal: e.target.value }))}
              />
            </div>
          )}

          {formData.scope === 'PRODUCT' && (
            <div className="form-group">
              <label>Product IDs</label>
              {formData.productIds.map((id, index) => (
                <div key={index} className="array-item">
                  <input
                    type="text"
                    value={id}
                    onChange={(e) => updateProductId(index, e.target.value)}
                    placeholder="Product ID"
                  />
                  <button type="button" onClick={() => removeProductId(index)}>Remove</button>
                </div>
              ))}
              <button type="button" onClick={addProductId}>Add Product</button>
            </div>
          )}

          {formData.scope === 'CATEGORY' && (
            <div className="form-group">
              <label>Categories</label>
              {formData.categories.map((cat, index) => (
                <div key={index} className="array-item">
                  <input
                    type="text"
                    value={cat}
                    onChange={(e) => updateCategory(index, e.target.value)}
                    placeholder="Category name"
                  />
                  <button type="button" onClick={() => removeCategory(index)}>Remove</button>
                </div>
              ))}
              <button type="button" onClick={addCategory}>Add Category</button>
            </div>
          )}

          {formData.scope === 'COMBO' && (
            <div className="form-group">
              <label>Combo Items</label>
              {formData.comboItems.map((item, index) => (
                <div key={index} className="combo-item">
                  <input
                    type="text"
                    value={item.productId}
                    onChange={(e) => updateComboItem(index, 'productId', e.target.value)}
                    placeholder="Product ID"
                  />
                  <input
                    type="number"
                    min="1"
                    value={item.requiredQty}
                    onChange={(e) => updateComboItem(index, 'requiredQty', parseInt(e.target.value))}
                    placeholder="Quantity"
                  />
                  <button type="button" onClick={() => removeComboItem(index)}>Remove</button>
                </div>
              ))}
              <button type="button" onClick={addComboItem}>Add Combo Item</button>
            </div>
          )}

          <div className="form-actions">
            <button type="submit" className="btn-primary">
              {editingPromotion ? 'Update' : 'Create'} Promotion
            </button>
            <button type="button" onClick={resetForm} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="promotions-list">
        <h3>Active Promotions</h3>
        {promotions.length === 0 ? (
          <p>No promotions found.</p>
        ) : (
          <div className="promotion-cards">
            {promotions.map(promo => (
              <div key={promo._id} className="promotion-card">
                <div className="promotion-header">
                  <h4>{promo.name}</h4>
                  <span className={`status-badge ${promo.isActive ? 'active' : 'inactive'}`}>
                    {promo.isActive ? '🟢 Active' : '🔴 Inactive'}
                  </span>
                </div>
                <p>{promo.description}</p>
                <div className="promotion-details">
                  <span>Type: {promo.type}</span>
                  <span>Scope: {promo.scope}</span>
                  <span>Value: {promo.value}{promo.type === 'PERCENT' ? '%' : ' VND'}</span>
                  <span>Valid: {new Date(promo.startDate).toLocaleDateString()} - {new Date(promo.endDate).toLocaleDateString()}</span>
                </div>
                <div className="promotion-actions">
                  <button
                    onClick={() => handleToggleActive(promo._id, promo.isActive)}
                    className={`btn-toggle ${promo.isActive ? 'btn-disable' : 'btn-enable'}`}
                  >
                    {promo.isActive ? 'Disable' : 'Enable'}
                  </button>
                  <button onClick={() => handleEdit(promo)} className="btn-edit">Edit</button>
                  <button onClick={() => handleDelete(promo._id)} className="btn-delete">Delete</button>
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