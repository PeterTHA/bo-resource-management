'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FiEdit, FiTrash2, FiPlus, FiSearch, FiUser, FiUsers, FiKey } from 'react-icons/fi';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import ErrorMessage, { ConnectionErrorMessage } from '../../components/ui/ErrorMessage';
import { LoadingPage, LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { hasPermission } from '@/lib/permissions';

export default function EmployeesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connectionError, setConnectionError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [positions, setPositions] = useState([]);
  const [positionLevels, setPositionLevels] = useState([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        setError('');
        setConnectionError(false);
        
        // ทดสอบเรียก API test ก่อน
        console.log('Calling test API...');
        const testRes = await fetch('/api/employees/test');
        const testData = await testRes.json();
        console.log('Test API response:', testData);
        
        // ถ้า test ผ่านแล้วค่อยเรียก API หลัก
        const res = await fetch('/api/employees');
        
        if (!res.ok) {
          // ถ้าเกิด error ในการเชื่อมต่อกับ API
          if (res.status === 500) {
            setError('ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
            setConnectionError(true);
          } else {
            const errorData = await res.json();
            setError(errorData.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลพนักงาน');
          }
          setEmployees([]);
          return;
        }
        
        const data = await res.json();
        
        // ตรวจสอบว่ามีข้อผิดพลาดในการเชื่อมต่อกับฐานข้อมูลหรือไม่
        if (data.connectionError) {
          setConnectionError(true);
          setError(data.message || 'ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
        }
        
        // ตรวจสอบรูปแบบข้อมูลที่ได้รับ ซึ่งอาจเป็น array โดยตรงหรือ object ที่มี property data เป็น array
        setEmployees(Array.isArray(data) ? data : data.data || []);
      } catch (error) {
        console.error('Error fetching employees:', error);
        setError('ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
        setConnectionError(true);
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    };
    
    if (session) {
      fetchEmployees();
    }
  }, [session]);

  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const res = await fetch('/api/positions');
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setPositions(data.data || []);
          }
        }
      } catch (error) {
        console.error('Error fetching positions:', error);
      }
    };

    if (session) {
      fetchPositions();
    }
  }, [session]);

  useEffect(() => {
    const fetchPositionLevels = async () => {
      try {
        const res = await fetch('/api/position-levels');
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setPositionLevels(data.data || []);
          }
        }
      } catch (error) {
        console.error('Error fetching position levels:', error);
      }
    };

    if (session) {
      fetchPositionLevels();
    }
  }, [session]);

  // ฟังก์ชันสำหรับแสดงการแจ้งเตือนเมื่อไม่มีสิทธิ์
  const handleNoPermission = (action) => {
    alert(`คุณไม่มีสิทธิ์ในการ${action}`);
    return false;
  };

  // ฟังก์ชันสำหรับตรวจสอบว่าพนักงานนี้อยู่ในทีมเดียวกันหรือไม่
  const isInSameTeam = (employee) => {
    if (!session || !session.user) return false;
    
    // ถ้าเป็น admin มีสิทธิ์ทุกทีม
    if (session.user.role === 'admin') return true;
    
    // ตรวจสอบว่าทีมตรงกันหรือไม่
    const employeeTeamId = employee.teamId || 
                          (employee.teamData ? employee.teamData.id : null);
    
    // ดีบั๊กข้อมูลทีม
    console.log('User teamId:', session.user.teamId);
    console.log('Employee teamId:', employeeTeamId);
    console.log('Employee team data:', employee.teamData);
    
    return session.user.teamId && employeeTeamId && session.user.teamId === employeeTeamId;
  };

  // ฟังก์ชันรวมสำหรับตรวจสอบสิทธิ์และนำทางหรือแจ้งเตือน
  const checkPermissionAndNavigate = (permission, url, action, employee = null) => {
    if (!session) return;

    console.log(`Checking permission: ${permission} for action: ${action}`);
    console.log('User role:', session.user.role);
    
    // ตรวจสอบสิทธิ์ก่อน
    const hasPermissionResult = hasPermission(session.user, permission);
    console.log(`Has permission ${permission}: ${hasPermissionResult}`);
    
    // กรณีที่เป็นหัวหน้างาน ต้องตรวจสอบว่าเป็นพนักงานในทีมหรือไม่
    if (session.user.role === 'supervisor' && employee) {
      const isSelf = session.user.id === employee.id;
      const isSameTeamResult = isInSameTeam(employee);
      console.log(`Is self: ${isSelf}, Is same team: ${isSameTeamResult}`);
      
      if (!isSelf && !isSameTeamResult) {
        handleNoPermission(`${action} (พนักงานอยู่นอกทีมของคุณ)`);
        return;
      }
    }
    
    // ตรวจสอบสิทธิ์ตามบทบาท
    if (hasPermissionResult) {
      console.log(`Navigating to: ${url}`);
      router.push(url);
    } else {
      handleNoPermission(action);
    }
  };

  // ฟังก์ชันสำหรับนำทางไปยังหน้าเพิ่มพนักงาน (จำกัดตามทีม)
  const navigateToAddEmployee = () => {
    if (!session) return;
    
    console.log('Navigating to add employee');
    console.log('User role:', session.user.role);
    console.log('User teamId:', session.user.teamId);
    
    if (hasPermission(session.user, 'employees.create')) {
      console.log('User has permission to create employee');
      // หากเป็น supervisor แนบ query param เพื่อจำกัดให้สร้างได้เฉพาะในทีมตัวเอง
      try {
        if (session.user.role === 'supervisor' && session.user.teamId) {
          console.log(`Navigating to: /employees/add?teamId=${session.user.teamId}`);
          // ใช้ window.location แทน router.push เพื่อแก้ปัญหาการ redirect
          window.location.href = `/employees/add?teamId=${session.user.teamId}`;
        } else {
          console.log('Navigating to: /employees/add');
          window.location.href = '/employees/add';
        }
      } catch (error) {
        console.error('Navigation error:', error);
      }
    } else {
      handleNoPermission('เพิ่มพนักงาน');
    }
  };

  const handleDelete = async (id) => {
    if (!session) return;
    
    // หาข้อมูลพนักงานที่จะลบ
    const employeeToDelete = employees.find(emp => emp.id === id);
    if (!employeeToDelete) {
      console.error(`Employee with id ${id} not found`);
      return;
    }
    
    // ตรวจสอบสิทธิ์ในการลบพนักงาน
    if (!hasPermission(session.user, 'employees.delete')) {
      handleNoPermission('ลบข้อมูลพนักงาน');
      return;
    }
    
    // ถ้าเป็น supervisor ตรวจสอบว่าพนักงานอยู่ในทีมของตัวเองหรือไม่
    if (session.user.role === 'supervisor') {
      if (!isInSameTeam(employeeToDelete)) {
        handleNoPermission('ลบข้อมูลพนักงาน (พนักงานอยู่นอกทีมของคุณ)');
        return;
      }
    }
    
    if (!confirm('คุณต้องการลบข้อมูลพนักงานนี้ใช่หรือไม่?')) {
      return;
    }
    
    try {
      const res = await fetch(`/api/employees/${id}`, {
        method: 'DELETE',
      });
      
      const data = await res.json();
      
      if (!data.error) {
        setEmployees(employees.filter(employee => employee.id !== id));
        alert(data.message || 'ลบข้อมูลพนักงานเรียบร้อยแล้ว');
      } else {
        alert(data.message || 'เกิดข้อผิดพลาดในการลบข้อมูลพนักงาน');
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
      console.error(error);
    }
  };

  const handleEditEmployee = (employee) => {
    if (!session || !employee) {
      console.error('No session or employee data');
      return;
    }
    
    console.log('Edit employee:', employee);
    console.log('User role:', session.user.role);
    console.log('User ID:', session.user.id);
    console.log('Employee ID:', employee.id);
    
    // ตรวจสอบว่าเป็นการแก้ไขตัวเองหรือไม่
    const isSelf = session.user.id === employee.id;
    console.log('Is self:', isSelf);
    
    try {
      // ถ้าเป็นการแก้ไขตัวเอง ใช้สิทธิ์ edit.own
      if (isSelf) {
        console.log('User is editing their own profile');
        if (hasPermission(session.user, 'employees.edit.own')) {
          console.log(`Navigating to: /employees/${employee.id}/edit`);
          window.location.href = `/employees/${employee.id}/edit`;
        } else {
          handleNoPermission('แก้ไขข้อมูลของคุณ');
        }
        return;
      }
      
      // ถ้าเป็น supervisor ต้องอยู่ทีมเดียวกัน
      if (session.user.role === 'supervisor') {
        console.log('User is supervisor checking team permission');
        if (isInSameTeam(employee)) {
          if (hasPermission(session.user, 'employees.edit.team')) {
            console.log(`Navigating to: /employees/${employee.id}/edit`);
            window.location.href = `/employees/${employee.id}/edit`;
          } else {
            handleNoPermission('แก้ไขข้อมูลพนักงานในทีม');
          }
        } else {
          handleNoPermission('แก้ไขข้อมูลพนักงาน (พนักงานอยู่นอกทีมของคุณ)');
        }
        return;
      }
      
      // กรณีเป็น admin
      if (hasPermission(session.user, 'employees.edit.all')) {
        console.log(`Navigating to: /employees/${employee.id}/edit`);
        window.location.href = `/employees/${employee.id}/edit`;
      } else {
        handleNoPermission('แก้ไขข้อมูลพนักงาน');
      }
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const handleChangePassword = (employee) => {
    if (!session || !employee) return;
    
    console.log('Change password for employee:', employee);
    console.log('User role:', session.user.role);
    
    try {
      // ถ้าเป็น supervisor ต้องตรวจสอบว่าอยู่ในทีมเดียวกันหรือไม่
      if (session.user.role === 'supervisor') {
        if (!isInSameTeam(employee)) {
          handleNoPermission('จัดการรหัสผ่านพนักงาน (พนักงานอยู่นอกทีมของคุณ)');
          return;
        }
        
        // หัวหน้างานต้องมีสิทธิ์ employees.edit.team
        if (hasPermission(session.user, 'employees.edit.team')) {
          console.log(`Navigating to: /employees/${employee.id}/change-password`);
          window.location.href = `/employees/${employee.id}/change-password`;
        } else {
          handleNoPermission('จัดการรหัสผ่านพนักงาน');
        }
        return;
      }
      
      // กรณีเป็น admin ต้องมีสิทธิ์ employees.edit.all
      if (hasPermission(session.user, 'employees.edit.all')) {
        console.log(`Navigating to: /employees/${employee.id}/change-password`);
        window.location.href = `/employees/${employee.id}/change-password`;
      } else {
        handleNoPermission('จัดการรหัสผ่านพนักงาน');
      }
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const filteredEmployees = employees.filter(employee => {
    if (!employee) return false;
    
    const searchValue = searchTerm.toLowerCase();
    
    // ตรวจสอบว่า department เป็น object หรือ string
    const departmentName = employee.department && typeof employee.department === 'object' 
      ? employee.department.name 
      : employee.department;
    
    // ตรวจสอบว่า team เป็น object (teamData) หรือ string (team)
    const teamName = employee.teamData 
      ? employee.teamData.name 
      : employee.team;
      
    // แปลงบทบาทเป็นภาษาไทยเพื่อการค้นหา
    let roleInThai = '';
    if (employee.role === 'admin') roleInThai = 'ผู้ดูแลระบบ';
    else if (employee.role === 'supervisor') roleInThai = 'หัวหน้างาน';
    else if (employee.role === 'permanent') roleInThai = 'พนักงานประจำ';
    else if (employee.role === 'temporary') roleInThai = 'พนักงานชั่วคราว';
    else roleInThai = employee.role || '';
    
    return (
      employee.firstName?.toLowerCase().includes(searchValue) ||
      employee.lastName?.toLowerCase().includes(searchValue) ||
      employee.employeeId?.toLowerCase().includes(searchValue) ||
      employee.email?.toLowerCase().includes(searchValue) ||
      employee.position?.toLowerCase().includes(searchValue) ||
      employee.positionTitle?.toLowerCase().includes(searchValue) ||
      (departmentName && typeof departmentName === 'string' && departmentName.toLowerCase().includes(searchValue)) ||
      (teamName && typeof teamName === 'string' && teamName.toLowerCase().includes(searchValue)) ||
      roleInThai.toLowerCase().includes(searchValue)
    );
  });

  // ฟังก์ชันสำหรับแสดงรูปโปรไฟล์หรือตัวอักษรย่อ
  const getProfileDisplay = (employee) => {
    if (employee.image) {
      return (
        <div className="flex-shrink-0 h-10 w-10 relative rounded-full overflow-hidden border-2 border-purple-200 dark:border-purple-900">
          <Image
            src={employee.image}
            alt={`${employee.firstName} ${employee.lastName}`}
            fill
            sizes="40px"
            className="object-cover"
            priority
          />
        </div>
      );
    }
    
    return (
      <div className="flex-shrink-0 h-10 w-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center transition-colors duration-300 border-2 border-purple-200 dark:border-purple-900">
        <span className="text-purple-600 dark:text-purple-400 font-medium transition-colors duration-300">
          {employee.firstName?.charAt(0) || ''}{employee.lastName?.charAt(0) || ''}
        </span>
      </div>
    );
  };

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingPage message="กำลังโหลดข้อมูลพนักงาน..." />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const canCreateEmployee = hasPermission(session.user, 'employees.create');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center transition-colors duration-300">
          <FiUsers className="mr-2 text-purple-600 dark:text-purple-400" /> รายการพนักงาน
        </h1>
        {canCreateEmployee && (
          <button
            onClick={navigateToAddEmployee}
            className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg flex items-center transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <FiPlus className="mr-2" /> เพิ่มพนักงาน
          </button>
        )}
      </div>
      
      {connectionError ? (
        <ConnectionErrorMessage />
      ) : error && (
        <ErrorMessage message={error} type="error" />
      )}
      
      <div className="mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm transition-colors duration-300">
          <div className="relative">
            <input
              type="text"
              placeholder="ค้นหาพนักงาน..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FiSearch className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-10">
          <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full border-purple-300 border-t-purple-600 dark:border-purple-700 dark:border-t-purple-400" role="status">
            <span className="visually-hidden">กำลังโหลด...</span>
          </div>
          <p className="mt-2 text-gray-600 dark:text-gray-300 transition-colors duration-300">กำลังโหลดข้อมูล...</p>
        </div>
      ) : employees.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden transition-colors duration-300">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 transition-colors duration-300">
              <thead className="bg-gray-50 dark:bg-gray-700 transition-colors duration-300">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">รหัสพนักงาน</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">ชื่อ-นามสกุล</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">ตำแหน่ง</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">บทบาท</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">แผนก</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">ทีม</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">อีเมล</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">สถานะ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">จัดการ</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 transition-colors duration-300">
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-300">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 transition-colors duration-300">{employee.employeeId}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getProfileDisplay(employee)}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 transition-colors duration-300">
                            {`${employee.firstName || ''} ${employee.lastName || ''}`}
                          </div>
                          {employee.positionTitle && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300">
                              {employee.positionTitle}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
                      {employee.position && employee.positionLevel ? 
                        `${positions?.find(p => p.code === employee.position)?.name || employee.position} (${positionLevels?.find(l => l.code === employee.positionLevel)?.name || employee.positionLevel})` : 
                        employee.position ? 
                          `${positions?.find(p => p.code === employee.position)?.name || employee.position}` : 
                          employee.positionTitle ? employee.positionTitle : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${employee.role === 'admin' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 
                          employee.role === 'supervisor' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                          employee.role === 'permanent' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                          employee.role === 'temporary' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                        } transition-colors duration-300`}
                      >
                        {employee.role === 'admin' ? 'ผู้ดูแลระบบ' : 
                         employee.role === 'supervisor' ? 'หัวหน้างาน' : 
                         employee.role === 'permanent' ? 'พนักงานประจำ' : 
                         employee.role === 'temporary' ? 'พนักงานชั่วคราว' : employee.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
                      {employee.department && typeof employee.department === 'object' 
                        ? employee.department.name 
                        : (employee.department || <span className="text-gray-400 dark:text-gray-500">ไม่มีแผนก</span>)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
                      {employee.teamData && employee.teamData.name ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                          {employee.teamData.name}
                        </span>
                      ) : employee.team ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                          {employee.team}
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">ไม่มีทีม</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">{employee.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${employee.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'} transition-colors duration-300`}>
                        {employee.isActive ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleEditEmployee(employee)} 
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 p-1 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors duration-300" 
                          title="แก้ไข"
                        >
                          <FiEdit className="h-5 w-5" />
                        </button>
                        
                        {(hasPermission(session.user, 'employees.edit.all') || 
                          (hasPermission(session.user, 'employees.edit.team') && isInSameTeam(employee))) && (
                          <button
                            onClick={() => handleChangePassword(employee)}
                            className="text-orange-600 dark:text-orange-400 hover:text-orange-900 dark:hover:text-orange-300 p-1 rounded-full hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-colors duration-300"
                            title="จัดการรหัสผ่าน"
                          >
                            <FiKey className="h-5 w-5" />
                          </button>
                        )}
                        
                        {hasPermission(session.user, 'employees.delete') && 
                          (session.user.role !== 'supervisor' || isInSameTeam(employee)) && (
                          <button
                            onClick={() => handleDelete(employee.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors duration-300"
                            title="ลบ"
                          >
                            <FiTrash2 className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-10 text-center transition-colors duration-300">
          <div className="flex flex-col items-center justify-center">
            <FiUser className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-4" />
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100 transition-colors duration-300">ไม่พบข้อมูลพนักงาน</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 transition-colors duration-300">เพิ่มพนักงานใหม่เพื่อเริ่มต้นใช้งานระบบ</p>
            {canCreateEmployee && (
              <button
                onClick={navigateToAddEmployee}
                className="mt-4 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg flex items-center transition-all duration-200"
              >
                <FiPlus className="mr-2" /> เพิ่มพนักงาน
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 