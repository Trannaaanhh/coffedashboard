import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import './RevenueManager.css';

const RevenueManager = () => {
  const [dailyData, setDailyData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ totalRevenue: 0, totalOrders: 0 });

  const API_URL = "http://localhost:3000";
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#FF4444', '#8884d8'];

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/orders/stats/revenue`);

      const daily = res.data.daily.map(item => ({
        date: item._id,
        revenue: item.totalRevenue,
        orders: item.orderCount // Sử dụng orderCount từ API
      }));

      const status = res.data.status.map(item => ({
        name: item._id,
        value: item.count
      }));

      const totalRev = daily.reduce((acc, curr) => acc + curr.revenue, 0);
      const totalOrd = daily.reduce((acc, curr) => acc + curr.orders, 0);

      setDailyData(daily);
      setStatusData(status);
      setSummary({ totalRevenue: totalRev, totalOrders: totalOrd });

    } catch (error) {
      console.error("Lỗi:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (val) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  
  const formatNumber = (val) => // Thêm hàm format cho số lượng đơn
    new Intl.NumberFormat('vi-VN').format(val);

  return (
    <div className="stats-container">
      <h2 className="stats-title">📊 Báo Cáo Doanh Thu</h2>

      {loading ? (
        <div className="loading-stats">⏳ Đang tải dữ liệu...</div>
      ) : (
        <>
          {/* SUMMARY CARDS */}
          <div className="summary-cards">
            <div className="card-item">
              <h3>💰 Tổng Doanh Thu (Đã giao)</h3>
              <p>{formatMoney(summary.totalRevenue)}</p>
            </div>

            <div className="card-item" style={{ background: 'linear-gradient(135deg, #F2994A 0%, #F2C94C 100%)' }}>
              <h3>📦 Tổng Đơn Hàng (Đã giao)</h3>
              <p>{summary.totalOrders} Đơn</p>
            </div>
          </div>

          {/* CHARTS */}
          <div className="charts-grid">

            {/* DAILY REVENUE */}
            <div className="chart-box">
              <h4 className="chart-title">📈 Doanh thu & Số đơn theo ngày</h4> {/* Cập nhật tiêu đề */}

              <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer minWidth={0} minHeight={0}>
                  <BarChart data={dailyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" tickFormatter={(value) => new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(value)} /> {/* Trục Y cho doanh thu */}
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" /> {/* Trục Y cho số đơn */}
                    <Tooltip formatter={(value, name) => name === 'Doanh thu' ? formatMoney(value) : `${formatNumber(value)} đơn`} /> {/* Cập nhật formatter cho Tooltip */}
                    <Legend />
                    <Bar yAxisId="left" dataKey="revenue" name="Doanh thu" fill="#8884d8" radius={[5, 5, 0, 0]} /> {/* Bar cho doanh thu */}
                    <Bar yAxisId="right" dataKey="orders" name="Số đơn" fill="#82ca9d" radius={[5, 5, 0, 0]} /> {/* Bar cho số đơn */}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ORDER STATUS */}
            <div className="chart-box">
              <h4 className="chart-title">🍕 Tỷ lệ trạng thái đơn</h4>

              <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
};

export default RevenueManager;