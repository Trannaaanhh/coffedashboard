import { useState, useEffect } from 'react'
import LoginPage from './components/LoginPage'
import OrderManager from './components/OrderManager'
import ComboManager from './components/ComboManager'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('orders')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Check if user is already logged in on mount
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