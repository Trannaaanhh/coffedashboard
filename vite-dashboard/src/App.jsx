import { useState, useEffect } from 'react'
import { io } from 'socket.io-client'

// [MỚI] Import thư viện Toastify
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import LoginPage from './components/LoginPage'
import OrderManager from './components/OrderManager'
import ComboManager from './components/ComboManager'
import RevenueManager from './components/RevenueManager'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('orders')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const SOCKET_URL = "http://localhost:3000"; 

  useEffect(() => {
    // 1. Check Login
    const token = localStorage.getItem('authToken')
    const userData = localStorage.getItem('user')
    if (token && userData) {
      setIsLoggedIn(true)
      setUser(JSON.parse(userData))
    }
    setLoading(false)

    // 2. KẾT NỐI SOCKET
    const socket = io(SOCKET_URL, { transports: ['websocket'] });

    socket.on('connect', () => console.log("🟢 Socket Connected:", socket.id));

    // 3. LẮNG NGHE SỰ KIỆN & HIỂN THỊ TOASTIFY
    socket.on("new_order", (data) => {
      console.log("📩 New Order:", data);
      
      // [MỚI] Gọi hàm toast của thư viện
      toast.success(
        <div>
          <h4>🔔 {data.title}</h4>
          <p>{data.message}</p>
        </div>, 
        {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "colored", // Giao diện màu sắc đẹp
        }
      );

       const audio = new Audio('https://www.soundjay.com/buttons/sounds/button-3.mp3');
       audio.play().catch(() => {});
    });

    return () => socket.disconnect();
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

  if (loading) return <div className="loading-screen">Loading...</div>
  if (!isLoggedIn) return <LoginPage onLoginSuccess={handleLoginSuccess} />

  return (
    <div className="App">
      <ToastContainer />

      <div className="app-header">
        <div className="header-left"><h1>☕ Coffee Shop Admin</h1></div>
        <div className="header-right">
          <span className="user-info">👤 {user?.name}</span>
          <button className="logout-btn" onClick={handleLogout}>🚪</button>
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
        <button 
          className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`} 
          onClick={() => setActiveTab('stats')}
        >
          📊 Thống Kê
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'orders' && <OrderManager />}
        {activeTab === 'combos' && <ComboManager />}
        {activeTab === 'stats' && <RevenueManager />}
      </div>
    </div>
  )
}

export default App;