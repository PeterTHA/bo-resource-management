'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
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
  const [isDataFetching, setIsDataFetching] = useState(false);
  const [hasCheckedPermissions, setHasCheckedPermissions] = useState(false);

  // เพิ่ม ref สำหรับเก็บ AbortController
  const abortControllerRef = useRef(null);
  
  // Modal สำหรับสถานะการทำงาน
  const [isWorkStatusModalOpen, setIsWorkStatusModalOpen] = useState({ isOpen: false, viewOnly: false });
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedWorkStatus, setSelectedWorkStatus] = useState(null);

  // เพิ่ม state เพื่อเก็บสิทธิ์การแก้ไขของพนักงานแต่ละคน
  const [employeePermissions, setEmployeePermissions] = useState({});
  
  // useEffect สำหรับตรวจสอบสิทธิ์ของพนักงานทุกคน
  useEffect(() => {
    if (session && employees.length > 0) {
      console.log('Computing permissions for all employees...');
      
      // สร้าง object เพื่อเก็บข้อมูลการมีสิทธิ์แก้ไขของพนักงานแต่ละคน
      const permissions = {};
      
      // ตรวจสอบสิทธิ์สำหรับพนักงานแต่ละคนและวันปัจจุบัน
      employees.forEach(employee => {
        const today = new Date();
        permissions[employee.id] = canEditEmployeeWorkStatus(employee, today);
      });
      
      console.log('Employee permissions:', permissions);
      // อัปเดต state เพื่อเก็บสิทธิ์การแก้ไข
      setEmployeePermissions(permissions);
      
      // อัปเดต hasCheckedPermissions เพื่อป้องกันการทำงานซ้ำ
      setHasCheckedPermissions(true);
    }
  }, [session, employees]);
  
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
    const isSameUser = session.user.id === employee.id;
    
    // แสดงข้อมูลการตรวจสอบ
    console.log('PERMISSION CHECK:', {
      user: `${session.user.firstName || ''} ${session.user.lastName || ''}`,
      role: session.user.role,
      employee: `${employee.firstName || ''} ${employee.lastName || ''}`,
      userTeam: session.user.userTeam || session.user.userTeamId,
      employeeTeam: employee.team || employee.teamId
    });
    
    // 1. กรณีเป็น admin - มีสิทธิ์ทั้งหมด
    if (isAdmin) {
      console.log(`✅ ADMIN ACCESS GRANTED`);
      return true; // admin สามารถแก้ไขได้ทุกวัน แม้จะเป็นวันที่ผ่านมาแล้ว
    }
    
    // 2. กรณีเป็นเจ้าของข้อมูล - แก้ไขตัวเองได้
    if (isSameUser) {
      console.log(`✅ SELF ACCESS GRANTED`);
      return isValidDate; // แก้ไขตัวเองได้เฉพาะวันปัจจุบันและอนาคต
    }
    
    // 3. กรณีเป็น supervisor - สามารถแก้ไขได้เฉพาะคนในทีมตัวเอง
    if (isSupervisor) {
      // ดึงและตรวจสอบ team ของ supervisor และพนักงาน
      let userTeamId = null;
      let employeeTeamId = null;
      
      // ตรวจสอบหาค่า teamId ของ user จากหลายแหล่ง
      if (session.user.userTeam && typeof session.user.userTeam === 'object') {
        userTeamId = session.user.userTeam.id;
      } else if (typeof session.user.userTeam === 'string') {
        userTeamId = session.user.userTeam;
      } else if (session.user.userTeamId) {
        userTeamId = session.user.userTeamId;
      } else if (session.user.teamId) {
        userTeamId = session.user.teamId;
      } else if (session.user.team && typeof session.user.team === 'object') {
        userTeamId = session.user.team.id;
      } else if (typeof session.user.team === 'string') {
        userTeamId = session.user.team;
      }
      
      // ตรวจสอบหาค่า teamId ของ employee จากหลายแหล่ง
      if (employee.team && typeof employee.team === 'object') {
        employeeTeamId = employee.team.id;
      } else if (typeof employee.team === 'string') {
        employeeTeamId = employee.team;
      } else if (employee.teamId) {
        employeeTeamId = employee.teamId;
      } else if (employee.userTeamId) {
        employeeTeamId = employee.userTeamId;
      } else if (employee.userTeam && typeof employee.userTeam === 'object') {
        employeeTeamId = employee.userTeam.id;
      } else if (typeof employee.userTeam === 'string') {
        employeeTeamId = employee.userTeam;
      }
      
      console.log('TEAM CHECK:', {
        userTeamId,
        employeeTeamId,
      });
      
      // ตรวจสอบว่าอยู่ในทีมเดียวกันหรือไม่
      const isSameTeam = userTeamId && employeeTeamId && userTeamId === employeeTeamId;
      
      if (isSameTeam) {
        console.log(`✅ SUPERVISOR ACCESS GRANTED (Same Team)`);
        return isValidDate;
      }
      
      // ถ้ามีปัญหากับการตรวจสอบ teamId ลองตรวจสอบจากแผนกแทน
      if (!userTeamId || !employeeTeamId) {
        const isSameDepartment = session.user.departmentId && 
                               employee.departmentId && 
                               session.user.departmentId === employee.departmentId;
                               
        if (isSameDepartment) {
          console.log(`✅ SUPERVISOR ACCESS GRANTED (Same Department - Fallback)`);
          return isValidDate;
        }
      }
      
      console.log(`❌ SUPERVISOR ACCESS DENIED - Not in same team`);
      return false;
    }
    
    // 4. กรณีอื่นๆ (พนักงานทั่วไป) - ไม่มีสิทธิ์แก้ไขข้อมูลคนอื่น
    console.log(`❌ ACCESS DENIED - Regular employee cannot edit others`);
    return false;
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // แยก fetchData ออกมาเป็น function ต่างหาก
  const fetchCalendarData = async () => {
    if (!session || isDataFetching) return;

    try {
      setIsDataFetching(true);

      // ยกเลิก request เก่าถ้ามี
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // สร้าง AbortController ใหม่
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      // คำนวณช่วงวันที่
      const startDate = getStartDate();
      const endDate = getEndDate();
      
      console.log('Fetching calendar data for range:', startDate.toISOString(), 'to', endDate.toISOString());
      
      // เรียก API ใหม่เพียงครั้งเดียว
      const response = await fetch(
        `/api/employee-calendar/all-data?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        { signal }
      );

      const data = await response.json();

      if (data.success) {
        console.log('API response success - Total employees:', data.data.employees?.length || 0);
        console.log('API response success - Total workStatuses:', data.data.workStatuses?.length || 0);
        console.log('API response success - Total leaves:', data.data.leaves?.length || 0);
        console.log('API response success - Total overtimes:', data.data.overtimes?.length || 0);
        
        // บันทึกข้อมูลแต่ละประเภทลงใน state
        setEmployees(data.data.employees || []);
        setWorkStatuses(data.data.workStatuses || []);
        setLeaves(data.data.leaves || []);
        setOvertimes(data.data.overtimes || []);

        // อัปเดตรายชื่อแผนก
        const uniqueDepartments = [...new Set(data.data.employees.map(emp => {
          return emp.department?.name || 'ไม่ระบุแผนก';
        }))];
        setDepartments(uniqueDepartments);
        
        // แสดงข้อมูลทั้งหมดจำแนกตาม teamId เพื่อความสะดวกในการตรวจสอบ
        const employeesByTeam = {};
        data.data.employees.forEach(emp => {
          // ระบุ teamId ที่จะใช้
          let teamIdentifier = 'no-team';
          if (emp.teamId) {
            teamIdentifier = emp.teamId;
          } else if (emp.team) {
            if (typeof emp.team === 'string') {
              teamIdentifier = emp.team;
            } else if (emp.team.id) {
              teamIdentifier = emp.team.id;
            } else if (emp.team.name) {
              teamIdentifier = emp.team.name;
            }
          }
          
          // สร้างกลุ่ม team ถ้ายังไม่มี
          if (!employeesByTeam[teamIdentifier]) {
            employeesByTeam[teamIdentifier] = [];
          }
          
          // เพิ่มข้อมูลพนักงานในกลุ่ม
          employeesByTeam[teamIdentifier].push({
            id: emp.id,
            name: `${emp.firstName || ''} ${emp.lastName || ''}`,
            teamId: emp.teamId,
            team: emp.team,
            departmentId: emp.departmentId
          });
        });
        
        console.log('Employees grouped by team:', employeesByTeam);
        
        // Log ข้อมูลตัวอย่างของแต่ละประเภท
        if (data.data.employees?.length > 0) {
          // แสดงข้อมูลพนักงานตัวอย่าง ที่มี teamId
          const employeesWithTeam = data.data.employees.filter(emp => emp.teamId || (emp.team && (typeof emp.team === 'string' || emp.team.id)));
          if (employeesWithTeam.length > 0) {
            console.log('Sample employee with team:', {
              id: employeesWithTeam[0].id,
              name: `${employeesWithTeam[0].firstName || ''} ${employeesWithTeam[0].lastName || ''}`,
              teamId: employeesWithTeam[0].teamId,
              team: employeesWithTeam[0].team,
              teamName: employeesWithTeam[0].teamName,
              userTeam: employeesWithTeam[0].userTeam,
              userTeamId: employeesWithTeam[0].userTeamId,
              departmentId: employeesWithTeam[0].departmentId,
              department: employeesWithTeam[0].department
            });
          } else {
            console.log('No employees with team data found!');
          }
          
          // แสดงข้อมูลของ session.user
          console.log('Current session user:', {
            id: session.user.id,
            name: `${session.user.firstName || ''} ${session.user.lastName || ''}`,
            role: session.user.role,
            teamId: session.user.teamId,
            userTeamId: session.user.userTeamId,
            userTeam: session.user.userTeam,
            team: session.user.team,
            teamName: session.user.teamName,
            departmentId: session.user.departmentId
          });
        }
        
        // ให้ปรับอัพเดตข้อมูล session user ด้วย
        if (session.user.id) {
          const currentUserData = data.data.employees.find(emp => emp.id === session.user.id);
          if (currentUserData) {
            console.log('Current user data from API:', {
              id: currentUserData.id,
              name: `${currentUserData.firstName || ''} ${currentUserData.lastName || ''}`,
              teamId: currentUserData.teamId,
              team: currentUserData.team,
              teamName: currentUserData.teamName,
              userTeam: currentUserData.userTeam,
              userTeamId: currentUserData.userTeamId,
              departmentId: currentUserData.departmentId,
              department: currentUserData.department
            });
          }
        }
      } else {
        console.error('API response failed:', data.message);
        setError('ไม่สามารถดึงข้อมูลปฏิทินพนักงานได้');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching calendar data:', error);
        setError('เกิดข้อผิดพลาดในการดึงข้อมูล');
      }
    } finally {
      setIsDataFetching(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchCalendarData();
    }
  }, [currentDate, session, selectedDepartment]);

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
    // ตรวจสอบการลาที่อนุมัติแล้วก่อน เพราะมีความสำคัญสูงสุด
    const leave = leaves.find(leave => {
      const startDate = new Date(leave.startDate);
      const endDate = new Date(leave.endDate);
      const targetDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      targetDate.setHours(12, 0, 0, 0);
      return leave.employeeId === employeeId && 
             startDate <= targetDate && 
             endDate >= targetDate;
    });

    // ถ้ามีการลาที่อนุมัติแล้ว ให้แสดงเฉพาะข้อมูลการลา
    if (leave) {
      return {
        type: 'leave',
        data: leave,
        leaveType: leave.leaveType,
        status: leave.status
      };
    }

    // ถ้าไม่มีการลา ตรวจสอบสถานะการทำงานและ OT
    const localDateStr = date.toISOString().split('T')[0];
    
    const employeeWorkStatus = workStatuses.find(workStatus => {
      const wsDate = new Date(workStatus.date);
      const wsDateStr = wsDate.toISOString().split('T')[0];
      return workStatus.employeeId === employeeId && wsDateStr === localDateStr;
    });
    
    const employeeOvertime = overtimes.find(overtime => {
      const otDate = new Date(overtime.date);
      const otDateStr = otDate.toISOString().split('T')[0];
      return overtime.employeeId === employeeId && otDateStr === localDateStr;
    });

    // ถ้ามีทั้ง work status และ OT
    if (employeeWorkStatus && employeeOvertime) {
      return {
        type: 'workStatus',
        status: employeeWorkStatus.status,
        data: employeeWorkStatus,
        relatedStatuses: [{
          type: 'overtime',
          status: employeeOvertime.status,
          hours: employeeOvertime.totalHours,
          data: employeeOvertime
        }]
      };
    }

    // ถ้ามีแค่ work status
    if (employeeWorkStatus) {
      return {
        type: 'workStatus',
        status: employeeWorkStatus.status,
        data: employeeWorkStatus,
        relatedStatuses: []
      };
    }

    // ถ้ามีแค่ OT
    if (employeeOvertime) {
      return {
        type: 'overtime',
        status: employeeOvertime.status,
        hours: employeeOvertime.totalHours,
        data: employeeOvertime,
        relatedStatuses: []
      };
    }

    return null;
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

  // ฟังก์ชันสำหรับการจัดการเมื่อบันทึกข้อมูลสถานะการทำงาน
  const handleWorkStatusSave = async (newWorkStatus) => {
    // กรณีมี flag forceRefresh หรือมีการอัพเดทหลายรายการ ให้ดึงข้อมูลใหม่ทั้งหมด
    if (newWorkStatus?.forceRefresh || newWorkStatus?.multipleUpdate) {
      const startDate = getStartDate();
      const endDate = getEndDate();
      
      try {
        console.log('Refreshing data after save - fetching from new API');
        
        // ใช้ API ใหม่ที่รวมทุกอย่าง
        const response = await fetch(
          `/api/employee-calendar/all-data?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
        );
        
        const data = await response.json();
        
        if (data.success) {
          console.log('API response success after save - Total leaves:', data.data.leaves?.length || 0);
          
          setEmployees(data.data.employees || []);
          setWorkStatuses(data.data.workStatuses || []);
          setLeaves(data.data.leaves || []);
          setOvertimes(data.data.overtimes || []);
          
          toast.success('อัพเดทข้อมูลสำเร็จ');
        } else {
          console.error('API response failed after save:', data.message);
          toast.error('เกิดข้อผิดพลาดในการรีเฟรชข้อมูล');
        }
      } catch (error) {
        console.error('Error refreshing data:', error);
        toast.error('เกิดข้อผิดพลาดในการรีเฟรชข้อมูล');
      }
      return;
    }

    // กรณีลบข้อมูล
    if (newWorkStatus === null && selectedWorkStatus) {
      setWorkStatuses(prev => prev.filter(ws => ws.id !== selectedWorkStatus.id));
      return;
    }

    // กรณีอัพเดทหรือเพิ่มข้อมูลเดียว
    setWorkStatuses(prev => {
      const existingIndex = prev.findIndex(ws => ws.id === newWorkStatus.id);
      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex] = newWorkStatus;
        return updated;
      }
      return [...prev, newWorkStatus];
    });
  };

  // กรองพนักงานตามแผนก
  const filteredEmployees = selectedDepartment === 'all'
    ? employees
    : employees.filter(emp => {
        const deptName = emp.department?.name || 'ไม่ระบุแผนก';
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
                                
                                // แสดงผลทีม
                                if (teamName || teamId) {
                                  return (
                                    <span className="flex items-center">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                      </svg>
                                      ทีม: {teamName || (teamId ? (teamId.length > 8 ? teamId.substring(0, 8) + '...' : teamId) : 'ไม่ระบุทีม')}
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
