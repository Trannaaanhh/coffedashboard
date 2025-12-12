import React, { useState } from 'react'

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import RevenueManager from './components/RevenueManager';
import OrderManager from './components/OrderManager';
import PromotionManager from './components/PromotionManager';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('orders');

  return (
    <div className="App">
      <ToastContainer />

      {/* HEADER */}
      <div className="app-header">
        <div className="header-left">
          <h1>☕ Coffee Shop Admin</h1>
        </div>
        <div className="header-right">
          <span className="user-info">👤 Administrator</span>
        </div>
      </div>

      {/* TABS */}
      <div className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          📦 Đơn Hàng
        </button>
        <button
          className={`tab-btn ${activeTab === 'revenue' ? 'active' : ''}`}
          onClick={() => setActiveTab('revenue')}
        >
          📊 Doanh Thu
        </button>
        <button
          className={`tab-btn ${activeTab === 'promotions' ? 'active' : ''}`}
          onClick={() => setActiveTab('promotions')}
        >
          🎁 Khuyến Mãi
        </button>
      </div>

      {/* CONTENT */}
      <div className="tab-content">
        {activeTab === 'orders' && <OrderManager />}
        {activeTab === 'revenue' && <RevenueManager />}
        {activeTab === 'promotions' && <PromotionManager />}
      </div>
    </div>
  );
}

export default App;
