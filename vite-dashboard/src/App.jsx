import { useState, useEffect } from 'react'
import LoginPage from './components/LoginPage'
import OrderManager from './components/OrderManager'
import ComboManager from './components/ComboManager'
import './App.css'

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { io } from "socket.io-client";

function App() {
  const [activeTab, setActiveTab] = useState('orders')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Kết nối socket toàn cục để nhận thông báo dù đang ở tab nào
  useEffect(() => {
    if (isLoggedIn) {
      const socket = io("http://localhost:3000"); // URL Backend của bạn

      socket.on("newOrder", (newOrder) => {
        // [MỚI] Hiển thị thông báo Toast
        toast.success(`🔔 Có đơn hàng mới: ${newOrder.totalAmount.toLocaleString()}đ`, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
        });
        // Bạn có thể thêm âm thanh thông báo tại đây nếu muốn
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [isLoggedIn]);

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    const userData = localStorage.getItem('user')
    
    if (token && userData) {
      setIsLoggedIn(true)
      setUser(JSON.parse(userData))
    }
    setLoading(false)
  }, [])

  const handleLoginSuccess = (userData) => {
    setUser(userData.user)
    setIsLoggedIn(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    setIsLoggedIn(false)
    setUser(null)
    setActiveTab('orders')
  }

  if (loading) {
    return <div className="loading-screen">Loading...</div>
  }

  if (!isLoggedIn) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />
  }

  return (
    <div className="App">
      {/* [MỚI] Container chứa các thông báo popup */}
      <ToastContainer />

      <div className="app-header">
        <div className="header-left">
          <h1>☕ Coffee Shop Admin Dashboard</h1>
        </div>
        <div className="header-right">
          <span className="user-info">
            👤 {user?.name || user?.username} ({user?.role?.toUpperCase()})
          </span>
          <button className="logout-btn" onClick={handleLogout}>
            🚪 Đăng Xuất
          </button>
        </div>
      </div>

      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          📦 Đơn Hàng
        </button>
        <button 
          className={`tab-btn ${activeTab === 'combos' ? 'active' : ''}`}
          onClick={() => setActiveTab('combos')}
        >
          🎁 Combo
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'orders' && <OrderManager />}
        {activeTab === 'combos' && <ComboManager />}
      </div>
    </div>
  )
}

export default App