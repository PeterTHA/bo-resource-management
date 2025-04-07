'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FiChevronLeft, FiChevronRight, FiCalendar, FiClock, FiUser, FiFilter, FiHome, FiBriefcase, FiRefreshCw, FiCheck, FiX, FiUsers } from 'react-icons/fi';
import { LoadingPage } from '../../components/ui/LoadingSpinner';
import Image from 'next/image';
import ProfileImage from '../../components/ui/ProfileImage';
import WorkStatusBadge from '@/components/work-status/WorkStatusBadge';
import { toast } from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { format, isSameDay, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, subWeeks, addWeeks } from 'date-fns';
import useFormatDate from '@/hooks/useFormatDate';
import { useUser } from '@/hooks/useUser';
import WorkStatusModal from '@/components/work-status/WorkStatusModal';
import OvertimeBadge from '@/components/overtime/OvertimeBadge';

// ฟังก์ชันสำหรับแสดงไอคอนตามประเภทการลา
const LeaveTypeIcon = ({ leaveType, className = "h-5 w-5" }) => {
  switch (leaveType) {
    case 'ลาพักร้อน':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'ลากิจ':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case 'ลาป่วย':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      );
    default:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
};

// ฟังก์ชันสำหรับแสดงไอคอนสถานะการทำงาน
const getWorkStatusIcon = (status) => {
  switch (status) {
    case 'WFH':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      );
    case 'WFO':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      );
    default:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
  }
};

// ฟังก์ชันสำหรับแสดงไอคอน OT
const getOvertimeIcon = () => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
};

// ฟังก์ชันสำหรับแสดงคำอธิบายสัญลักษณ์ต่างๆ
const renderLegend = () => (
  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
    <h3 className="text-lg font-semibold mb-3">คำอธิบาย</h3>
    <div className="grid grid-cols-1 gap-4">
      {/* ส่วนการลา */}
      <div>
        <h4 className="font-medium mb-2">ประเภทการลา</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-md bg-orange-50 border-2 border-orange-200 mr-2 flex items-center justify-center">
              <LeaveTypeIcon leaveType="ลาพักร้อน" className="h-5 w-5 text-emerald-600" />
            </div>
            <span className="text-sm">ลาพักร้อน</span>
          </div>
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-md bg-orange-50 border-2 border-orange-200 mr-2 flex items-center justify-center">
              <LeaveTypeIcon leaveType="ลากิจ" className="h-5 w-5 text-amber-600" />
            </div>
            <span className="text-sm">ลากิจ</span>
          </div>
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-md bg-orange-50 border-2 border-orange-200 mr-2 flex items-center justify-center">
              <LeaveTypeIcon leaveType="ลาป่วย" className="h-5 w-5 text-red-600" />
            </div>
            <span className="text-sm">ลาป่วย</span>
          </div>
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-md bg-orange-50 border-2 border-orange-200 mr-2 flex items-center justify-center">
              <LeaveTypeIcon leaveType="อื่นๆ" className="h-5 w-5 text-purple-600" />
            </div>
            <span className="text-sm">ลาอื่นๆ</span>
          </div>
        </div>
      </div>

      {/* ส่วน OT */}
      <div>
        <h4 className="font-medium mb-2">การทำงานล่วงเวลา (OT)</h4>
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-md bg-purple-50 mr-2 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-sm">OT ที่อนุมัติแล้ว</span>
        </div>
      </div>

      {/* ส่วนสถานะการทำงาน */}
      <div>
        <h4 className="font-medium mb-2">สถานะการทำงาน</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-md bg-blue-50 mr-2 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className="text-sm">ทำงานที่ออฟฟิศ</span>
          </div>
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-md bg-blue-50 mr-2 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <span className="text-sm">ทำงานที่บ้าน</span>
          </div>
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-md bg-blue-50 mr-2 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <span className="text-sm">ทำงานแบบผสม</span>
          </div>
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-md bg-blue-50 mr-2 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-sm">นอกสถานที่</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ฟังก์ชันสำหรับดึงข้อมูลสถานะการทำงานของพนักงาน
const fetchWorkStatuses = async (currentDate, setWorkStatuses, setIsDataFetching) => {
  // ตรวจสอบว่ามีฟังก์ชัน setIsDataFetching ส่งมาหรือไม่
  if (setIsDataFetching) setIsDataFetching(true);
  
  // ตั้งค่าเดือนและปีที่ต้องการดึงข้อมูล
  const month = currentDate.getMonth() + 1; // เดือนเริ่มจาก 0
  const year = currentDate.getFullYear();
  
  console.log(`Fetching work statuses with where clause: {}`);
  
  try {
    // สร้าง URL สำหรับดึงข้อมูลสถานะการทำงาน
    const url = `/api/work-status?month=${month}&year=${year}`;
    console.log(`Calendar range - start: ${new Date(year, month-1, 1).toISOString()} end: ${new Date(year, month, 0).toISOString()}`);
    
    try {
      console.log('Using model: work_statuses');
      
      // ดึงข้อมูลจาก API
      const response = await fetch(url);
      
      // ถ้าการตอบกลับไม่สำเร็จ (ไม่ใช่ 200 OK)
      if (!response.ok) {
        const errorText = await response.text();
        console.log(`API responded with status: ${response.status} - ${errorText || response.statusText}`);
        
        // ตรวจสอบว่าเป็นข้อผิดพลาดเกี่ยวกับโมเดลฐานข้อมูลหรือไม่
        if (errorText && (
          errorText.includes('โมเดล workStatus ยังไม่พร้อมใช้งาน') || 
          errorText.includes('work_statuses') ||
          errorText.includes('โมเดลข้อมูลสถานะการทำงานยังไม่พร้อมใช้งาน')
        )) {
          console.log('ข้อความจากระบบ: ไม่พบโมเดลข้อมูลสถานะการทำงานในฐานข้อมูล - ข้ามการแสดงข้อมูลสถานะการทำงาน');
          console.log('คำแนะนำ: ตรวจสอบการติดตั้งฐานข้อมูลหรือติดต่อผู้ดูแลระบบเพื่ออัปเดต schema');
        } else {
          console.log('พบข้อผิดพลาดจาก API:', errorText || response.statusText);
        }
        
        setWorkStatuses([]);
        return;
      }
      
      // อ่าน response ในรูปแบบข้อความก่อน เพื่อตรวจสอบความถูกต้อง
      const responseText = await response.text();
      
      // ตรวจสอบว่า response ว่างหรือไม่
      if (!responseText || responseText.trim() === '') {
        console.log('API ส่งค่าว่างกลับมา');
        setWorkStatuses([]);
        return;
      }
      
      // แปลง response เป็น JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (jsonError) {
        console.log('เกิดข้อผิดพลาดในการแปลง response เป็น JSON:', jsonError.message);
        console.log('Response text:', responseText);
        setWorkStatuses([]);
        return;
      }
      
      // ตรวจสอบว่าข้อมูลที่ได้รับเป็น null หรือไม่มีค่าหรือไม่
      if (!data) {
        console.log('ข้อมูลที่ได้รับเป็น null หรือ undefined');
        setWorkStatuses([]);
        return;
      }
      
      // เพิ่ม log เพื่อตรวจสอบโครงสร้างข้อมูล
      console.log('ประเภทข้อมูลที่ได้รับ:', typeof data);
      if (typeof data === 'object') {
        console.log('ข้อมูลมี property:', Object.keys(data));
      }
      
      // ตรวจสอบรูปแบบข้อมูล - กรณีที่เป็น array
      if (Array.isArray(data)) {
        console.log('ได้รับข้อมูลเป็น array มีจำนวน:', data.length);
        
        // แปลงวันที่ให้เป็นอยู่ในรูปแบบที่ถูกต้อง
        const processedData = data.map(item => {
          if (item && item.date) {
            const dateObj = new Date(item.date);
            item.date = new Date(Date.UTC(
              dateObj.getFullYear(),
              dateObj.getMonth(),
              dateObj.getDate(),
              12, 0, 0
            ));
          }
          return item;
        });
        
        setWorkStatuses(prevWorkStatuses => {
          // ตรวจสอบว่า processedData ไม่เหมือนกับ prevWorkStatuses
          const isEqual = JSON.stringify(prevWorkStatuses) === JSON.stringify(processedData);
          if (isEqual) {
            console.log('ข้อมูลสถานะการทำงานไม่มีการเปลี่ยนแปลง');
            return prevWorkStatuses;
          }
          console.log('อัพเดทข้อมูลสถานะการทำงาน จำนวน:', processedData.length);
          return processedData;
        });
        return true;
      }
      // ตรวจสอบรูปแบบข้อมูล - กรณีที่เป็น object และมี success=true
      else if (data.success === true && Array.isArray(data.data)) {
        console.log('ได้รับข้อมูลในรูปแบบ {success: true, data: [...]} มีจำนวน:', data.data.length);
        
        // แปลงวันที่ให้เป็นอยู่ในรูปแบบที่ถูกต้อง
        const processedData = data.data.map(item => {
          if (item && item.date) {
            const dateObj = new Date(item.date);
            item.date = new Date(Date.UTC(
              dateObj.getFullYear(),
              dateObj.getMonth(),
              dateObj.getDate(),
              12, 0, 0
            ));
          }
          return item;
        });
        
        setWorkStatuses(processedData);
        return true;
      }
      // กรณีที่ข้อมูลมี success=false
      else if (data.success === false) {
        // ตรวจสอบว่าเป็นข้อผิดพลาดเกี่ยวกับโมเดลฐานข้อมูลหรือไม่
        if (data.message && (
          data.message.includes('โมเดล workStatus ยังไม่พร้อมใช้งาน') || 
          data.message.includes('work_statuses') ||
          data.message.includes('โมเดลข้อมูลสถานะการทำงานยังไม่พร้อมใช้งาน')
        )) {
          console.log('ข้อความจากระบบ: ไม่พบโมเดลข้อมูลสถานะการทำงานในฐานข้อมูล - ข้ามการแสดงข้อมูลสถานะการทำงาน');
          console.log('คำแนะนำ: ตรวจสอบการติดตั้งฐานข้อมูลหรือติดต่อผู้ดูแลระบบเพื่ออัปเดต schema');
        } else {
          console.log('API ส่งค่า success=false:', data.message || 'ไม่ทราบสาเหตุ');
        }
        setWorkStatuses([]);
        return false;
      }
      // กรณีที่ข้อมูลเป็น object ที่มี workStatuses หรือ data
      else if (typeof data === 'object' && (data.workStatuses || data.data)) {
        const workStatusArray = data.workStatuses || data.data || [];
        console.log('ได้รับข้อมูลใน field workStatuses หรือ data มีจำนวน:', workStatusArray.length);
        
        // แปลงวันที่ให้เป็นอยู่ในรูปแบบที่ถูกต้อง
        const processedData = workStatusArray.map(item => {
          if (item && item.date) {
            const dateObj = new Date(item.date);
            item.date = new Date(Date.UTC(
              dateObj.getFullYear(),
              dateObj.getMonth(),
              dateObj.getDate(),
              12, 0, 0
            ));
          }
          return item;
        });
        
        setWorkStatuses(processedData);
        return true;
      }
      
      // กรณีที่ข้อมูลไม่อยู่ในรูปแบบที่คาดหวัง
      console.log('ข้อมูลมีรูปแบบไม่ตรงตามที่คาดหวัง - ข้ามการแสดงข้อมูลสถานะการทำงาน');
      // ลองแปลงข้อมูลเป็น array ถ้าเป็นไปได้
      if (typeof data === 'object' && !Array.isArray(data)) {
        const possibleArrayValues = Object.values(data).find(val => Array.isArray(val));
        if (possibleArrayValues) {
          console.log('พบข้อมูลเป็น array ในพร็อพเพอร์ตี้ของ response', possibleArrayValues.length);
          
          // แปลงวันที่ให้เป็นอยู่ในรูปแบบที่ถูกต้อง
          const processedData = possibleArrayValues.map(item => {
            if (item && item.date) {
              const dateObj = new Date(item.date);
              item.date = new Date(Date.UTC(
                dateObj.getFullYear(),
                dateObj.getMonth(),
                dateObj.getDate(),
                12, 0, 0
              ));
            }
            return item;
          });
          
          setWorkStatuses(processedData);
          return true;
        }
      }
      
      setWorkStatuses([]);
      return false;
    } catch (fetchError) {
      if (fetchError.name === 'AbortError') {
        console.log('การดึงข้อมูลสถานะการทำงานถูกยกเลิกเนื่องจากเกินเวลาที่กำหนด (timeout)');
        setWorkStatuses([]);
        return false;
      }
      throw fetchError; // ส่งต่อข้อผิดพลาดไปยัง catch ข้างนอก
    }
  } catch (error) {
    // ตรวจสอบว่าเป็นข้อผิดพลาดเกี่ยวกับโมเดลฐานข้อมูลหรือไม่
    if (error.message && (
      error.message.includes('โมเดล workStatus ยังไม่พร้อมใช้งาน') ||
      error.message.includes('work_statuses') ||
      error.message.includes('โมเดลข้อมูลสถานะการทำงานยังไม่พร้อมใช้งาน')
    )) {
      console.log('ข้อความจากระบบ: ไม่พบโมเดลข้อมูลสถานะการทำงานในฐานข้อมูล - ข้ามการแสดงข้อมูลสถานะการทำงาน');
      console.log('คำแนะนำ: ตรวจสอบการติดตั้งฐานข้อมูลหรือติดต่อผู้ดูแลระบบเพื่ออัปเดต schema');
    } else {
      console.log('เกิดข้อผิดพลาดในการดึงข้อมูลสถานะการทำงาน:', error.message);
    }
    setWorkStatuses([]);
    return false;
  } finally {
    console.log('========================================');
    // เซ็ต isDataFetching เป็น false เสมอเมื่อจบการทำงาน
    if (setIsDataFetching) setIsDataFetching(false);
    return true; // เพื่อให้ Promise นี้สามารถใช้ .finally() ได้
  }
};

