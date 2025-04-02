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
  
  // ฟังก์ชันจัดรูปแบบเดือนและปีเป็นภาษาไทย
  const formatMonthYear = useMemo(() => (date) => {
    if (!date) return '';
    
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('th-TH', { 
      month: 'long', 
      year: 'numeric' 
    });
  }, []);
  
  // ฟังก์ชันจัดรูปแบบวันที่แบบสั้นพร้อมวันในสัปดาห์เป็นภาษาไทย
  const formatShortDateWithDay = useMemo(() => (date) => {
    if (!date) return '';
    
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('th-TH', { 
      day: 'numeric', 
      month: 'short',
      weekday: 'short'
    });
  }, []);

  return { 
    formatDate, 
    formatDateTime, 
    formatShortDate, 
    formatMonthYear,
    formatShortDateWithDay
  };
};

export default useFormatDate; 