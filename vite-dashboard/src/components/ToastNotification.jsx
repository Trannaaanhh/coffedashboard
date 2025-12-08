import React, { useEffect } from 'react';

const ToastNotification = ({ data, onClose }) => {
  useEffect(() => {
    // Tự động tắt sau 5 giây
    const timer = setTimeout(() => onClose(), 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!data) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 9999,
      backgroundColor: '#fff',
      borderLeft: '5px solid #27ae60', // Màu xanh lá báo hiệu đơn hàng thành công
      boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
      borderRadius: '8px',
      padding: '15px 20px',
      minWidth: '320px',
      animation: 'slideInRight 0.5s ease-out'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <strong style={{ color: '#2c3e50', fontSize: '16px' }}>
          🔔 {data.notification?.title || "Thông báo mới"}
        </strong>
        <button 
          onClick={onClose} 
          style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px', color: '#999' }}
        >
          &times;
        </button>
      </div>
      <div style={{ color: '#555', fontSize: '14px', lineHeight: '1.4' }}>
        {data.notification?.body}
      </div>
      {/* Thêm style animation trực tiếp */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default ToastNotification;