// เพิ่มฟังก์ชันตรวจสอบว่าเป็นรูปภาพจาก mock-images หรือไม่
const isMockImage = (src) => {
  return src && typeof src === 'string' && (src.startsWith('/mock-images/') || src.startsWith('./mock-images/'));
};

// ประกาศตัวแปรสำหรับเก็บข้อมูล cache
let calendarDataCache = {
  employees: [],
  workStatuses: [],
  leaves: [],
  overtimes: [],
  lastFetched: null,
  startDate: null,
  endDate: null
};
  
export default function EmployeeCalendarPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const abortControllerRef = useRef(null);
  const [viewMode, setViewMode] = useState('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [employees, setEmployees] = useState([]);
  const [workStatuses, setWorkStatuses] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [overtimes, setOvertimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDataFetching, setIsDataFetching] = useState(false);
  const [error, setError] = useState('');
  const [departments, setDepartments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [teamsData, setTeamsData] = useState({});
  const [employeesByTeam, setEmployeesByTeam] = useState([]);
  const [selectedWorkStatus, setSelectedWorkStatus] = useState(null);
  const [isWorkStatusModalOpen, setIsWorkStatusModalOpen] = useState({ isOpen: false, viewOnly: false });
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentUserData, setCurrentUserData] = useState(null);
  const [employeePermissions, setEmployeePermissions] = useState({});
  const [hasCheckedPermissions, setHasCheckedPermissions] = useState(false);
  // เพิ่ม state สำหรับจัดการการโหลดข้อมูลแผนกและทีม
  const [isDepartmentsLoaded, setIsDepartmentsLoaded] = useState(false);
  const [isTeamsLoaded, setIsTeamsLoaded] = useState(false);
  // นำเข้าฟังก์ชันการจัดรูปแบบวันที่จาก hook
  const { formatDate, formatDateTime, formatShortDate, formatMonthYear } = useFormatDate();

  // ฟังก์ชันดึงข้อมูลปฏิทิน
  const fetchCalendarData = async () => {
    console.log('เริ่มดึงข้อมูลปฏิทิน...');
    // ไม่ต้องเซ็ต setIsDataFetching(true) และ setLoading(true) ที่นี่
    // เพราะจะถูกเซ็ตจากฟังก์ชันที่เรียกใช้ fetchCalendarData
    
    try {
      // ยกเลิกคำขอ API ก่อนหน้า (ถ้ามี)
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // สร้าง AbortController ใหม่
      abortControllerRef.current = new AbortController();
      
      const startDate = getStartDate();
      const endDate = getEndDate();
      
      // แปลงวันที่เป็น UTC โดยกำหนดเวลาเพื่อป้องกันปัญหา timezone
      const startUTC = new Date(Date.UTC(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate(),
        0, 0, 0
      ));
      
      const endUTC = new Date(Date.UTC(
        endDate.getFullYear(),
        endDate.getMonth(),
        endDate.getDate(),
        23, 59, 59
      ));
      
      console.log('======== CALENDAR DATA FETCH ========');
      console.log(`Fetching calendar data from ${startUTC.toISOString()} to ${endUTC.toISOString()}`);
      
      // ตรวจสอบว่ามีข้อมูลใน cache หรือไม่ และถ้ามี ข้อมูลเป็นช่วงเวลาเดียวกันหรือไม่
      const isSameRange = calendarDataCache.startDate && 
                          calendarDataCache.endDate && 
                          calendarDataCache.startDate.toISOString() === startUTC.toISOString() && 
                          calendarDataCache.endDate.toISOString() === endUTC.toISOString();
                          
      const cacheIsValid = calendarDataCache.lastFetched && 
                          (new Date().getTime() - calendarDataCache.lastFetched.getTime()) < 60000 && // cache หมดอายุใน 1 นาที
                          isSameRange;
      
      // ถ้ามีข้อมูลใน cache และยังไม่หมดอายุ ให้ใช้ข้อมูลจาก cache
      if (cacheIsValid) {
        console.log('Using cached calendar data');
        
        setEmployees(calendarDataCache.employees || []);
        setWorkStatuses(calendarDataCache.workStatuses || []);
        setLeaves(calendarDataCache.leaves || []);
        setOvertimes(calendarDataCache.overtimes || []);
        
        // จัดกลุ่มพนักงานตามทีม
        groupEmployeesByTeam(calendarDataCache.employees);
        
        console.log('จำนวนพนักงานจาก cache:', calendarDataCache.employees.length);
        console.log('Cache โหลดสำเร็จ');
        return true; // ส่งคืนค่า true เพื่อบอกว่าการโหลดสำเร็จ
      }
      
      // ตั้งค่า timeout เพื่อป้องกันการค้างนานเกินไป
      const timeoutId = setTimeout(() => {
        if (abortControllerRef.current) {
          console.log('API request timed out, aborting...');
          abortControllerRef.current.abort();
        }
      }, 10000); // timeout 10 วินาที
      
      try {
        // ดึงข้อมูลใหม่จาก API
        console.log('Fetching new calendar data');
        const response = await fetch(`/api/employee-calendar?startDate=${startUTC.toISOString()}&endDate=${endUTC.toISOString()}`, {
          signal: abortControllerRef.current.signal
        });
        
        clearTimeout(timeoutId); // ยกเลิก timeout เมื่อได้รับการตอบสนอง
        
        // ตรวจสอบว่า response ถูกต้องหรือไม่
        if (!response.ok) {
          console.log(`API responded with status: ${response.status}`);
          const errorText = await response.text();
          throw new Error(`API error: ${errorText || response.statusText}`);
        }
        
        // แปลง response เป็น JSON
        const data = await response.json();
        
        if (data.success) {
          console.log('ได้รับข้อมูลจาก API แล้ว - จำนวนพนักงาน:', (data.data.employees || []).length);
          
          // อัปเดตข้อมูลใน state
          setEmployees(data.data.employees || []);
          
          // แปลงวันที่ใน workStatuses ให้เป็น UTC format
          const processedWorkStatuses = (data.data.workStatuses || []).map(item => {
            if (item && item.date) {
              const dateObj = new Date(item.date);
              item.date = new Date(Date.UTC(
                dateObj.getFullYear(),
                dateObj.getMonth(),
                dateObj.getDate(),
                12, 0, 0
              ));
            }
            return item;
          });
          setWorkStatuses(processedWorkStatuses);
          
          // แปลงวันที่ใน leaves ให้เป็น UTC format
          const processedLeaves = (data.data.leaves || []).map(item => {
            if (item && item.startDate) {
              const startDateObj = new Date(item.startDate);
              item.startDate = new Date(Date.UTC(
                startDateObj.getFullYear(),
                startDateObj.getMonth(),
                startDateObj.getDate(),
                0, 0, 0
              ));
            }
            if (item && item.endDate) {
              const endDateObj = new Date(item.endDate);
              item.endDate = new Date(Date.UTC(
                endDateObj.getFullYear(),
                endDateObj.getMonth(),
                endDateObj.getDate(),
                23, 59, 59
              ));
            }
            return item;
          });
          setLeaves(processedLeaves);
          
          // แปลงวันที่ใน overtimes ให้เป็น UTC format
          const processedOvertimes = (data.data.overtimes || []).map(item => {
            if (item && item.date) {
              const dateObj = new Date(item.date);
              item.date = new Date(Date.UTC(
                dateObj.getFullYear(),
                dateObj.getMonth(),
                dateObj.getDate(),
                12, 0, 0
              ));
            }
            return item;
          });
          setOvertimes(processedOvertimes);
          
          // บันทึกข้อมูลลง cache
          calendarDataCache = {
            employees: data.data.employees || [],
            workStatuses: processedWorkStatuses,
            leaves: processedLeaves,
            overtimes: processedOvertimes,
            lastFetched: new Date(),
            startDate: startUTC,
            endDate: endUTC
          };
          
          // จัดกลุ่มพนักงานตามทีม
          groupEmployeesByTeam(data.data.employees);
          
          // ดึงข้อมูลผู้ใช้ปัจจุบัน (เพื่อใช้ในการตรวจสอบสิทธิ์)
          if (session?.user) {
            const currentUserData = data.data.employees.find(e => e.id === session.user.id);
            if (currentUserData) {
              setCurrentUserData(currentUserData);
            }
          }
          
          setError('');
          console.log('Calendar data fetched successfully');
          return true; // ส่งคืนค่า true เพื่อบอกว่าการโหลดสำเร็จ
        } else {
          setError(data.message || 'ไม่สามารถดึงข้อมูลได้');
          console.log('Error from API:', data.message);
          return false; // ส่งคืนค่า false เพื่อบอกว่าการโหลดล้มเหลว
        }
      } catch (fetchError) {
        clearTimeout(timeoutId); // ยกเลิก timeout ในกรณีเกิดข้อผิดพลาด
        
        if (fetchError.name === 'AbortError') {
          console.log('API request was aborted');
          setError('การดึงข้อมูลถูกยกเลิกเนื่องจากใช้เวลานานเกินไป โปรดลองใหม่อีกครั้ง');
        } else {
          throw fetchError; // ส่งต่อข้อผิดพลาดไปยัง catch หลัก
        }
        return false; // ส่งคืนค่า false เพื่อบอกว่าการโหลดล้มเหลว
      }
      
      console.log('===================================');
    } catch (err) {
      // ไม่แสดงข้อความ error ถ้าเป็นการยกเลิกโดยตั้งใจ
      if (err.name !== 'AbortError') {
        console.log('Error fetching calendar data:', err.message);
        setError('เกิดข้อผิดพลาดในการดึงข้อมูล');
      }
      return false; // ส่งคืนค่า false เพื่อบอกว่าการโหลดล้มเหลว
    } finally {
      // ไม่ต้องเซ็ต loading และ isDataFetching เป็น false ที่นี่
      // เพราะจะถูกเซ็ตจากฟังก์ชันที่เรียกใช้ fetchCalendarData
      console.log('จบการทำงานของฟังก์ชัน fetchCalendarData');
    }
    
    return false; // สำหรับกรณีที่มีข้อผิดพลาดที่ไม่ได้จัดการ
  };
  
  // ฟังก์ชันสำหรับจัดกลุ่มพนักงานตามทีม
  const groupEmployeesByTeam = (employeesData) => {
    if (!employeesData || employeesData.length === 0) return;
    
    // กรองและจัดกลุ่มพนักงานตามทีม
    const employeesByTeamMap = {};
    
    employeesData.forEach(employee => {
      // ใช้ teamName หรือ teamData.name หรือตัวแปร defaultTeam
      const teamName = employee.teamName || 
                     (employee.teamData && employee.teamData.name) || 
                     (employee.team && employee.team.name) || 
                     'ไม่ระบุทีม';
      
      // สร้าง key ของทีมถ้ายังไม่มี
      if (!employeesByTeamMap[teamName]) {
        employeesByTeamMap[teamName] = [];
      }
      
      // เพิ่มพนักงานเข้าไปในทีม
      employeesByTeamMap[teamName].push(employee);
    });
    
    // เรียงลำดับชื่อทีมตามตัวอักษร
    const sortedTeamNames = Object.keys(employeesByTeamMap).sort();
    
    // สร้าง array ของทีมพร้อมสมาชิก
    const teams = sortedTeamNames.map(teamName => ({
      name: teamName,
      members: employeesByTeamMap[teamName]
    }));
    
    // ตั้งค่า state
    setEmployeesByTeam(teams);
  };

  // ฟังก์ชันสำหรับดึงข้อมูลแผนกทั้งหมด
  const fetchDepartments = async () => {
    // ถ้าเคยโหลดข้อมูลแผนกแล้ว ไม่ต้องโหลดซ้ำ
    if (isDepartmentsLoaded) {
      console.log('ข้อมูลแผนกถูกโหลดแล้ว ข้ามการโหลดซ้ำ');
      return;
    }
    
    try {
      console.log('กำลังดึงข้อมูลแผนก...');
      const res = await fetch('/api/departments');
      const data = await res.json();
      
      if (Array.isArray(data)) {
        // สร้างรายการแผนกเฉพาะชื่อแผนก
        const departmentNames = data
          .filter(dept => dept && dept.name)
          .map(dept => dept.name)
          .sort();
        
        setDepartments(departmentNames);
      } else if (data.data && Array.isArray(data.data)) {
        // สร้างรายการแผนกเฉพาะชื่อแผนก
        const departmentNames = data.data
          .filter(dept => dept && dept.name)
          .map(dept => dept.name)
          .sort();
        
        setDepartments(departmentNames);
      }
      
      // ตั้งค่าสถานะว่าโหลดข้อมูลแผนกแล้ว
      setIsDepartmentsLoaded(true);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };
  
  // ฟังก์ชันสำหรับดึงข้อมูลทีมทั้งหมด
  const fetchTeamsData = async () => {
    // ถ้าเคยโหลดข้อมูลทีมแล้ว ไม่ต้องโหลดซ้ำ
    if (isTeamsLoaded) {
      console.log('ข้อมูลทีมถูกโหลดแล้ว ข้ามการโหลดซ้ำ');
      return;
    }
    
    try {
      console.log('กำลังดึงข้อมูลทีม...');
      
      
      // ลองดึงข้อมูลจาก API ก่อน
      const res = await fetch('/api/teams');
      const data = await res.json();
      
      if (data.success && data.data && Array.isArray(data.data)) {
        // แปลงข้อมูลทีมให้อยู่ในรูปแบบ Object โดยใช้ ID เป็น key
        const teamsObj = {};
        data.data.forEach(team => {
          teamsObj[team.id] = team;
        });
        setTeamsData(teamsObj);
        
        // เก็บรายชื่อทีมสำหรับใช้ในการกรอง
        const teamNames = data.data
          .filter(team => team && team.name)
          .map(team => team.name)
          .sort();
        
        setTeams(teamNames);
        console.log('ดึงข้อมูลทีมสำเร็จ:', teamNames.length, 'ทีม');
        
        // ตั้งค่าสถานะว่าโหลดข้อมูลทีมแล้ว
        setIsTeamsLoaded(true);
      } else {
        // ถ้าไม่สามารถดึงข้อมูลจาก API ได้ ให้ใช้ข้อมูลจากพนักงาน
        console.log('ไม่สามารถดึงข้อมูลทีมจาก API ได้ ใช้ข้อมูลจากพนักงานแทน');
        extractTeamsFromEmployees();
      }
    } catch (error) {
      console.error('Error fetching teams data:', error);
      // ในกรณีที่เกิดข้อผิดพลาด ให้ใช้ข้อมูลจากพนักงาน
      extractTeamsFromEmployees();
    }
  };

  // ฟังก์ชันสำหรับดึงข้อมูลทีมจากพนักงาน
  const extractTeamsFromEmployees = () => {
    if (!employees || employees.length === 0) {
      console.log('ไม่มีข้อมูลพนักงานสำหรับดึงข้อมูลทีม');
      return;
    }

    // เก็บข้อมูลทีมจากพนักงาน
    const teamsFromEmployees = {};
    const teamNameSet = new Set();
    
    employees.forEach(employee => {
      // รวบรวมข้อมูลทีมจากหลายแหล่ง
      let teamName = null;
      let teamId = null;
      
      if (employee.teamName) {
        teamName = employee.teamName;
      } else if (employee.team) {
        if (typeof employee.team === 'string') {
          teamName = employee.team;
        } else if (employee.team.name) {
          teamName = employee.team.name;
          teamId = employee.team.id;
        }
      } else if (employee.teamId) {
        teamId = employee.teamId;
      }
      
      if (teamName) {
        teamNameSet.add(teamName);
        
        if (teamId) {
          teamsFromEmployees[teamId] = { id: teamId, name: teamName };
        }
      }
    });
    
    // อัปเดตข้อมูลทีม
    if (Object.keys(teamsFromEmployees).length > 0) {
      setTeamsData(teamsFromEmployees);
    }
    
    // อัปเดตรายชื่อทีมสำหรับใช้ในการกรอง
    const teamNameArray = Array.from(teamNameSet).sort();
    setTeams(teamNameArray);
    console.log('ดึงข้อมูลทีมจากพนักงานสำเร็จ:', teamNameArray.length, 'ทีม');
  };
  
  // useEffect สำหรับดึงข้อมูลแผนก
  useEffect(() => {
    if (session) {
      fetchDepartments();
    }
  }, [session]);
  
  // useEffect สำหรับดึงข้อมูลทีม
  useEffect(() => {
    if (session) {
      fetchTeamsData();
    }
  }, [session]);
  
  // useEffect สำหรับดึงข้อมูลทีมจากพนักงานเมื่อข้อมูลพนักงานเปลี่ยนแปลง
  useEffect(() => {
    if (employees.length > 0 && teams.length === 0) {
      console.log('มีข้อมูลพนักงานแต่ไม่มีข้อมูลทีม ทำการดึงข้อมูลทีมจากพนักงาน');
      extractTeamsFromEmployees();
    }
  }, [employees]);
  
  // useEffect สำหรับตรวจสอบสิทธิ์ของพนักงานทุกคน
  useEffect(() => {
    if (session && employees.length > 0) {
      // สร้าง object เพื่อเก็บข้อมูลการมีสิทธิ์แก้ไขของพนักงานแต่ละคน
      const permissions = {};
      
      // ตรวจสอบสิทธิ์สำหรับพนักงานแต่ละคนและวันปัจจุบัน
      employees.forEach(employee => {
        const today = new Date();
        permissions[employee.id] = canEditEmployeeWorkStatus(employee, today);
      });
      
      // อัปเดต state เพื่อเก็บสิทธิ์การแก้ไข
      setEmployeePermissions(permissions);
      
      // อัปเดต hasCheckedPermissions เพื่อป้องกันการทำงานซ้ำ
      setHasCheckedPermissions(true);
    }
  }, [session, employees]);
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // ดึงข้อมูลปฏิทินเมื่อมีการเปลี่ยนวันที่หรือโหมดการแสดงผล
  useEffect(() => {
    if (session) {
      setLoading(true);
      setError('');
      
      fetchCalendarData().then(() => {
        setLoading(false);
      }).catch((err) => {
        console.error('Error in calendar data fetching:', err);
        setLoading(false);
      });
    }
  }, [session, currentDate, viewMode]);

  // ฟังก์ชันสำหรับการนำทางปฏิทิน
  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // ฟังก์ชันสำหรับการคำนวณวันที่
  const getStartDate = () => {
    const date = new Date(currentDate);
    if (viewMode === 'week') {
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1); // ปรับให้เริ่มต้นที่วันจันทร์
      return new Date(date.setDate(diff));
    } else {
      return new Date(date.getFullYear(), date.getMonth(), 1);
    }
  };

  const getEndDate = () => {
    const date = new Date(currentDate);
    if (viewMode === 'week') {
      const startDate = getStartDate();
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      return endDate;
    } else {
      return new Date(date.getFullYear(), date.getMonth() + 1, 0);
    }
  };

  const getDaysArray = () => {
    const startDate = getStartDate();
    const endDate = getEndDate();
    const daysArray = [];
    const currentDay = new Date(startDate);

    while (currentDay <= endDate) {
      daysArray.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }

    // ถ้ามีการเลือกช่วงวันที่ 1-4 แต่แสดงเพียง 1-3 ให้เพิ่มวันสุดท้ายเข้าไปอีก 1 วัน
    if (daysArray.length > 0) {
      const firstDate = daysArray[0].getDate();
      const lastDate = daysArray[daysArray.length - 1].getDate();
      const expectedDaysCount = endDate.getDate() - startDate.getDate() + 1;
      
      // ตรวจสอบว่าจำนวนวันที่อยู่ในอาเรย์น้อยกว่าที่ควรจะมีหรือไม่
      if (daysArray.length < expectedDaysCount) {
        const lastDay = new Date(daysArray[daysArray.length - 1]);
        lastDay.setDate(lastDay.getDate() + 1);
        daysArray.push(lastDay);
      }
    }

    return daysArray;
  };

  // ฟังก์ชันสำหรับการแสดงผล
  const formatDayName = (date) => {
    return date.toLocaleDateString('th-TH', { weekday: 'short' });
  };

  const isWeekend = (date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  // ฟังก์ชันสำหรับการตรวจสอบสถานะของพนักงานในแต่ละวัน
  const getEmployeeStatusForDate = (employeeId, date) => {
    // แปลงวันที่ที่ต้องการตรวจสอบเป็น UTC ตั้งเวลาเป็น 12:00 น. เพื่อป้องกันปัญหา timezone
    const targetDate = new Date(date);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const day = targetDate.getDate();
    const targetUTCDate = new Date(Date.UTC(year, month, day, 12, 0, 0));
    
    // ตรวจสอบการลาที่อนุมัติแล้วก่อน เพราะมีความสำคัญสูงสุด
    const leave = leaves.find(leave => {
      if (!leave.startDate || !leave.endDate) return false;
      
      // แปลงวันที่เริ่มต้นและสิ้นสุดการลาเป็น UTC
      const startDate = new Date(leave.startDate);
      const sYear = startDate.getFullYear();
      const sMonth = startDate.getMonth();
      const sDay = startDate.getDate();
      const startUTCDate = new Date(Date.UTC(sYear, sMonth, sDay, 0, 0, 0));
      
      const endDate = new Date(leave.endDate);
      const eYear = endDate.getFullYear();
      const eMonth = endDate.getMonth();
      const eDay = endDate.getDate();
      const endUTCDate = new Date(Date.UTC(eYear, eMonth, eDay, 23, 59, 59));
      
      return leave.employeeId === employeeId && 
             startUTCDate <= targetUTCDate && 
             endUTCDate >= targetUTCDate &&
             (leave.status === 'approved' || leave.status === 'waiting_for_approve');
    });

    // ถ้ามีการลาที่อนุมัติแล้ว ให้แสดงเฉพาะข้อมูลการลา
    if (leave) {
      console.log(`Found leave for employee ${employeeId} on ${targetUTCDate.toISOString()}`);
      return {
        type: 'leave',
        data: leave,
        leaveType: leave.leaveType,
        status: leave.status
      };
    }

    // ถ้าไม่มีการลา ตรวจสอบสถานะการทำงานและ OT
    const employeeWorkStatus = workStatuses.find(workStatus => {
      if (!workStatus.date) return false;
      
      // แปลงวันที่ของสถานะการทำงานให้เป็น UTC
      const wsDate = new Date(workStatus.date);
      const wsYear = wsDate.getFullYear();
      const wsMonth = wsDate.getMonth();
      const wsDay = wsDate.getDate();
      const wsUTCDate = new Date(Date.UTC(wsYear, wsMonth, wsDay, 12, 0, 0));
      
      // เปรียบเทียบวันที่ใน UTC
      const isSameDate = wsUTCDate.getUTCFullYear() === targetUTCDate.getUTCFullYear() &&
                         wsUTCDate.getUTCMonth() === targetUTCDate.getUTCMonth() &&
                         wsUTCDate.getUTCDate() === targetUTCDate.getUTCDate();
                         
      return workStatus.employeeId === employeeId && isSameDate;
    });
    
    const employeeOvertime = overtimes.find(overtime => {
      if (!overtime.date) return false;
      
      // แปลงวันที่ของ OT ให้เป็น UTC
      const otDate = new Date(overtime.date);
      const otYear = otDate.getFullYear();
      const otMonth = otDate.getMonth();
      const otDay = otDate.getDate();
      const otUTCDate = new Date(Date.UTC(otYear, otMonth, otDay, 12, 0, 0));
      
      // เปรียบเทียบวันที่ใน UTC
      const isSameDate = otUTCDate.getUTCFullYear() === targetUTCDate.getUTCFullYear() &&
                         otUTCDate.getUTCMonth() === targetUTCDate.getUTCMonth() &&
                         otUTCDate.getUTCDate() === targetUTCDate.getUTCDate();
                         
      return overtime.employeeId === employeeId && 
             isSameDate &&
             (overtime.status === 'approved' || overtime.status === 'waiting_for_approve');
    });

    // ถ้ามีทั้ง work status และ OT
    if (employeeWorkStatus && employeeOvertime) {
      console.log(`Found work status and OT for employee ${employeeId} on ${targetUTCDate.toISOString()}`);
      return {
        type: 'workStatus',
        status: employeeWorkStatus.status,
        data: employeeWorkStatus,
        relatedStatuses: [{
          type: 'overtime',
          status: employeeOvertime.status,
          hours: employeeOvertime.hours || employeeOvertime.totalHours || 0,
          data: employeeOvertime
        }]
      };
    }

    // ถ้ามีแค่ work status
    if (employeeWorkStatus) {
      console.log(`Found work status for employee ${employeeId} on ${targetUTCDate.toISOString()}: ${employeeWorkStatus.status}`);
      return {
        type: 'workStatus',
        status: employeeWorkStatus.status,
        data: employeeWorkStatus,
        relatedStatuses: []
      };
    }

    // ถ้ามีแค่ OT
    if (employeeOvertime) {
      console.log(`Found OT for employee ${employeeId} on ${targetUTCDate.toISOString()}`);
      return {
        type: 'overtime',
        status: employeeOvertime.status,
        hours: employeeOvertime.hours || employeeOvertime.totalHours || 0,
        data: employeeOvertime,
        relatedStatuses: []
      };
    }

    return null;
  };

  // ฟังก์ชันตรวจสอบสิทธิ์การแก้ไขสถานะการทำงานของพนักงาน
  const canEditEmployeeWorkStatus = (employee, date = null) => {
    if (!session || !session.user) return false;
    
    // สร้างวันปัจจุบันสำหรับตรวจสอบวันที่
    const today = new Date();
    today.setHours(0, 0, 0, 0);
  
    // ใช้ date ที่ส่งเข้ามาหรือใช้ selectedDate ถ้าไม่มีการส่งค่ามา
    const currentDay = new Date(date || selectedDate || today);
    currentDay.setHours(0, 0, 0, 0);
    
    // อนุญาตให้แก้ไขข้อมูลได้เฉพาะวันปัจจุบันและอนาคตเท่านั้น (ยกเว้น admin)
    const isValidDate = currentDay >= today;
    
    // ตรวจสอบบทบาทของผู้ใช้
    const isAdmin = session.user.role === 'admin';
    const isSupervisor = session.user.role === 'supervisor';
    
    // ตรวจสอบว่าเป็นผู้ใช้คนเดียวกันกับที่ต้องการแก้ไขหรือไม่
    const isSelf = session.user.id === employee.id;
    
    // ถ้าเป็น admin สามารถแก้ไขได้เสมอ
    if (isAdmin) {
      return true;
    }
    
    // ถ้าเป็นตัวเอง สามารถแก้ไขได้เฉพาะวันปัจจุบันและอนาคต
    if (isSelf && isValidDate) {
      return true;
    }
    
    // ถ้าเป็น supervisor ตรวจสอบว่าเป็นพนักงานในทีมหรือไม่
    if (isSupervisor && isValidDate) {
      // ตรวจสอบว่าพนักงานอยู่ในทีมเดียวกันหรือไม่
      const userTeamId = session.user.teamId || (session.user.team?.id || null);
      const employeeTeamId = employee.teamId || (employee.team?.id || null);
      
      if (userTeamId && employeeTeamId) {
        return userTeamId === employeeTeamId;
      }
      
      // ถ้าไม่มีข้อมูลทีม ลองตรวจสอบจากแผนก
      const userDepartment = session.user.department || (session.user.departmentData?.name || null);
      const employeeDepartment = employee.department || (employee.departmentData?.name || null);
      
      if (userDepartment && employeeDepartment) {
        return userDepartment === employeeDepartment;
      }
      
      return false;
    }
    
    return false;
  };

  // ฟังก์ชันสำหรับการเปิด Modal สถานะการทำงาน
  const openWorkStatusModal = (employee, date, viewOnlyMode = false) => {
    const dateObj = new Date(date);
    dateObj.setHours(12, 0, 0, 0);
    const localDateStr = dateObj.toISOString().split('T')[0];
    
    // ตรวจสอบว่ามีข้อมูลการลาในวันนี้หรือไม่
    const leaveData = leaves.find(leave => {
      const startDate = new Date(leave.startDate);
      const endDate = new Date(leave.endDate);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      return leave.employeeId === employee.id && 
             startDate <= dateObj && 
             endDate >= dateObj;
    });
    
    // ตรวจสอบว่ามีข้อมูลสถานะการทำงานอยู่แล้วหรือไม่
    const existingWorkStatus = workStatuses.find(ws => {
      const wsDate = new Date(ws.date);
      const wsDateStr = wsDate.toISOString().split('T')[0];
      return ws.employeeId === employee.id && wsDateStr === localDateStr;
    });
    
    // ตรวจสอบว่ามีข้อมูล OT ในวันนี้หรือไม่
    const overtimeData = overtimes.find(ot => {
      const otDate = new Date(ot.date);
      const otDateStr = otDate.toISOString().split('T')[0];
      return ot.employeeId === employee.id && otDateStr === localDateStr;
    });
    
    setSelectedEmployee(employee);
    setSelectedDate(dateObj);
    setSelectedWorkStatus(existingWorkStatus || null);
    
    // ตรวจสอบสิทธิ์การแก้ไขสำหรับวันที่เลือก
    const canEdit = canEditEmployeeWorkStatus(employee, dateObj);
    
    // กำหนดโหมด viewOnly เมื่อเรียกดูข้อมูลย้อนหลังและไม่ใช่ admin หรือระบุ viewOnly = true หรือไม่มีสิทธิ์แก้ไข
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentDay = new Date(dateObj);
    currentDay.setHours(0, 0, 0, 0);
    
    const isViewOnlyMode = viewOnlyMode || 
                          ((currentDay < today) && session.user.role !== 'admin') || 
                          !canEdit;
    
    setIsWorkStatusModalOpen({ 
      isOpen: true, 
      viewOnly: isViewOnlyMode,
      leaveData: leaveData || null,
      overtimeData: overtimeData || null,
      defaultWorkStatus: null // ไม่ต้อง default ค่า
    });
  };

  // จัดการการบันทึกสถานะการทำงาน
  const handleWorkStatusSave = async (newWorkStatus) => {
    try {
      console.log('Saving work status:', newWorkStatus);
      
      // ตั้งค่า loading เป็น true เพื่อแสดงว่ากำลังบันทึกข้อมูล
      // setLoading(true);
      
      // ตรวจสอบว่ามีข้อมูลครบถ้วนหรือไม่
      if (!newWorkStatus.employeeId || !newWorkStatus.date) {
        toast.error('ข้อมูลไม่ครบถ้วน กรุณาระบุพนักงานและวันที่');
        // setLoading(false);
        return;
      }
      
      // เตรียมข้อมูลสำหรับส่งไปยัง API
      const requestBody = { ...newWorkStatus };
      
      // แปลงวันที่เป็น ISO string
      if (requestBody.date) {
        requestBody.date = new Date(requestBody.date).toISOString();
      }
      
      // ส่งข้อมูลไปยัง API
      const response = await fetch('/api/work-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${errorText || response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // เมื่อบันทึกสำเร็จ ให้รีเฟรชข้อมูล
        toast.success('บันทึกสถานะการทำงานเรียบร้อยแล้ว');
        
        // ดึงข้อมูลแค่เดือนที่มีการอัปเดต
        const updatedMonth = new Date(newWorkStatus.date);
        fetchWorkStatuses(updatedMonth, setWorkStatuses, setIsDataFetching);
        
        // รีเฟรชข้อมูลทั้งหมด
        refreshAfterSave(data.data);
      } else {
        toast.error(`บันทึกไม่สำเร็จ: ${data.message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'}`);
        // setLoading(false);
      }
    } catch (error) {
      console.error('Error saving work status:', error);
      toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
      // setLoading(false);
    }
  };

  // รีเฟรชข้อมูลหลังจากบันทึก
  const refreshAfterSave = async (savedData) => {
    try {
      // setLoading(true); // เพิ่มการเซ็ต loading เป็น true เมื่อเริ่มโหลดข้อมูล
      // ดึงข้อมูลใหม่ตามช่วงวันที่ปัจจุบัน
      const startDate = getStartDate();
      const endDate = getEndDate();
      
      // ตั้งค่า timeout เพื่อป้องกันการค้างนานเกินไป
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('Refresh data request timed out, aborting...');
        controller.abort();
        // เมื่อ timeout ให้เซ็ต loading เป็น false โดยทันที
        // setLoading(false);
        // แสดงข้อความแจ้งเตือนว่า timeout
        toast.error('การรีเฟรชข้อมูลใช้เวลานานเกินไป โปรดลองใหม่อีกครั้ง');
        // ปิด modal ถึงแม้ว่าการโหลดจะไม่สำเร็จ
        setIsWorkStatusModalOpen({ isOpen: false, viewOnly: false });
      }, 8000); // timeout 8 วินาที
      
      try {
        const response = await fetch(`/api/employee-calendar?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId); // ยกเลิก timeout เมื่อได้รับการตอบสนอง
        
        // ตรวจสอบว่า response ถูกต้องหรือไม่
        if (!response.ok) {
          console.log(`API responded with status: ${response.status}`);
          const errorText = await response.text();
          throw new Error(`API error: ${errorText || response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          // อัปเดตข้อมูลทั้งหมด
          setEmployees(data.data.employees || []);
          
          // แปลงวันที่ใน workStatuses ให้เป็น UTC format
          const processedWorkStatuses = (data.data.workStatuses || []).map(item => {
            if (item && item.date) {
              const dateObj = new Date(item.date);
              item.date = new Date(Date.UTC(
                dateObj.getFullYear(),
                dateObj.getMonth(),
                dateObj.getDate(),
                12, 0, 0
              ));
            }
            return item;
          });
          setWorkStatuses(processedWorkStatuses);
          
          // แปลงวันที่ใน leaves ให้เป็น UTC format
          const processedLeaves = (data.data.leaves || []).map(item => {
            if (item && item.startDate) {
              const startDateObj = new Date(item.startDate);
              item.startDate = new Date(Date.UTC(
                startDateObj.getFullYear(),
                startDateObj.getMonth(),
                startDateObj.getDate(),
                0, 0, 0
              ));
            }
            if (item && item.endDate) {
              const endDateObj = new Date(item.endDate);
              item.endDate = new Date(Date.UTC(
                endDateObj.getFullYear(),
                endDateObj.getMonth(),
                endDateObj.getDate(),
                23, 59, 59
              ));
            }
            return item;
          });
          setLeaves(processedLeaves);
          
          // แปลงวันที่ใน overtimes ให้เป็น UTC format
          const processedOvertimes = (data.data.overtimes || []).map(item => {
            if (item && item.date) {
              const dateObj = new Date(item.date);
              item.date = new Date(Date.UTC(
                dateObj.getFullYear(),
                dateObj.getMonth(),
                dateObj.getDate(),
                12, 0, 0
              ));
            }
            return item;
          });
          setOvertimes(processedOvertimes);
          
          toast.success('อัปเดตข้อมูลสำเร็จ');
        } else {
          console.log('Error refreshing data:', data.message);
          toast.error(`เกิดข้อผิดพลาดในการรีเฟรชข้อมูล: ${data.message || 'ไม่ทราบสาเหตุ'}`);
        }
      } catch (fetchError) {
        clearTimeout(timeoutId); // ยกเลิก timeout ในกรณีเกิดข้อผิดพลาด
        
        if (fetchError.name === 'AbortError') {
          console.log('Refresh data request was aborted');
          toast.error('การดึงข้อมูลใช้เวลานานเกินไป โปรดลองใหม่อีกครั้ง');
        } else {
          throw fetchError; // ส่งต่อข้อผิดพลาดไปยัง catch หลัก
        }
      }
    } catch (error) {
      console.log('Error refreshing data:', error.message);
      toast.error('เกิดข้อผิดพลาดในการรีเฟรชข้อมูล');
    } finally {
      // ปิด modal หลังจากที่โหลดข้อมูลเรียบร้อยแล้ว
      setIsWorkStatusModalOpen({ isOpen: false, viewOnly: false });
      // setLoading(false);
    }
  };

  // เรียกใช้งานฟังก์ชันดึงข้อมูลเมื่อมีการเปลี่ยนแปลงเดือนหรือปี
  useEffect(() => {
    // ดึงข้อมูลสถานะการทำงานเมื่อมีการเปลี่ยนเดือน
    if (session) {
      setIsDataFetching(true); // ตั้งค่าสถานะกำลังโหลดข้อมูล
      setLoading(true); // เพิ่ม loading state เพื่อแสดงหน้า loading
      
      const previousMonth = new Date(currentDate);
      previousMonth.setMonth(previousMonth.getMonth() - 1);
      
      const nextMonth = new Date(currentDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      
      // ดึงข้อมูลสถานะการทำงานของเดือนปัจจุบัน
      fetchWorkStatuses(currentDate, setWorkStatuses, setIsDataFetching);
      
      // ดึงข้อมูลสถานะการทำงานล่วงหน้าของเดือนถัดไป
      fetchWorkStatuses(nextMonth, (data) => {
        // ไม่ต้องทำอะไรกับข้อมูลเดือนถัดไป เพราะดึงมาเก็บไว้ใน cache เท่านั้น
      });
      
      // ดึงข้อมูลสถานะการทำงานของเดือนก่อนหน้า
      fetchWorkStatuses(previousMonth, (data) => {
        // ไม่ต้องทำอะไรกับข้อมูลเดือนก่อนหน้า เพราะดึงมาเก็บไว้ใน cache เท่านั้น
      }).finally(() => {
        setIsDataFetching(false); // เมื่อดึงข้อมูลเสร็จแล้ว ตั้งค่าสถานะเป็น false
        setLoading(false); // ปิด loading state เมื่อโหลดข้อมูลเสร็จ
      });
    }
  }, [session, currentDate]);
  
  // เรียกใช้ fetchWorkStatuses อีกครั้งเมื่อ employees โหลดเสร็จ
  useEffect(() => {
    if (session && employees.length > 0) {
      setLoading(true); // เพิ่ม loading state เมื่อเริ่มโหลดข้อมูล
      setIsDataFetching(true); // ตั้งค่าสถานะกำลังโหลดข้อมูล
      
      const currentMonth = new Date(currentDate);
      fetchWorkStatuses(currentMonth, setWorkStatuses, setIsDataFetching)
        .finally(() => {
          setLoading(false); // ปิด loading state เมื่อโหลดข้อมูลเสร็จ
          setIsDataFetching(false); // ตั้งค่าสถานะโหลดข้อมูลเป็น false
        });
    }
  }, [session, employees]);
  
  // กรองพนักงานตามแผนกและทีม
  const filteredEmployees = employees.filter(emp => {
    // กรองตามแผนก
    const deptName = typeof emp.department === 'object' && emp.department !== null 
      ? emp.department.name 
      : emp.department || 'ไม่ระบุแผนก';
    
    // กรองตามทีม
    const teamName = emp.teamName || 
      (emp.teamData && emp.teamData.name) || 
      (emp.team && typeof emp.team === 'object' && emp.team.name) ||
      (emp.team && typeof emp.team === 'string' ? emp.team : null) ||
      (emp.teamId && teamsData[emp.teamId] ? teamsData[emp.teamId].name : 'ไม่ระบุทีม');
    
    // เงื่อนไขการกรอง
    const matchesDepartment = selectedDepartment === 'all' || deptName === selectedDepartment;
    const matchesTeam = selectedTeam === 'all' || teamName === selectedTeam;
    
    return matchesDepartment && matchesTeam;
  });

  // แสดง loading ถ้ากำลังโหลดข้อมูลและยังไม่มีข้อมูลพนักงาน
  // เพิ่ม console.log เพื่อตรวจสอบค่า loading
  console.log('สถานะ Loading:', loading);
  console.log('สถานะ isDataFetching:', isDataFetching);
  console.log('จำนวนพนักงาน:', employees.length);

  if (!session) {
    return null;
  }

  // แสดงข้อความเมื่อไม่มีข้อมูลพนักงาน
  if (!loading && employees.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h1 className="text-2xl md:text-3xl font-bold">ปฏิทินพนักงาน</h1>
          </div>
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm flex flex-col items-center justify-center">
            <div className="text-center">
              <FiUsers className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium">ไม่พบข้อมูลพนักงาน</h3>
              <p className="mt-2 text-sm text-gray-500">ระบบได้รับการตอบกลับจาก API แล้ว แต่ไม่พบข้อมูลพนักงาน</p>
              <button 
                onClick={() => {
                  setLoading(true);
                  fetchCalendarData().finally(() => setLoading(false));
                }}
                className="mt-4 px-4 py-2 rounded-md bg-primary text-primary-foreground shadow hover:bg-primary/90 transition-colors font-medium"
              >
                โหลดข้อมูลใหม่
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const daysArray = getDaysArray();

  // แสดงผลกรณีที่กำลังโหลดข้อมูล
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h1 className="text-2xl md:text-3xl font-bold">ปฏิทินพนักงาน</h1>
          </div>
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm flex flex-col items-center justify-center">
            <LoadingPage message="กำลังโหลดข้อมูลปฏิทินพนักงาน..." />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-bold">ปฏิทินพนักงาน</h1>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={goToPrevious}
              className="p-2 rounded-md border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
              aria-label="ก่อนหน้า"
            >
              <FiChevronLeft className="w-5 h-5" />
            </button>
            
            <button
              onClick={goToToday}
              className="px-3 py-2 rounded-md bg-primary text-primary-foreground shadow hover:bg-primary/90 transition-colors font-medium"
            >
              วันนี้
            </button>
            
            <button
              onClick={goToNext}
              className="p-2 rounded-md border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
              aria-label="ถัดไป"
            >
              <FiChevronRight className="w-5 h-5" />
            </button>
            
            <div className="px-3 py-2 rounded-md border border-input bg-background font-medium">
              {formatMonthYear(currentDate)}
            </div>
            
            <div className="flex rounded-md overflow-hidden border border-input">
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-2 ${
                  viewMode === 'week'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                สัปดาห์
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-2 ${
                  viewMode === 'month'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                เดือน
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-3 flex items-center">
            <FiFilter className="mr-2" /> กรองข้อมูล
          </h2>
          <div className="flex flex-col space-y-4">
            {/* กรองตามแผนก */}
            <div>
              <h3 className="text-sm font-medium mb-2">แผนก</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedDepartment('all')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    selectedDepartment === 'all'
                      ? 'bg-primary text-primary-foreground shadow'
                      : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  ทั้งหมด
                </button>
                
                {departments.map(dept => (
                  <button
                    key={dept}
                    onClick={() => setSelectedDepartment(dept)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      selectedDepartment === dept
                        ? 'bg-primary text-primary-foreground shadow'
                        : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    {dept}
                  </button>
                ))}
              </div>
            </div>
            
            {/* กรองตามทีม */}
            <div>
              <h3 className="text-sm font-medium mb-2">ทีม</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedTeam('all')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    selectedTeam === 'all'
                      ? 'bg-primary text-primary-foreground shadow'
                      : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  ทั้งหมด
                </button>
                
                {teams.map(team => (
                  <button
                    key={team}
                    onClick={() => setSelectedTeam(team)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      selectedTeam === team
                        ? 'bg-primary text-primary-foreground shadow'
                        : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    {team}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider bg-gray-50 dark:bg-gray-700 sticky left-0 z-10 min-w-[200px]">
                    พนักงาน
                  </th>
                  {daysArray.map((day, index) => (
                    <th
                      key={index}
                      className={`px-2 py-3 text-center text-xs font-medium uppercase tracking-wider min-w-[80px] ${
                        isWeekend(day)
                          ? 'bg-gray-100 dark:bg-gray-600'
                          : 'bg-gray-50 dark:bg-gray-700'
                      } ${
                        isToday(day)
                          ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500'
                          : ''
                      }`}
                    >
                      <div>{formatDayName(day)}</div>
                      <div>{formatDate(day)}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-white dark:bg-gray-800 z-10 border-r border-gray-200 dark:border-gray-700">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <ProfileImage 
                              src={employee.image}
                              alt={`${employee.firstName || ''} ${employee.lastName || ''}`}
                              size="sm"
                              fallbackText={`${employee.firstName || ''} ${employee.lastName || ''}`}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium">
                              {employee.firstName || ''} {employee.lastName || ''}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {employee.position || ''} • {typeof employee.department === 'object' && employee.department !== null ? employee.department.name : (employee.department || 'ไม่ระบุแผนก')}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {(() => {
                                // เตรียมข้อมูลทีมจากทุกแหล่งที่เป็นไปได้
                                let teamName = null;
                                let teamId = null;
                                
                                // ตรวจสอบจากหลายแหล่งข้อมูล
                                if (employee.teamName) {
                                  teamName = employee.teamName;
                                } else if (employee.team) {
                                  if (typeof employee.team === 'string') {
                                    teamName = employee.team;
                                  } else if (employee.team.name) {
                                    teamName = employee.team.name;
                                  } else if (employee.team.id) {
                                    teamId = employee.team.id;
                                  }
                                }
                                
                                // ถ้าไม่พบใน team ให้ลองดูใน userTeam
                                if (!teamName && employee.userTeam) {
                                  if (typeof employee.userTeam === 'string') {
                                    teamName = employee.userTeam;
                                  } else if (employee.userTeam.name) {
                                    teamName = employee.userTeam.name;
                                  } else if (employee.userTeam.id) {
                                    teamId = employee.userTeam.id;
                                  }
                                }
                                
                                // ถ้าไม่พบในทุกแหล่งข้อมูลแบบนี้ ให้ลองดู teamId
                                if (!teamName && !teamId) {
                                  if (employee.teamId) {
                                    teamId = employee.teamId;
                                  } else if (employee.userTeamId) {
                                    teamId = employee.userTeamId;
                                  }
                                }
                                
                                // ถ้ามี teamId แต่ไม่มี teamName ให้ค้นหาชื่อทีมจาก teamsData
                                if (!teamName && teamId && teamsData[teamId]) {
                                  teamName = teamsData[teamId].name;
                                }
                                
                                // แสดงผลทีม
                                if (teamName || teamId) {
                                  return (
                                    <span className="flex items-center">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                      </svg>
                                      ทีม: {teamName || (teamId && teamsData[teamId] ? teamsData[teamId].name : (teamId ? 'รหัสทีม: ' + teamId : 'ไม่ระบุทีม'))}
                                    </span>
                                  );
                                } else {
                                  return (
                                    <span className="flex items-center text-gray-400">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                      </svg>
                                      ไม่ระบุทีม
                                    </span>
                                  );
                                }
                              })()}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      {daysArray.map((day, index) => {
                        const status = getEmployeeStatusForDate(employee.id, day);
                        // ตรวจสอบสิทธิ์การแก้ไขสำหรับแต่ละวัน
                        const canEdit = canEditEmployeeWorkStatus(employee, day);
                        
                        return (
                          <td
                            key={index}
                            className={`px-2 py-2 text-center text-xs ${
                              isWeekend(day)
                                ? 'bg-gray-50 dark:bg-gray-700/50'
                                : ''
                            } ${
                              isToday(day)
                                ? 'bg-primary-50/30 dark:bg-primary-900/10'
                                : ''
                            }`}
                          >
                            {status ? (
                              <div 
                                className="cursor-pointer h-full w-full"
                                onClick={() => openWorkStatusModal(employee, day, !canEdit)}
                              >
                                <div className="grid grid-cols-1 gap-1 h-full">
                                  {/* ส่วนสถานะหลัก - แสดงที่ด้านบน */}
                                  <div className={`rounded-md py-1 w-full h-full flex flex-col items-center justify-center 
                                    ${status.type === 'leave' ? `
                                      bg-orange-50 border-2 border-orange-200
                                      ${status.leaveType === 'ลาพักร้อน' ? 'text-emerald-600' :
                                         status.leaveType === 'ลากิจ' ? 'text-amber-600' :
                                         status.leaveType === 'ลาป่วย' ? 'text-red-600' :
                                         'text-purple-600'}` :
                                    status.type === 'overtime' ? `
                                      bg-purple-50 text-purple-600` :
                                    status.type === 'workStatus' ? `
                                      ${status.status === 'WFH' ? 'text-green-600' :
                                       status.status === 'MIXED' ? 'text-purple-600' :
                                       status.status === 'OFFSITE' ? 'text-gray-600' :
                                       'text-blue-600'}` :
                                    ''
                                  }`}>
                                    {status.type === 'leave' && (
                                      <div className="flex items-center justify-center py-0.5 px-1">
                                        <LeaveTypeIcon leaveType={status.leaveType} className="h-3 w-3" />
                                        <span className="truncate text-xs ml-1">{status.leaveType === 'ลาพักร้อน' ? 'พักร้อน' : 
                                          status.leaveType === 'ลากิจ' ? 'กิจ' : 
                                          status.leaveType === 'ลาป่วย' ? 'ป่วย' : 
                                          status.leaveType ? status.leaveType.substring(0, 4) : 'ลา'}</span>
                                      </div>
                                    )}
                                    
                                    {status.type === 'overtime' && (
                                      <OvertimeBadge 
                                        hours={status.hours || status.totalHours} 
                                        status={status.status} 
                                        size="sm" 
                                      />
                                    )}
                                    
                                    {status.type === 'workStatus' && (
                                      <WorkStatusBadge status={status.status} size="sm" />
                                    )}
                                  </div>
                                  
                                  {/* ส่วนสถานะที่เกี่ยวข้อง - แสดงด้านล่าง */}
                                  {status.relatedStatuses && status.relatedStatuses.length > 0 && (
                                    <div className="flex items-center justify-center gap-1">
                                      {status.relatedStatuses.map((relatedStatus, idx) => (
                                        <div key={idx} className={`rounded-md px-1 py-0.5 text-[10px] flex items-center justify-center ${
                                          relatedStatus.type === 'leave' ? `
                                            bg-orange-50 border border-orange-200
                                            ${relatedStatus.leaveType === 'ลาพักร้อน' ? 'text-emerald-600' :
                                              relatedStatus.leaveType === 'ลากิจ' ? 'text-amber-600' :
                                              relatedStatus.leaveType === 'ลาป่วย' ? 'text-red-600' :
                                              'text-purple-600'}` :
                                            relatedStatus.type === 'overtime' ? `
                                              bg-purple-50 text-purple-600` :
                                            relatedStatus.type === 'workStatus' ? `
                                              ${relatedStatus.status === 'WFH' ? 'text-green-600' :
                                                relatedStatus.status === 'MIXED' ? 'text-purple-600' :
                                                relatedStatus.status === 'OFFSITE' ? 'text-gray-600' :
                                                'text-blue-600'}` :
                                            'bg-gray-100 text-gray-800'
                                          }`}>
                                          {relatedStatus.type === 'leave' && (
                                            <span>ลา</span>
                                          )}
                                          {relatedStatus.type === 'overtime' && (
                                            <div className="flex items-center">
                                              <FiClock className="mr-0.5 h-2 w-2" />
                                              <span>OT {relatedStatus.hours || relatedStatus.totalHours} ชม.</span>
                                            </div>
                                          )}
                                          {relatedStatus.type === 'workStatus' && (
                                            <span>{relatedStatus.status}</span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              canEdit ? (
                                <div
                                  className="flex items-center justify-center h-9 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600 rounded cursor-pointer transition-colors"
                                  onClick={() => openWorkStatusModal(employee, day, false)}
                                  title="คลิกเพื่อกำหนดสถานะการทำงาน"
                                >
                                  <span className="text-lg">+</span>
                                </div>
                              ) : (
                                <div 
                                  className="h-9 cursor-default hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors flex items-center justify-center text-gray-400 text-xs"
                                >
                                  ไม่พบข้อมูล
                                </div>
                              )
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={daysArray.length + 1} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col items-center justify-center">
                        <FiUser className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4" />
                        <p className="text-lg font-medium">ไม่พบข้อมูลพนักงาน</p>
                        <p className="text-sm mt-1">ลองเปลี่ยนตัวกรองหรือเพิ่มข้อมูลพนักงานใหม่</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {renderLegend()}
      </div>
      
      {/* Modal สถานะการทำงาน */}
      <WorkStatusModal
        isOpen={isWorkStatusModalOpen}
        onClose={() => setIsWorkStatusModalOpen({ isOpen: false, viewOnly: false })}
        employee={{
          ...selectedEmployee,
          department: typeof selectedEmployee?.department === 'object' && selectedEmployee?.department !== null
            ? selectedEmployee.department.name
            : (selectedEmployee?.department || 'ไม่ระบุแผนก')
        }}
        date={selectedDate}
        currentUser={{
          ...session?.user,
          teamId: session?.user?.teamId || (session?.user?.team?.id || null),
          team: session?.user?.team
        }}
        existingStatus={selectedWorkStatus}
        onSave={handleWorkStatusSave}
      />
    </div>
  );
}

const EmployeeCalendarDay = ({ date, employee, onClick, onMouseEnter, onMouseLeave }) => {
  const { formatDate } = useFormatDate();
  const currentDate = useMemo(() => new Date(), []);
  const isPastDate = useMemo(() => date < currentDate && date.toDateString() !== currentDate.toDateString(), [date, currentDate]);
  const isWeekend = useMemo(() => date.getDay() === 0 || date.getDay() === 6, [date]);
  const isToday = useMemo(() => date.toDateString() === currentDate.toDateString(), [date, currentDate]);
  
  const user = useUser();
  const isAdmin = useMemo(() => user?.role === 'Admin', [user]);
  
  const statusData = useMemo(() => {
    return getEmployeeStatusForDate(employee.id, date);
  }, [employee.id, date]);
  
  const handleClick = () => {
    // ห้ามแก้ไขวันที่ผ่านมาแล้ว ยกเว้น admin
    if (isPastDate && !isAdmin) {
      return;
    }
    
    onClick(employee, date, statusData);
  };

  // ฟังก์ชันแสดงป้ายกำกับสถานะ
  const renderStatusBadge = (statusData) => {
    if (!statusData) return null;

    const getStatusColor = (type, status, leaveType) => {
      if (type === 'leave') {
        if (status === 'อนุมัติ') {
          switch (leaveType) {
            case 'ลาพักร้อน': return 'bg-emerald-500';
            case 'ลากิจ': return 'bg-amber-500';
            case 'ลาป่วย': return 'bg-red-500';
            default: return 'bg-gray-500';
          }
        } else if (status === 'รออนุมัติ') {
          return 'bg-yellow-400';
        } else {
          return 'bg-gray-500';
        }
      } else if (type === 'workStatus') {
        if (status === 'WFH') return 'bg-purple-500';
        return 'bg-indigo-500';
      } else if (type === 'overtime') {
        if (status === 'อนุมัติ') {
          return 'bg-blue-500';
        } else if (status === 'รออนุมัติ') {
          return 'bg-yellow-400';
        } else {
          return 'bg-gray-500';
        }
      }
      return 'bg-gray-500';
    };
    
    const badgeClasses = `w-full h-full flex items-center justify-center text-xs font-medium text-white rounded ${getStatusColor(statusData.type, statusData.status, statusData.leaveType)}`;
    
    // ข้อความที่จะแสดงบนป้าย
    let badgeText = '';
    let badgeIcon = null;
    
    if (statusData.type === 'leave') {
      if (statusData.leaveType === 'ลาพักร้อน') {
        badgeText = 'พักร้อน';
      } else if (statusData.leaveType === 'ลากิจ') {
        badgeText = 'ลากิจ';
      } else if (statusData.leaveType === 'ลาป่วย') {
        badgeText = 'ป่วย';
      } else {
        badgeText = statusData.leaveType ? statusData.leaveType.substring(0, 4) : 'ลา';
      }
      
      if (statusData.status === 'รออนุมัติ') {
        badgeText += ' *';
      }
      
      badgeIcon = <LeaveTypeIcon leaveType={statusData.leaveType} className="h-4 w-4 text-current" />;
    } else if (statusData.type === 'workStatus') {
      badgeText = statusData.status || 'ไม่ระบุ';
      badgeIcon = getWorkStatusIcon(statusData.status);
    } else if (statusData.type === 'overtime') {
      const hours = statusData.hours || statusData.totalHours;
      badgeText = `OT ${hours} ชม.`;
      if (statusData.status === 'รออนุมัติ') {
        badgeText += ' *';
      }
      
      badgeIcon = getOvertimeIcon();
    }
    
    // ถ้ามีสถานะที่เกี่ยวข้องเพิ่มเติม
    const hasRelatedStatuses = statusData.relatedStatuses && statusData.relatedStatuses.length > 0;
    
    // ถ้ามีการลาและมี WFH ในวันเดียวกัน
    const hasLeaveAndWfh = statusData.type === 'leave' && 
      statusData.relatedStatuses?.some(s => s.type === 'workStatus' && s.status === 'WFH');
    
    // แสดงทั้งสถานะการลาและ WFH ถ้ามีทั้งสองอย่าง
    if (hasLeaveAndWfh) {
      // เตรียมข้อมูล WFH
      const wfhStatus = statusData.relatedStatuses.find(s => s.type === 'workStatus');
      // เตรียมข้อมูล OT ถ้ามี
      const otStatus = statusData.relatedStatuses?.find(s => s.type === 'overtime');
      
      return (
        <div className={`cursor-pointer h-full w-full`} 
          onClick={handleClick}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}>
          <div className="relative w-full h-full">
            {/* ป้ายหลัก (การลา) */}
            <div className={badgeClasses}>
              <div className="flex items-center space-x-1">
                {badgeIcon}
                <span>{badgeText}</span>
              </div>
            </div>
            
            {/* ป้ายรอง (WFH) - แสดงเป็นสัญลักษณ์เล็กๆ ที่มุมขวาล่าง */}
            <div className="absolute bottom-0 right-0 bg-purple-500 text-white text-[8px] p-0.5 rounded-sm flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            
            {/* แสดงไอคอน OT ถ้ามี */}
            {otStatus && (
              <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[8px] p-0.5 rounded-sm flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            )}
          </div>
        </div>
      );
    }
    
    // กรณีที่มี Work Status และ OT ในวันเดียวกัน
    const hasWorkStatusAndOT = statusData.type === 'workStatus' && 
      statusData.relatedStatuses?.some(s => s.type === 'overtime');
      
    if (hasWorkStatusAndOT) {
      // เตรียมข้อมูล OT
      const otStatus = statusData.relatedStatuses.find(s => s.type === 'overtime');
      
      return (
        <div className={`cursor-pointer h-full w-full`} 
          onClick={handleClick}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}>
          <div className="relative w-full h-full">
            {/* ป้ายหลัก (Work Status) */}
            <div className={badgeClasses}>
              <div className="flex items-center space-x-1">
                {badgeIcon}
                <span>{badgeText}</span>
              </div>
            </div>
            
            {/* ป้ายรอง (OT) - แสดงเป็นสัญลักษณ์เล็กๆ ที่มุมขวาบน */}
            <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[8px] p-0.5 rounded-sm flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      );
    }
    
    // กรณีมีสถานะเพิ่มเติมทั่วไป แสดงสัญลักษณ์ + ที่มุมขวาล่าง
    if (hasRelatedStatuses) {
      return (
        <div className={`cursor-pointer h-full w-full`} 
          onClick={handleClick}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}>
          <div className="relative w-full h-full">
            <div className={badgeClasses}>
              <div className="flex items-center space-x-1">
                {badgeIcon}
                <span>{badgeText}</span>
              </div>
            </div>
            <div className="absolute bottom-0 right-0 bg-gray-800 text-white text-[8px] p-0.5 rounded-sm flex items-center">
              +{statusData.relatedStatuses.length}
            </div>
          </div>
        </div>
      );
    }
    
    // แสดงป้ายเดียวตามปกติถ้าไม่มีสถานะเพิ่มเติม
    return (
      <div className={`cursor-pointer h-full w-full ${badgeClasses}`} 
        onClick={handleClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}>
        <div className="flex items-center space-x-1">
          {badgeIcon}
          <span>{badgeText}</span>
        </div>
      </div>
    );
  };

  // ทูลทิปสำหรับแสดงรายละเอียดสถานะ
  const renderStatusTooltip = () => {
    if (!statusData) return null;
    
    let tooltipContent = '';
    
    if (statusData.type === 'leave') {
      tooltipContent = `${statusData.leaveType} (${statusData.status})`;
      
      // เพิ่มข้อมูล WFH ถ้ามี
      const wfhStatus = statusData.relatedStatuses?.find(s => s.type === 'workStatus');
      if (wfhStatus) {
        tooltipContent += `\nWFH (${wfhStatus.status})`;
      }
      
      // เพิ่มข้อมูล OT ถ้ามี
      const otStatus = statusData.relatedStatuses?.find(s => s.type === 'overtime');
      if (otStatus) {
        const hours = otStatus.hours || otStatus.totalHours;
        tooltipContent += `\nOT ${hours} ชม. (${otStatus.status})`;
        if (otStatus.startTime && otStatus.endTime) {
          const startTime = new Date(otStatus.startTime).toLocaleTimeString('th-TH', {hour: '2-digit', minute: '2-digit'});
          const endTime = new Date(otStatus.endTime).toLocaleTimeString('th-TH', {hour: '2-digit', minute: '2-digit'});
          tooltipContent += `\nเวลา ${startTime}-${endTime}`;
        }
      }
    } else if (statusData.type === 'workStatus') {
      tooltipContent = `สถานะการทำงาน: ${statusData.status}`;
      
      // เพิ่มข้อมูล OT ถ้ามี
      const otStatus = statusData.relatedStatuses?.find(s => s.type === 'overtime');
      if (otStatus) {
        tooltipContent += `\nOT ${otStatus.hours} ชม. (${otStatus.status})`;
      }
    } else if (statusData.type === 'overtime') {
      const hours = statusData.hours || statusData.totalHours;
      tooltipContent = `OT ${hours} ชม.`;
      
      // เพิ่มข้อมูลเวลาเริ่มต้นและสิ้นสุด ถ้ามี
      if (statusData.startTime && statusData.endTime) {
        const startTime = new Date(statusData.startTime).toLocaleTimeString('th-TH', {hour: '2-digit', minute: '2-digit'});
        const endTime = new Date(statusData.endTime).toLocaleTimeString('th-TH', {hour: '2-digit', minute: '2-digit'});
        tooltipContent += `\nเวลา ${startTime}-${endTime}`;
      }
      
      // เพิ่มข้อมูล WFH ถ้ามี
      const wfhStatus = statusData.relatedStatuses?.find(s => s.type === 'workStatus');
      if (wfhStatus) {
        tooltipContent += `\nWFH (${wfhStatus.status})`;
      }
    }
    
    return tooltipContent;
  };

  return (
    <div className={`cursor-pointer h-full w-full ${badgeClasses}`} 
      onClick={handleClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}>
      <div className="flex items-center space-x-1">
        {badgeIcon}
        <span>{badgeText}</span>
      </div>
    </div>
  );
};

const getStatusClasses = (status) => {
  if (!status) return '';
  
  if (status.type === 'leave') {
    const textColorClass = {
      'ลาพักร้อน': 'text-emerald-600',
      'ลากิจ': 'text-amber-600',
      'ลาป่วย': 'text-red-600',
      'อื่นๆ': 'text-purple-600'
    }[status.leaveType] || 'text-purple-600';
    
    return `bg-orange-50 border-2 border-orange-200 ${textColorClass}`;
  }
  
  if (status.type === 'overtime') {
    return 'bg-purple-50 text-purple-600';
  }
  
  // Work status
  const textColorClass = {
    'WFH': 'text-green-600',
    'MIXED': 'text-purple-600',
    'OFFSITE': 'text-gray-600',
    'OFFICE': 'text-blue-600'
  }[status.status] || 'text-blue-600';
  
  return `bg-blue-50 ${textColorClass}`;
};

const renderStatus = (status) => {
  if (!status) return null;
  return (
    <div
      className={`p-2 rounded-md flex items-center justify-between mb-1 ${getStatusClasses(status)}`}
    >
      <div className="flex items-center space-x-2">
        {status.type === 'leave' && (
          <LeaveTypeIcon leaveType={status.leaveType} className="h-5 w-5" />
        )}
        {status.type === 'overtime' && (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        {status.type === 'workStatus' && getWorkStatusIcon(status.status)}
        <span>{status.status}</span>
      </div>
      {status.description && (
        <span className="text-sm text-gray-500">{status.description}</span>
      )}
    </div>
  );
};
