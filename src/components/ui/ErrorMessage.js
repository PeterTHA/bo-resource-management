import React from 'react';

export default function ErrorMessage({ message, type = 'error' }) {
  if (!message) return null;
  
  const getStyles = () => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-700';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'success':
        return 'bg-green-50 border-green-200 text-green-700';
      default:
        return 'bg-red-50 border-red-200 text-red-700';
    }
  };
  
  const getIcon = () => {
    switch (type) {
      case 'error':
        return '⚠️';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      case 'success':
        return '✅';
      default:
        return '⚠️';
    }
  };
  
  return (
    <div className={`${getStyles()} px-4 py-3 rounded-lg mb-6 flex items-start`}>
      <span className="mr-2">{getIcon()}</span>
      <span>{message}</span>
    </div>
  );
}

// สำหรับข้อความ error ที่เกี่ยวกับการเชื่อมต่อฐานข้อมูล
export function ConnectionErrorMessage() {
  return (
    <ErrorMessage 
      message="ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้ กรุณาลองใหม่อีกครั้ง หรือติดต่อผู้ดูแลระบบ" 
      type="error" 
    />
  );
} 