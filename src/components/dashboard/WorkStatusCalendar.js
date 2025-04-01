'use client';

import { useState, useEffect } from 'react';
import { FiHome, FiBriefcase, FiMapPin, FiGlobe } from 'react-icons/fi';

export default function WorkStatusCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [workStatuses, setWorkStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchWorkStatuses();
  }, [currentMonth]);

  const fetchWorkStatuses = async () => {
    try {
      setLoading(true);
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      
      const response = await fetch(`/api/work-status?year=${year}&month=${month}`);
      const data = await response.json();
      
      if (data.success) {
        setWorkStatuses(data.data);
      } else {
        setError(data.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล');
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'OFFICE':
        return <FiBriefcase className="w-4 h-4" />;
      case 'WFH':
        return <FiHome className="w-4 h-4" />;
      case 'MIXED':
        return <FiMapPin className="w-4 h-4" />;
      case 'OUTSIDE':
        return <FiGlobe className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'OFFICE':
        return 'bg-primary text-primary-content';
      case 'WFH':
        return 'bg-secondary text-secondary-content';
      case 'MIXED':
        return 'bg-accent text-accent-content';
      case 'OUTSIDE':
        return 'bg-neutral text-neutral-content';
      default:
        return 'bg-base-300';
    }
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction));
  };

  if (loading) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">ปฏิทินสถานะการทำงาน</h2>
          <div className="animate-pulse">
            <div className="h-8 bg-base-300 rounded w-1/2 mb-4"></div>
            <div className="grid grid-cols-7 gap-2">
              {[...Array(35)].map((_, i) => (
                <div key={i} className="aspect-square bg-base-300 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">ปฏิทินสถานะการทำงาน</h2>
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        </div>
      </div>
    );
  }

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentMonth);
  const days = [];

  // เพิ่มวันว่างก่อนวันแรกของเดือน
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }

  // เพิ่มวันในเดือน
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">ปฏิทินสถานะการทำงาน</h2>
        
        {/* ส่วนควบคุมเดือน */}
        <div className="flex justify-between items-center mb-4">
          <button 
            className="btn btn-sm btn-ghost"
            onClick={() => navigateMonth(-1)}
          >
            ←
          </button>
          <span className="font-semibold">
            {currentMonth.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}
          </span>
          <button 
            className="btn btn-sm btn-ghost"
            onClick={() => navigateMonth(1)}
          >
            →
          </button>
        </div>

        {/* ปฏิทิน */}
        <div className="grid grid-cols-7 gap-1">
          {/* หัววันในสัปดาห์ */}
          {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(day => (
            <div key={day} className="text-center text-sm font-semibold p-1">
              {day}
            </div>
          ))}

          {/* วันในเดือน */}
          {days.map((day, index) => {
            const status = workStatuses.find(s => 
              new Date(s.date).getDate() === day &&
              new Date(s.date).getMonth() === currentMonth.getMonth() &&
              new Date(s.date).getFullYear() === currentMonth.getFullYear()
            );

            return (
              <div 
                key={index}
                className={`aspect-square p-1 flex flex-col items-center justify-center text-xs
                  ${day ? 'bg-base-200 hover:bg-base-300 cursor-pointer' : ''}`}
              >
                {day && (
                  <>
                    <span className="mb-1">{day}</span>
                    {status && (
                      <div className={`p-1 rounded-full ${getStatusColor(status.status)}`}>
                        {getStatusIcon(status.status)}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* คำอธิบายสถานะ */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center space-x-2">
            <div className={`w-4 h-4 rounded-full ${getStatusColor('OFFICE')}`}></div>
            <span>ทำงานที่ออฟฟิศ</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-4 h-4 rounded-full ${getStatusColor('WFH')}`}></div>
            <span>ทำงานที่บ้าน</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-4 h-4 rounded-full ${getStatusColor('MIXED')}`}></div>
            <span>ผสมผสาน</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-4 h-4 rounded-full ${getStatusColor('OUTSIDE')}`}></div>
            <span>ทำงานนอกสถานที่</span>
          </div>
        </div>
      </div>
    </div>
  );
} 