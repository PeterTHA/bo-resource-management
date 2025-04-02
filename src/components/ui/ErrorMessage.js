import React from 'react';
import { FiAlertCircle, FiAlertTriangle, FiInfo, FiCheckCircle } from 'react-icons/fi';

// แก้ไข export เป็น export const เพื่อให้สามารถนำเข้าได้ทั้งแบบ default และ named import
export const ErrorMessage = ({ message, type = 'error' }) => {
  if (!message) return null;
  
  const getAlertClass = () => {
    switch (type) {
      case 'error':
        return 'bg-destructive/15 text-destructive';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400';
      case 'info':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400';
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400';
      default:
        return 'bg-destructive/15 text-destructive';
    }
  };
  
  const getIcon = () => {
    switch (type) {
      case 'error':
        return <FiAlertCircle className="h-4 w-4" />;
      case 'warning':
        return <FiAlertTriangle className="h-4 w-4" />;
      case 'info':
        return <FiInfo className="h-4 w-4" />;
      case 'success':
        return <FiCheckCircle className="h-4 w-4" />;
      default:
        return <FiAlertCircle className="h-4 w-4" />;
    }
  };
  
  return (
    <div className={`flex items-center gap-2 rounded-md px-3 py-2.5 text-sm ${getAlertClass()}`}>
      {getIcon()}
      <span>{message}</span>
    </div>
  );
};

// สำหรับข้อความ error ที่เกี่ยวกับการเชื่อมต่อฐานข้อมูล
export function ConnectionErrorMessage() {
  return (
    <ErrorMessage 
      message="ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้ กรุณาลองใหม่อีกครั้ง หรือติดต่อผู้ดูแลระบบ" 
      type="error" 
    />
  );
}

// ส่งออกเป็น default export ด้วย
export default ErrorMessage; 