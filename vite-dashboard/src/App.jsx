import React, { useState } from 'react'


import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import RevenueManager from './components/RevenueManager'; // Import RevenueManager
import OrderManager from './components/OrderManager'
import PromotionManager from './components/PromotionManager'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('orders'); // State để quản lý tab đang hoạt động

  return (
    <div className="App">
      <ToastContainer />

      <div className="app-header">
        <div className="header-left"><h1>☕ Coffee Shop Admin</h1></div>
        <div className="header-right">
          {/* Vì bỏ login nên để cứng tên Admin */}
          <span className="user-info">👤 Administrator</span>
        </div>
      </div>

      {/* Chỉ còn 1 tab duy nhất nên để active mặc định */}
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

      <div className="tab-content">
        {activeTab === 'orders' && <OrderManager />}
        {activeTab === 'revenue' && <RevenueManager />}
        {activeTab === 'promotions' && <PromotionManager />}
      </div>
    </div>
  )
}

export default App;