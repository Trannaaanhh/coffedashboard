import React, { useState } from "react";
import axios from "axios";
import "./LoginPage.css";

const LoginPage = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const API_URL = "http://localhost:3000";

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/login`, {
        username,
        password,
      });

      if (response.data.token) {
        const userData = {
          token: response.data.token,
          user: response.data.user,
        };

        // Check if user is admin or staff
        if (
          response.data.user.role === "admin" ||
          response.data.user.role === "staff"
        ) {
          // Save to localStorage
          localStorage.setItem("authToken", response.data.token);
          localStorage.setItem("user", JSON.stringify(response.data.user));

          // Call parent callback
          onLoginSuccess(userData);
        } else {
          setError("❌ Bạn không có quyền truy cập! Chỉ admin và staff được phép.");
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "❌ Đăng nhập thất bại! Kiểm tra username/password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>☕ Coffee Shop Admin</h1>
          <p>Hệ Thống Quản Lý Đơn Hàng & Combo</p>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label>👤 Tên Đăng Nhập</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập username"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>🔐 Mật Khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập password"
              required
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "⏳ Đang đăng nhập..." : "🔓 Đăng Nhập"}
          </button>
        </form>

        <div className="login-footer">
          <p className="demo-info">
            <strong>📝 Đăng Nhập với tài khoản có role: Admin hoặc Staff</strong>
          </p>
          <p style={{ fontSize: "13px", color: "#999", marginTop: "10px" }}>
            💡 Tài khoản được lưu trong MongoDB - Chỉ Admin & Staff được quyền truy cập
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;