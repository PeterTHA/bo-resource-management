import { useMemo } from 'react';

const useFormatDate = () => {
  // ฟังก์ชันจัดรูปแบบวันที่เป็นภาษาไทย
  const formatDate = useMemo(() => (date) => {
    if (!date) return '';
    
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('th-TH', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }, []);
  
  // ฟังก์ชันจัดรูปแบบวันที่และเวลาเป็นภาษาไทย
  const formatDateTime = useMemo(() => (date) => {
    if (!date) return '';
    
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('th-TH', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);
  
  // ฟังก์ชันจัดรูปแบบวันที่แบบสั้นเป็นภาษาไทย
  const formatShortDate = useMemo(() => (date) => {
    if (!date) return '';
    
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('th-TH', { 
      day: 'numeric', 
      month: 'short' 
    });
  }, []);

  return { formatDate, formatDateTime, formatShortDate };
};

export default useFormatDate; 