import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import './RevenueManager.css';

// Đăng ký các component của Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement
);

const RevenueManager = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('day'); // 'day', 'month', 'year'

  const API_URL = "http://localhost:3000"; // Đổi port nếu cần

  useEffect(() => {
    fetchStats();
  }, [timeFilter]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      // Gọi API vừa tạo ở Bước 2
      const res = await axios.get(`${API_URL}/orders/stats/revenue`, {
        params: { type: timeFilter }
      });
      setStats(res.data);
    } catch (error) {
      console.error("Lỗi tải thống kê:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  // --- Cấu hình Biểu đồ Cột (Doanh thu theo thời gian) ---
  const barChartData = {
    labels: stats?.chartData?.map(item => item._id) || [],
    datasets: [
      {
        label: 'Doanh thu (VND)',
        data: stats?.chartData?.map(item => item.revenue) || [],
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  // --- Cấu hình Biểu đồ Tròn (Top sản phẩm) ---
  const pieChartData = {
    labels: stats?.topProducts?.map(p => p._id) || [],
    datasets: [
      {
        label: 'Số lượng bán',
        data: stats?.topProducts?.map(p => p.totalSold) || [],
        backgroundColor: [
          '#ff6384',
          '#36a2eb',
          '#ffce56',
          '#4bc0c0',
          '#9966ff',
        ],
        borderWidth: 1,
      },
    ],
  };

  if (loading) return <div className="loading-spinner">📊 Đang tải thống kê...</div>;

  return (
    <div className="revenue-container">
      <div className="rev-header">
        <h2 className="page-title">📊 Thống Kê Doanh Thu</h2>
        <div className="filter-group">
          <button className={`filter-btn ${timeFilter === 'day' ? 'active' : ''}`} onClick={() => setTimeFilter('day')}>Theo Ngày</button>
          <button className={`filter-btn ${timeFilter === 'month' ? 'active' : ''}`} onClick={() => setTimeFilter('month')}>Theo Tháng</button>
          <button className={`filter-btn ${timeFilter === 'year' ? 'active' : ''}`} onClick={() => setTimeFilter('year')}>Theo Năm</button>
        </div>
      </div>

      {/* 1. Các thẻ tổng quan */}
      <div className="summary-cards">
        <div className="card revenue-card">
          <h3>💰 Tổng Doanh Thu (Thực tế)</h3>
          <p>{formatMoney(stats?.summary?.totalRevenue || 0)}</p>
          <small>Chỉ tính đơn "Delivered" & "Completed"</small>
        </div>
        <div className="card order-card">
          <h3>📦 Tổng Đơn Thành Công</h3>
          <p>{stats?.summary?.totalOrders || 0}</p>
          <small>Đơn hàng đã hoàn tất</small>
        </div>
        <div className="card avg-card">
          <h3>📈 Giá Trị Trung Bình/Đơn</h3>
          <p>
            {stats?.summary?.totalOrders > 0 
              ? formatMoney(Math.round(stats.summary.totalRevenue / stats.summary.totalOrders)) 
              : '0 ₫'}
          </p>
        </div>
      </div>

      <div className="charts-grid">
        {/* 2. Biểu đồ doanh thu */}
        <div className="chart-box main-chart">
          <h3>Biểu đồ doanh thu ({timeFilter === 'day' ? 'Ngày' : timeFilter === 'month' ? 'Tháng' : 'Năm'})</h3>
          {stats?.chartData?.length > 0 ? (
             <Bar data={barChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          ) : (
             <div className="no-data">Chưa có dữ liệu cho mốc thời gian này</div>
          )}
        </div>

        {/* 3. Top sản phẩm & Bảng chi tiết */}
        <div className="chart-box side-chart">
          <h3>🏆 Top 5 Món Bán Chạy</h3>
          <div className="pie-wrapper">
             {stats?.topProducts?.length > 0 ? <Pie data={pieChartData} /> : <div className="no-data">Chưa có dữ liệu</div>}
          </div>
          
          <div className="top-products-list">
            <ul>
              {stats?.topProducts?.map((prod, idx) => (
                <li key={idx}>
                  <span className="rank">#{idx + 1}</span>
                  <span className="prod-name">{prod._id}</span>
                  <span className="prod-qty">{prod.totalSold} ly</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueManager;