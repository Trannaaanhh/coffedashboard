import React, { useState, useEffect } from "react";
import axios from "axios";
import "./OrderManager.css";

// Import hình ảnh
import imgBacXiu from "../assets/bac-xiu.jpg";
import imgLava from "../assets/banh-socola-lava.jpg";
import imgCroissant from "../assets/banh-sung-bo-croissants.jpg";
import imgCaPheSuaDa from "../assets/ca_phe_sua_da.jpg";
import imgCaPheDen from "../assets/ca-phe-den.jpg";
import imgEspresso from "../assets/espresso-macchiato.jpg";
import imgLatte from "../assets/latte-caramel-da-xay.jpg";
import imgRedVelvet from "../assets/red-velvet-cupcake.jpg";
import imgSinhToBo from "../assets/sinh-to-bo.jpg";
import imgTiramisu from "../assets/tiramisiu.jpg";
import imgTraDao from "../assets/tra-dao-cam-sa.jpg";
import imgTraSua from "../assets/tra-sua.jpg";

const OrderManager = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [tempStatus, setTempStatus] = useState("");

  const API_URL = "http://localhost:3000";

  // --- HÀM QUAN TRỌNG: LẤY ID CHUẨN TỪ MONGODB EXPORT ---
  const getOrderId = (order) => {
    if (!order || !order._id) return "";
    if (typeof order._id === 'string') return order._id;
    if (typeof order._id === 'object' && order._id.$oid) return order._id.$oid;
    return "";
  };

  const getProductImage = (productName) => {
    if (!productName) return imgCaPheDen; 
    const name = productName.toLowerCase(); 

    if (name.includes("combo")) {
        if (name.includes("sáng") || name.includes("tỉnh")) return imgCaPheDen;
        if (name.includes("trà") || name.includes("chill")) return imgTraDao;
        if (name.includes("béo")) return imgBacXiu;
        if (name.includes("bữa xế")) return imgSinhToBo;
        if (name.includes("đôi") || name.includes("bạn")) return imgTraSua;
        return imgCroissant;
    }

    if (name.includes("bạc xỉu")) return imgBacXiu;
    if (name.includes("sữa đá") || name.includes("nâu đá")) return imgCaPheSuaDa;
    if (name.includes("đen") || name.includes("black")) return imgCaPheDen;
    if (name.includes("espresso") || name.includes("macchiato")) return imgEspresso;
    if (name.includes("latte") || name.includes("caramel")) return imgLatte;
    if (name.includes("trà đào") || name.includes("cam sả")) return imgTraDao;
    if (name.includes("trà sữa") || name.includes("trân châu")) return imgTraSua;
    if (name.includes("sinh tố") || name.includes("bơ")) return imgSinhToBo;
    if (name.includes("sung bò") || name.includes("croissant")) return imgCroissant;
    if (name.includes("lava") || name.includes("socola")) return imgLava;
    if (name.includes("red velvet") || name.includes("cupcake")) return imgRedVelvet;
    if (name.includes("tiramisu")) return imgTiramisu;

    return imgCaPheDen;
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/orders`);
      
      // Xử lý dữ liệu để tương thích với format $date của Mongo Export
      const processedOrders = res.data.map(order => ({
        ...order,
        orderDate: order.orderDate?.$date ? order.orderDate.$date : order.orderDate
      }));

      const sortedOrders = processedOrders.sort((a, b) => 
        new Date(b.orderDate) - new Date(a.orderDate)
      );
      setOrders(sortedOrders);
    } catch (error) {
      console.error("Lỗi tải đơn hàng:", error);
      alert("Không thể kết nối đến server!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const openModal = (order) => {
    setSelectedOrder(order);
    setTempStatus(order.status);
  };

  const closeModal = () => {
    setSelectedOrder(null);
  };

  const updateStatus = async () => {
    if (!selectedOrder) return;
    
    // Lấy ID chuẩn để gọi API
    const orderId = getOrderId(selectedOrder);

    try {
      console.log(`Updating Order ${orderId} to ${tempStatus}`); // Log kiểm tra
      
      await axios.patch(`${API_URL}/orders/${orderId}/status`, {
        status: tempStatus
      });

      alert(`Đã cập nhật đơn hàng thành: ${tempStatus}`);
      
      const updatedOrders = orders.map(ord => 
        getOrderId(ord) === orderId ? { ...ord, status: tempStatus } : ord
      );
      setOrders(updatedOrders);
      closeModal();
    } catch (error) {
      console.error("Update failed:", error);
      // Hiển thị chi tiết lỗi từ backend (thường nằm trong response.data.error hoặc message)
      const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message;
      alert("Lỗi cập nhật: " + errorMsg);
    }
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleString("vi-VN", {
      hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric"
    });
  };

  const getStatusColor = (status) => {
    switch(status) {
      case "Pending": return "status-pending";
      case "Confirmed": return "status-confirmed";
      case "Delivering": return "status-delivering";
      case "Delivered": return "status-delivered";
      case "Cancelled": return "status-cancelled";
      case "Unpaid": return "status-pending"; // Map thêm Unpaid
      default: return "";
    }
  };

  return (
    <div className="order-container">
      <h2 className="page-title">📦 Quản Lý Đơn Hàng</h2>

      {loading ? (
        <div className="loading">Đang tải dữ liệu...</div>
      ) : (
        <div className="table-responsive">
          <table className="order-table">
            <thead>
              <tr>
                <th>Mã Đơn</th>
                <th>Ngày đặt</th>
                <th>Khách hàng</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={getOrderId(order)}>
                  <td>#{getOrderId(order).slice(-6).toUpperCase()}</td>
                  <td>{formatDate(order.orderDate)}</td>
                  <td>
                    <div className="customer-info">
                      <strong>{order.deliveryAddress?.fullName || "Khách vãng lai"}</strong>
                      <br/>
                      <small>{order.deliveryAddress?.phone}</small>
                    </div>
                  </td>
                  <td className="money">{formatMoney(order.totalAmount)}</td>
                  <td>
                    <span className={`badge ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>
                    <button className="btn-detail" onClick={() => openModal(order)}>
                      Xem & Xử lý
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedOrder && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chi tiết đơn: #{getOrderId(selectedOrder).slice(-6).toUpperCase()}</h3>
              <span className="close-btn" onClick={closeModal}>&times;</span>
            </div>

            <div className="modal-body">
              <div className="info-group">
                <h4>📍 Thông tin giao hàng</h4>
                <p><strong>Người nhận:</strong> {selectedOrder.deliveryAddress?.fullName}</p>
                <p><strong>SĐT:</strong> {selectedOrder.deliveryAddress?.phone}</p>
                <p><strong>Địa chỉ:</strong> {selectedOrder.deliveryAddress?.street ? 
                    `${selectedOrder.deliveryAddress.street}, ${selectedOrder.deliveryAddress.ward}, ${selectedOrder.deliveryAddress.district}, ${selectedOrder.deliveryAddress.city}` 
                    : "Chưa cập nhật địa chỉ chi tiết"}
                </p>
                <p><strong>Ghi chú đơn:</strong> <span className="note-text">{selectedOrder.note || "Không có"}</span></p>
              </div>

              <div className="items-group">
                <h4>🛒 Danh sách món ăn</h4>
                <ul className="item-list">
                  {selectedOrder.items.map((item, index) => (
                    <li key={index} className="item-row" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <img 
                        src={getProductImage(item.productName)} 
                        alt={item.productName} 
                        style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #eee' }}
                      />

                      <div className="item-details" style={{ flex: 1 }}>
                        <div className="item-name-row">
                            <span className="qty-tag">{item.quantity}x</span>
                            <strong>{item.productName}</strong>
                            {item.sizeChosen && <span className="size-tag">{item.sizeChosen}</span>}
                        </div>
                        
                        <div className="item-options">
                           {item.iceLevel && item.iceLevel !== "N/A" && item.sugarLevel && item.sugarLevel !== "N/A" ? (
                             <>📝 {item.iceLevel} đá, {item.sugarLevel} đường<br/></>
                           ) : null}
                           
                           {item.chosenToppings && item.chosenToppings.length > 0 && (
                               <span className="toppings">
                                 + Topping: {item.chosenToppings.map(t => t.name).join(", ")}
                               </span>
                           )}

                           {item.itemNote && (
                               <div style={{color: '#e67e22', fontStyle: 'italic', fontSize: '0.85rem', marginTop: '4px'}}>
                                   Note: {item.itemNote}
                               </div>
                           )}
                        </div>
                      </div>
                      <div className="item-price">
                        {formatMoney(item.finalUnitPrice * item.quantity)}
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="order-summary">
                   <div className="sum-row"><span>Tạm tính:</span> <span>{formatMoney(selectedOrder.subtotal || 0)}</span></div>
                   <div className="sum-row"><span>Phí ship:</span> <span>{formatMoney(selectedOrder.shippingFee || 0)}</span></div>
                   {selectedOrder.discountAmount > 0 && (
                       <div className="sum-row discount"><span>Giảm giá:</span> <span>-{formatMoney(selectedOrder.discountAmount)}</span></div>
                   )}
                   <div className="sum-row total"><span>Tổng cộng:</span> <span>{formatMoney(selectedOrder.totalAmount || 0)}</span></div>
                </div>
              </div>

              <div className="status-action">
                <h4>⚙️ Cập nhật trạng thái</h4>
                <div className="action-row">
                    <select 
                        value={tempStatus} 
                        onChange={(e) => setTempStatus(e.target.value)}
                        className="status-select"
                    >
                        <option value="Pending">🕒 Chờ xác nhận (Pending)</option>
                        <option value="Confirmed">✅ Đã xác nhận (Confirmed)</option>
                        <option value="Delivering">🚚 Đang giao (Delivering)</option>
                        <option value="Delivered">🎁 Đã giao (Delivered)</option>
                        {/* ĐÃ XÓA OPTION "Completed" VÌ KHÔNG CÓ TRONG DB */}
                        <option value="Cancelled">❌ Hủy đơn (Cancelled)</option>
                    </select>
                    <button className="btn-save" onClick={updateStatus}>Lưu Trạng Thái</button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManager;