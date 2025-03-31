'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FiChevronLeft, FiChevronRight, FiCalendar, FiClock, FiUser, FiFilter, FiHome, FiBriefcase, FiRefreshCw, FiCheck, FiX } from 'react-icons/fi';
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

// เพิ่มฟังก์ชันตรวจสอบว่าเป็นรูปภาพจาก mock-images หรือไม่
const isMockImage = (src) => {
  return src && typeof src === 'string' && (src.startsWith('/mock-images/') || src.startsWith('./mock-images/'));
};

export default function EmployeeCalendarPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [overtimes, setOvertimes] = useState([]);
  const [workStatuses, setWorkStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('week'); // 'week', 'month'
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [departments, setDepartments] = useState([]);
  
  // Modal สำหรับสถานะการทำงาน
  const [isWorkStatusModalOpen, setIsWorkStatusModalOpen] = useState({ isOpen: false, viewOnly: false });
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedWorkStatus, setSelectedWorkStatus] = useState(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!session) return;

      setLoading(true);
      try {
        // คำนวณช่วงวันที่
        const startDate = getStartDate();
        const endDate = getEndDate();
        
        // ดึงข้อมูลทั้งหมดจาก API เดียว
        const calendarRes = await fetch(`/api/employee-calendar?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
        const calendarData = await calendarRes.json();

        if (calendarData.success) {
          // อัปเดตข้อมูลพนักงาน
          setEmployees(calendarData.data.employees);
          
          // ดึงรายชื่อแผนก
          const uniqueDepartments = [...new Set(calendarData.data.employees.map(emp => {
            return typeof emp.department === 'object' ? emp.department.name : emp.department;
          }))];
          setDepartments(uniqueDepartments);
          
          // อัปเดตข้อมูลการลา
          setLeaves(calendarData.data.leaves);
          
          // อัปเดตข้อมูลการทำงานล่วงเวลา
          setOvertimes(calendarData.data.overtimes);
          
          // อัปเดตข้อมูลสถานะการทำงาน (WFH)
          setWorkStatuses(calendarData.data.workStatuses || []);
        } else {
          setError('ไม่สามารถดึงข้อมูลปฏิทินพนักงานได้');
        }
      } catch (err) {
        console.error('เกิดข้อผิดพลาดในการดึงข้อมูล:', err);
        setError('เกิดข้อผิดพลาดในการดึงข้อมูล');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
  const formatDate = (date) => {
    return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
  };

  const formatDayName = (date) => {
    return date.toLocaleDateString('th-TH', { weekday: 'short' });
  };

  const formatMonthYear = (date) => {
    return date.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
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
    // ปรับรูปแบบวันที่ให้เป็น YYYY-MM-DD โดยไม่มีเวลา
    const localDateStr = date.toISOString().split('T')[0];
    
    // ตรวจสอบสถานะการทำงาน (WFH) โดยเทียบวันที่ในรูปแบบ YYYY-MM-DD
    const employeeWorkStatus = workStatuses.find(workStatus => {
      const wsDate = new Date(workStatus.date);
      const wsDateStr = wsDate.toISOString().split('T')[0];
      return workStatus.employeeId === employeeId && wsDateStr === localDateStr;
    });
    
    // ตรวจสอบการลา
    const employeeLeaves = leaves.filter(leave => {
      // แปลงวันที่ให้เป็น Date Object ที่สามารถเปรียบเทียบได้
      const startDate = new Date(leave.startDate);
      const endDate = new Date(leave.endDate);
      // ตัดส่วนเวลาออกเพื่อเปรียบเทียบเฉพาะวันที่
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      const compareDate = new Date(date);
      compareDate.setHours(12, 0, 0, 0); // ตั้งให้เป็นเวลาเที่ยงเพื่อป้องกันปัญหา timezone
      
      return leave.employeeId === employeeId && 
             startDate <= compareDate && 
             endDate >= compareDate &&
             leave.status === 'อนุมัติ' &&
             (!leave.isCancelled || leave.cancelStatus !== 'อนุมัติ');
    });
    
    // ตรวจสอบการทำงานล่วงเวลา
    const employeeOvertimes = overtimes.filter(overtime => {
      const otDate = new Date(overtime.date);
      const otDateStr = otDate.toISOString().split('T')[0];
      return overtime.employeeId === employeeId &&
             otDateStr === localDateStr &&
             overtime.status !== 'ยกเลิก' &&
             (!overtime.isCancelled || overtime.cancelStatus === 'รออนุมัติ' || overtime.cancelStatus === 'ไม่อนุมัติ');
    });
    
    // สร้างอาเรย์ของสถานะทั้งหมดที่พบ
    const allStatuses = [];
    
    // เพิ่มข้อมูลสถานะการทำงาน (WFH)
    if (employeeWorkStatus) {
      allStatuses.push({
        type: 'workStatus',
        status: employeeWorkStatus.status,
        data: employeeWorkStatus,
        priority: 2 // ความสำคัญระดับกลาง
      });
    }
    
    // เพิ่มข้อมูลการลา
    if (employeeLeaves.length > 0) {
      // ให้การลาที่อนุมัติแล้วมีความสำคัญสูงสุด
      const leaveStatus = employeeLeaves[0];
      allStatuses.push({
        type: 'leave',
        status: leaveStatus.status,
        leaveType: leaveStatus.leaveType,
        data: leaveStatus,
        priority: leaveStatus.status === 'อนุมัติ' ? 5 : 3 // การลาที่อนุมัติแล้วมีความสำคัญสูงสุด
      });
    }
    
    // เพิ่มข้อมูลการทำงานล่วงเวลา
    if (employeeOvertimes.length > 0) {
      allStatuses.push({
        type: 'overtime',
        status: employeeOvertimes[0].status,
        hours: employeeOvertimes[0].totalHours,
        data: employeeOvertimes[0],
        priority: 1 // ความสำคัญต่ำสุด
      });
    }
    
    // ถ้าไม่มีสถานะใดๆ
    if (allStatuses.length === 0) {
      return null;
    }
    
    // จัดเรียงสถานะตามความสำคัญ (เลขยิ่งมาก ยิ่งสำคัญ)
    allStatuses.sort((a, b) => b.priority - a.priority);
    
    // คืนค่าสถานะที่มีความสำคัญสูงสุด และแนบสถานะอื่นๆ ไปด้วย
    const primaryStatus = { ...allStatuses[0], relatedStatuses: allStatuses.slice(1) };
    return primaryStatus;
  };

  // ฟังก์ชันสำหรับการเปิด Modal สถานะการทำงาน
  const openWorkStatusModal = (employee, date, viewOnlyMode = false) => {
    const dateObj = new Date(date);
    dateObj.setHours(12, 0, 0, 0); // ตั้งเวลาเป็นเที่ยงวันเพื่อป้องกันปัญหา timezone
    const localDateStr = dateObj.toISOString().split('T')[0]; // รูปแบบ YYYY-MM-DD
    
    // ตรวจสอบว่ามีข้อมูลสถานะการทำงานอยู่แล้วหรือไม่ โดยใช้รูปแบบวันที่เดียวกับที่ใช้ตรวจสอบในฟังก์ชัน getEmployeeStatusForDate
    const existingWorkStatus = workStatuses.find(ws => {
      const wsDate = new Date(ws.date);
      const wsDateStr = wsDate.toISOString().split('T')[0];
      return ws.employeeId === employee.id && wsDateStr === localDateStr;
    });
    
    // ตรวจสอบว่ามีข้อมูลการลาในวันนี้หรือไม่
    const leaveData = leaves.find(leave => {
      const startDate = new Date(leave.startDate);
      const endDate = new Date(leave.endDate);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      return leave.employeeId === employee.id && 
             startDate <= dateObj && 
             endDate >= dateObj &&
             leave.status === 'อนุมัติ' &&
             (!leave.isCancelled || leave.cancelStatus !== 'อนุมัติ');
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
    
    // กำหนดโหมด viewOnly เมื่อเรียกดูข้อมูลวันที่ผ่านไปแล้ว หรือไม่มีสิทธิ์แก้ไข
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentDay = new Date(dateObj);
    currentDay.setHours(0, 0, 0, 0);
    
    // กำหนดเป็น view-only mode หากเป็นการดูข้อมูลย้อนหลังและไม่ใช่ admin หรือระบุ viewOnly = true
    const isViewOnlyMode = viewOnlyMode || ((currentDay < today) && session.user.role !== 'admin');
    setIsWorkStatusModalOpen({ 
      isOpen: true, 
      viewOnly: isViewOnlyMode,
      leaveData: leaveData || null,
      overtimeData: overtimeData || null
    });
  };

  // ฟังก์ชันตรวจสอบสิทธิ์การแก้ไขข้อมูลพนักงาน
  const canEditEmployeeWorkStatus = (employee) => {
    const isAdmin = session.user.role === 'admin';
    const isTeamLead = session.user.role === 'team_lead' || session.user.role === 'supervisor';
    const isSameUser = session.user.id === employee.id;
    
    // แก้ไขการตรวจสอบทีม
    const userTeamId = session.user.teamId || (session.user.team?.id || null);
    const employeeTeamId = employee.teamId || (employee.team?.id || null);
    const isInSameTeam = isTeamLead && userTeamId && employeeTeamId && userTeamId === employeeTeamId;
    
    return isAdmin || isSameUser || isInSameTeam;
  };

  // ฟังก์ชันสำหรับการจัดการเมื่อบันทึกข้อมูลสถานะการทำงาน
  const handleWorkStatusSave = (newWorkStatus) => {
    // กรณีมี flag forceRefresh ให้ดึงข้อมูลใหม่ทั้งหมด
    if (newWorkStatus && newWorkStatus.forceRefresh) {
      // คำนวณช่วงวันที่
      const startDate = getStartDate();
      const endDate = getEndDate();
      
      // ดึงข้อมูลทั้งหมดใหม่จาก API
      fetch(`/api/employee-calendar?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
        .then(res => res.json())
        .then(calendarData => {
          if (calendarData.success) {
            // อัปเดตข้อมูลพนักงาน
            setEmployees(calendarData.data.employees);
            
            // อัปเดตข้อมูลการลา
            setLeaves(calendarData.data.leaves);
            
            // อัปเดตข้อมูลการทำงานล่วงเวลา
            setOvertimes(calendarData.data.overtimes);
            
            // อัปเดตข้อมูลสถานะการทำงาน (WFH)
            setWorkStatuses(calendarData.data.workStatuses || []);
            
            toast.success('รีเฟรชข้อมูลสำเร็จ');
          }
        })
        .catch(err => {
          console.error('เกิดข้อผิดพลาดในการรีเฟรชข้อมูล:', err);
          toast.error('เกิดข้อผิดพลาดในการรีเฟรชข้อมูล');
        });
      
      return;
    }
    
    // ตรวจสอบว่าเป็นการอัพเดทหลายรายการหรือไม่
    if (newWorkStatus && newWorkStatus.multipleUpdate) {
      const { statuses } = newWorkStatus;
      
      // สร้าง Map ของสถานะที่มีอยู่แล้วเพื่อช่วยในการอัพเดท
      const existingWorkStatusMap = new Map(workStatuses.map(ws => [ws.id, ws]));
      
      // อัพเดทหรือเพิ่มแต่ละสถานะที่ได้รับ
      for (const status of statuses) {
        if (existingWorkStatusMap.has(status.id)) {
          // อัพเดทสถานะเดิม
          existingWorkStatusMap.set(status.id, status);
        } else {
          // เพิ่มสถานะใหม่
          existingWorkStatusMap.set(status.id, status);
        }
      }
      
      // อัพเดท state ด้วยค่าใหม่ทั้งหมด
      setWorkStatuses(Array.from(existingWorkStatusMap.values()));
      return;
    }
    
    // ตรวจสอบว่าเป็นการลบหรือไม่
    if (newWorkStatus === null) {
      setWorkStatuses(prev => prev.filter(ws => ws.id !== selectedWorkStatus.id));
      return;
    }
    
    // กรณีเป็นการอัพเดทหรือเพิ่มข้อมูลเดียว
    setWorkStatuses(prev => {
      const existingIndex = prev.findIndex(ws => ws.id === newWorkStatus.id);
      if (existingIndex !== -1) {
        // อัพเดทสถานะเดิม
        const updated = [...prev];
        updated[existingIndex] = newWorkStatus;
        return updated;
      } else {
        // เพิ่มสถานะใหม่
        return [...prev, newWorkStatus];
      }
    });
  };

  // กรองพนักงานตามแผนก
  const filteredEmployees = selectedDepartment === 'all'
    ? employees
    : employees.filter(emp => {
        const deptName = typeof emp.department === 'object' ? emp.department.name : emp.department;
        return deptName === selectedDepartment;
      });

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingPage message="กำลังโหลดข้อมูลปฏิทินพนักงาน..." />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const daysArray = getDaysArray();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-bold">ปฏิทินพนักงาน</h1>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={goToPrevious}
              className="p-2 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              aria-label="ก่อนหน้า"
            >
              <FiChevronLeft className="w-5 h-5" />
            </button>
            
            <button
              onClick={goToToday}
              className="px-3 py-2 rounded-md bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors font-medium"
            >
              วันนี้
            </button>
            
            <button
              onClick={goToNext}
              className="p-2 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              aria-label="ถัดไป"
            >
              <FiChevronRight className="w-5 h-5" />
            </button>
            
            <div className="px-3 py-2 rounded-md bg-gray-100 dark:bg-gray-700 font-medium">
              {formatMonthYear(currentDate)}
            </div>
            
            <div className="flex rounded-md overflow-hidden border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-2 ${
                  viewMode === 'week'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                สัปดาห์
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-2 ${
                  viewMode === 'month'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
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
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedDepartment('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                selectedDepartment === 'all'
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              ทั้งหมด
            </button>
            
            {departments.map(dept => (
              <button
                key={dept}
                onClick={() => setSelectedDepartment(dept)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedDepartment === dept
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {dept}
              </button>
            ))}
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
                              {employee.position || ''} • {typeof employee.department === 'object' ? employee.department.name : (employee.department || '')}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      {daysArray.map((day, index) => {
                        const status = getEmployeeStatusForDate(employee.id, day);
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
                            onClick={() => {
                              // คลิกเพื่อเปิด Modal และแสดงรายละเอียดหรือแก้ไข
                              openWorkStatusModal(employee, day, !canEditEmployeeWorkStatus(employee));
                            }}
                          >
                            {status ? (
                              <div className="cursor-pointer h-full w-full">
                                {/* แสดงข้อมูลแบบใหม่ ที่สามารถแสดงหลายสถานะพร้อมกัน */}
                                <div className="grid grid-cols-1 gap-1 h-full">
                                  {/* ส่วนสถานะหลัก - แสดงที่ด้านบน */}
                                  <div className={`rounded-full py-1 w-full h-full flex flex-col items-center justify-center 
                                   ${status.type === 'leave' && status.status === 'อนุมัติ' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}
                                   ${status.type === 'leave' && status.status === 'ไม่อนุมัติ' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : ''}
                                   ${status.type === 'leave' && status.status === 'รออนุมัติ' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : ''}
                                   ${status.type === 'overtime' && status.status === 'อนุมัติ' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' : ''}
                                   ${status.type === 'overtime' && status.status === 'ไม่อนุมัติ' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : ''}
                                   ${status.type === 'overtime' && status.status === 'รออนุมัติ' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : ''}
                                  `}>
                                    {status.type === 'leave' && (
                                      <div className="flex items-center justify-center py-0.5 px-1">
                                        <FiCalendar className="mr-0.5 h-3 w-3" />
                                        <span className="truncate text-xs">{status.leaveType === 'ลาพักร้อน' ? 'พักร้อน' : 
                                          status.leaveType === 'ลากิจ' ? 'กิจ' : 
                                          status.leaveType === 'ลาป่วย' ? 'ป่วย' : 
                                          status.leaveType.substring(0, 4)}</span>
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
                                        <div key={idx} className={`rounded-full px-1 py-0.5 text-[10px] flex items-center justify-center ${
                                          relatedStatus.type === 'leave' 
                                            ? (relatedStatus.status === 'อนุมัติ' 
                                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                              : relatedStatus.status === 'ไม่อนุมัติ' 
                                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
                                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200')
                                            : relatedStatus.type === 'overtime'
                                            ? (relatedStatus.status === 'อนุมัติ' 
                                              ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' 
                                              : relatedStatus.status === 'ไม่อนุมัติ' 
                                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
                                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200')
                                            : relatedStatus.type === 'workStatus'
                                            ? (relatedStatus.status === 'WFH' 
                                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                              : relatedStatus.status === 'MIXED' 
                                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' 
                                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200')
                                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
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
                              canEditEmployeeWorkStatus(employee) ? (
                                <div
                                  className="flex items-center justify-center h-9 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600 rounded cursor-pointer transition-colors"
                                  title="คลิกเพื่อกำหนดสถานะการทำงาน"
                                >
                                  <span className="text-lg">+</span>
                                </div>
                              ) : (
                                <div className="h-9"></div>
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
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-3">คำอธิบาย</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-4 h-4 rounded-full bg-green-100 dark:bg-green-900 mr-2">
                <FiCheck className="h-3 w-3 text-green-500" />
              </div>
              <span className="text-sm">ลางานที่อนุมัติแล้ว</span>
            </div>
            <div className="flex items-center">
              <div className="flex items-center justify-center w-4 h-4 rounded-full bg-yellow-100 dark:bg-yellow-900 mr-2">
                <FiClock className="h-3 w-3 text-yellow-500" />
              </div>
              <span className="text-sm">ลางานที่รออนุมัติ</span>
            </div>
            <div className="flex items-center">
              <div className="flex items-center justify-center w-4 h-4 rounded-full bg-red-100 dark:bg-red-900 mr-2">
                <FiX className="h-3 w-3 text-red-500" />
              </div>
              <span className="text-sm">ลางานที่ไม่อนุมัติ</span>
            </div>
            <div className="flex items-center">
              <div className="flex items-center justify-center w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-900 mr-2">
                <FiClock className="h-3 w-3 text-indigo-500" />
              </div>
              <span className="text-sm">ทำงานล่วงเวลาที่อนุมัติแล้ว</span>
            </div>
            <div className="flex items-center">
              <div className="flex items-center justify-center w-4 h-4 rounded-full bg-yellow-100 dark:bg-yellow-900 mr-2">
                <FiClock className="h-3 w-3 text-yellow-500" />
              </div>
              <span className="text-sm">ทำงานล่วงเวลาที่รออนุมัติ</span>
            </div>
            <div className="flex items-center">
              <div className="flex items-center justify-center w-4 h-4 rounded-full bg-red-100 dark:bg-red-900 mr-2">
                <FiClock className="h-3 w-3 text-red-500" />
              </div>
              <span className="text-sm">ทำงานล่วงเวลาที่ไม่อนุมัติ</span>
            </div>
            <div className="flex items-center">
              <WorkStatusBadge status="OFFICE" size="sm" />
              <span className="text-sm ml-2">ทำงานที่ออฟฟิศ</span>
            </div>
            <div className="flex items-center">
              <WorkStatusBadge status="WFH" size="sm" />
              <span className="text-sm ml-2">Work From Home</span>
            </div>
            <div className="flex items-center">
              <WorkStatusBadge status="MIXED" size="sm" />
              <span className="text-sm ml-2">ทำงานแบบผสม</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal สถานะการทำงาน */}
      <WorkStatusModal
        isOpen={isWorkStatusModalOpen}
        onClose={() => setIsWorkStatusModalOpen({ isOpen: false, viewOnly: false })}
        employee={selectedEmployee}
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
    
    // ฟังก์ชันสำหรับแสดงไอคอนตามประเภทการลา
    const getLeaveIcon = (leaveType) => {
      switch (leaveType) {
        case 'ลาพักร้อน':
          return (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          );
        case 'ลากิจ':
          return (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          );
        case 'ลาป่วย':
          return (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          );
        default:
          return (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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
        badgeText = 'ลาป่วย';
      } else {
        badgeText = statusData.leaveType.substring(0, 4);
      }
      
      if (statusData.status === 'รออนุมัติ') {
        badgeText += ' *';
      }
      
      badgeIcon = getLeaveIcon(statusData.leaveType);
    } else if (statusData.type === 'workStatus') {
      badgeText = statusData.status;
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
    <div 
      className={`border ${isToday ? 'border-blue-500' : 'border-gray-200'} ${isWeekend ? 'bg-gray-50' : 'bg-white'} h-10 p-[2px]`}
    >
      {statusData ? (
        <div className="h-full w-full relative" title={renderStatusTooltip()}>
          {renderStatusBadge(statusData)}
        </div>
      ) : (
        <div 
          className="h-full w-full cursor-pointer hover:bg-gray-100 flex items-center justify-center"
          onClick={handleClick}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          <div className="h-2 w-2 rounded-full bg-gray-200 hover:bg-gray-400"></div>
        </div>
      )}
    </div>
  );
}; 