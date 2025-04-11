'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export function useEmployees() {
  const { data: session } = useSession();
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [connectionError, setConnectionError] = useState(false);
  
  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      setError('');
      setConnectionError(false);
      
      const res = await fetch('/api/employees?includeInactive=true');
      
      if (!res.ok) {
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
      
      if (data.connectionError) {
        setConnectionError(true);
        setError(data.message || 'ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
      }
      
      console.log("API Response - Received employees data:", data.data ? data.data.length : 0, "items");
      
      // Debug the first employee to check the is_active value
      if (data.data && data.data.length > 0) {
        console.log("First employee is_active:", data.data[0].is_active);
        console.log("First employee is_active type:", typeof data.data[0].is_active);
      }
      
      // แปลงชื่อตัวแปรจาก snake_case (หลังบ้าน) เป็น camelCase (หน้าบ้าน)
      const transformedEmployees = (Array.isArray(data) ? data : data.data || []).map(employee => {
        // ทำให้แน่ใจว่า isActive เป็น boolean ที่ชัดเจน
        const isActive = (typeof employee.is_active === 'string')
          ? employee.is_active.toLowerCase() === 'true'
          : employee.is_active === true;

        console.log(`Employee ${employee.employee_id} - is_active from API: ${employee.is_active} (${typeof employee.is_active}), converted to: ${isActive} (${typeof isActive})`);
        
        return {
          id: employee.id,
          employeeId: employee.employee_id,
          firstName: employee.first_name,
          lastName: employee.last_name,
          email: employee.email,
          position: employee.position,
          positionLevel: employee.position_level,
          positionTitle: employee.position_title,
          departmentId: employee.department_id,
          teamId: employee.team_id,
          department: employee.departments,
          teamData: employee.teams,
          roleId: employee.role_id,
          role: employee.role, // จาก employee.roles?.code ที่แปลงมาจาก API แล้ว
          roleName: employee.roleName || '', // จาก employee.roles?.name ที่แปลงมาจาก API แล้ว
          roleNameTh: employee.roleNameTh || '', // จาก employee.roles?.name_th ที่แปลงมาจาก API แล้ว
          isActive: isActive, // ใช้ค่า boolean ที่แปลงแล้ว
          birthDate: employee.birth_date,
          gender: employee.gender,
          phoneNumber: employee.phone_number,
          image: employee.image
        };
      });
      
      console.log("Transformed employees with corrected isActive values:", transformedEmployees.length, "items");
      
      setEmployees(transformedEmployees);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setError('ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
      setConnectionError(true);
      setEmployees([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (session) {
      fetchEmployees();
    }
  }, [session]);
  
  // ฟังก์ชันสำหรับกรองพนักงานตามสิทธิ์
  const filterEmployeesByPermission = (employeeList, isAdmin, isTeamLead, currentUserId, teamId) => {
    if (isAdmin) {
      return employeeList; // admin เห็นทั้งหมด
    } else if (isTeamLead) {
      return employeeList.filter(emp => emp.teamId === teamId || emp.id === currentUserId);
    } else {
      return employeeList.filter(emp => emp.id === currentUserId);
    }
  };
  
  // ฟังก์ชันเพิ่มพนักงาน
  const addEmployee = (newEmployee) => {
    setEmployees(prev => [...prev, newEmployee]);
  };
  
  // ฟังก์ชันอัปเดตพนักงาน
  const updateEmployee = (updatedEmployee) => {
    console.log("useEmployees - ก่อนอัพเดต:", employees.find(e => e.id === updatedEmployee.id));
    console.log("useEmployees - ข้อมูลที่จะอัพเดต:", updatedEmployee);
    console.log("useEmployees - isActive ที่จะอัพเดต:", updatedEmployee.isActive);
    
    setEmployees(prev => prev.map(emp => {
      if (emp.id === updatedEmployee.id) {
        // ทำให้มั่นใจว่าค่า isActive เป็น boolean ที่ชัดเจน
        const isActiveValue = updatedEmployee.isActive === true ? true : false;
        
        // สร้าง object ใหม่และกำหนดค่า isActive ที่ชัดเจน
        const updatedEmp = {
          ...emp,
          ...updatedEmployee,
          isActive: isActiveValue
        };
        
        console.log("useEmployees - หลังอัพเดต:", updatedEmp);
        return updatedEmp;
      }
      return emp;
    }));
  };
  
  // ฟังก์ชันลบพนักงาน
  const deleteEmployee = (employeeId) => {
    setEmployees(prev => prev.filter(emp => emp.id !== employeeId));
  };
  
  return {
    employees,
    isLoading,
    error,
    connectionError,
    fetchEmployees,
    filterEmployeesByPermission,
    addEmployee,
    updateEmployee,
    deleteEmployee,
  };
} 