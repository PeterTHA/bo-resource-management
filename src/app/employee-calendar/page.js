'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FiChevronLeft, FiChevronRight, FiCalendar, FiClock, FiUser, FiFilter } from 'react-icons/fi';
import { LoadingPage } from '../../components/ui/LoadingSpinner';
import Image from 'next/image';
import ProfileImage from '../../components/ui/ProfileImage';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('week'); // 'week', 'month'
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [departments, setDepartments] = useState([]);

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
    const dateStr = date.toISOString().split('T')[0];
    
    // ตรวจสอบการลา
    const employeeLeaves = leaves.filter(leave => 
      leave.employeeId === employeeId &&
      new Date(leave.startDate) <= date &&
      new Date(leave.endDate) >= date &&
      leave.status !== 'ยกเลิก' &&
      (!leave.isCancelled || leave.cancelStatus === 'รออนุมัติ' || leave.cancelStatus === 'ไม่อนุมัติ')
    );
    
    if (employeeLeaves.length > 0) {
      return {
        type: 'leave',
        status: employeeLeaves[0].status,
        leaveType: employeeLeaves[0].leaveType,
        data: employeeLeaves[0]
      };
    }
    
    // ตรวจสอบการทำงานล่วงเวลา
    const employeeOvertimes = overtimes.filter(overtime => 
      overtime.employeeId === employeeId &&
      new Date(overtime.date).toISOString().split('T')[0] === dateStr &&
      overtime.status !== 'ยกเลิก' &&
      (!overtime.isCancelled || overtime.cancelStatus === 'รออนุมัติ' || overtime.cancelStatus === 'ไม่อนุมัติ')
    );
    
    if (employeeOvertimes.length > 0) {
      return {
        type: 'overtime',
        status: employeeOvertimes[0].status,
        hours: employeeOvertimes[0].totalHours,
        data: employeeOvertimes[0]
      };
    }
    
    return null;
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
                          >
                            {status ? (
                              <div className="flex flex-col items-center">
                                {status.type === 'leave' && (
                                  <div
                                    className={`px-2 py-1 rounded-full w-full ${
                                      status.status === 'อนุมัติ'
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                        : status.status === 'ไม่อนุมัติ'
                                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                    }`}
                                    title={`${status.leaveType} - ${status.status}`}
                                  >
                                    <div className="flex items-center justify-center">
                                      <FiCalendar className="mr-1 h-3 w-3" />
                                      <span className="truncate">{status.leaveType}</span>
                                    </div>
                                  </div>
                                )}
                                
                                {status.type === 'overtime' && (
                                  <div
                                    className={`px-2 py-1 rounded-full w-full ${
                                      status.status === 'อนุมัติ'
                                        ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
                                        : status.status === 'ไม่อนุมัติ'
                                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                    }`}
                                    title={`OT ${status.hours} ชม. - ${status.status}`}
                                  >
                                    <div className="flex items-center justify-center">
                                      <FiClock className="mr-1 h-3 w-3" />
                                      <span>{status.hours} ชม.</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-500">•</span>
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
              <div className="w-4 h-4 rounded-full bg-green-100 dark:bg-green-900 mr-2"></div>
              <span className="text-sm">ลางานที่อนุมัติแล้ว</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-yellow-100 dark:bg-yellow-900 mr-2"></div>
              <span className="text-sm">ลางานที่รออนุมัติ</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-red-100 dark:bg-red-900 mr-2"></div>
              <span className="text-sm">ลางานที่ไม่อนุมัติ</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-900 mr-2"></div>
              <span className="text-sm">ทำงานล่วงเวลาที่อนุมัติแล้ว</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-yellow-100 dark:bg-yellow-900 mr-2"></div>
              <span className="text-sm">ทำงานล่วงเวลาที่รออนุมัติ</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-red-100 dark:bg-red-900 mr-2"></div>
              <span className="text-sm">ทำงานล่วงเวลาที่ไม่อนุมัติ</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 