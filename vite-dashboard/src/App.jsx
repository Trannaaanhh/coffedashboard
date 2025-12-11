import React from 'react'


import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Không cần import LoginPage nữa
import OrderManager from './components/OrderManager'
import './App.css'

function App() {

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
        <button className="tab-btn active">
          📦 Đơn Hàng
        </button>
      </div>

      <div className="tab-content">
        <OrderManager />
      </div>
    </div>
  )
}

export default App;