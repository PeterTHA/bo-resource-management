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
      
      const res = await fetch('/api/employees');
      
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
      
      // แปลงชื่อตัวแปรจาก snake_case (หลังบ้าน) เป็น camelCase (หน้าบ้าน)
      const transformedEmployees = (Array.isArray(data) ? data : data.data || []).map(employee => ({
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
        isActive: employee.is_active,
        birthDate: employee.birth_date,
        gender: employee.gender,
        phoneNumber: employee.phone_number,
        image: employee.image
      }));
      
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
    setEmployees(prev => prev.map(emp => 
      emp.id === updatedEmployee.id ? updatedEmployee : emp
    ));
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