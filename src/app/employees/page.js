'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FiEdit, FiTrash2, FiPlus, FiSearch, FiUser, FiUsers, FiKey, FiEye, FiX, FiCheck, FiSliders, FiUpload } from 'react-icons/fi';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import ErrorMessage, { ConnectionErrorMessage } from '@/components/ui/ErrorMessage';
import { LoadingPage, LoadingButton, LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { hasPermission } from '@/lib/permissions';
import ProfileImage from '@/components/ui/ProfileImage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

export default function EmployeesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  
  // สถานะสำหรับข้อมูลพนักงาน
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [connectionError, setConnectionError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // สถานะสำหรับข้อมูลตำแหน่ง, ระดับตำแหน่ง, แผนก และทีม
  const [positions, setPositions] = useState([]);
  const [positionLevels, setPositionLevels] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [roles, setRoles] = useState([]);
  
  // สถานะสำหรับฟอร์ม
  const [formData, setFormData] = useState({
    employeeId: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phoneNumber: '',
    role: '',
    roleId: '',
    position: '',
    positionLevel: '',
    positionTitle: '',
    departmentId: '',
    teamId: '',
    gender: '',
    birthDate: '',
    isActive: true,
    image: ''
  });
  
  // สถานะสำหรับการเปลี่ยนรหัสผ่าน
  const [passwordFormData, setPasswordFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  
  // สถานะสำหรับการแสดง dialog
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  
  // สถานะสำหรับพนักงานที่ถูกเลือก
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  
  // สถานะสำหรับการแสดงผลการทำงาน
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
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
        
        console.log('Transformed employees data:', transformedEmployees);
        
        // เช็คว่าผู้ใช้เป็น admin หรือไม่ โดยเรียกใช้ฟังก์ชัน isUserAdmin
        const adminAccess = isUserAdmin();
        // เช็คว่าผู้ใช้เป็นหัวหน้าทีมหรือไม่
        const supervisorAccess = hasRolePermission('employees.view.teams');
        
        let filteredEmployees = transformedEmployees;
        
        // ถ้าเป็นหัวหน้าทีมและไม่ใช่ admin ให้เห็นเฉพาะพนักงานในทีมตัวเอง
        if (supervisorAccess && !adminAccess) {
          filteredEmployees = transformedEmployees.filter(
            emp => emp.teamId === session.user.teamId || emp.id === session.user.id
          );
        }
        // ถ้าไม่มีสิทธิ์ดูทั้งหมดและไม่ใช่หัวหน้าทีม ให้ดูได้แค่ตัวเอง
        else if (!adminAccess && !supervisorAccess) {
          filteredEmployees = transformedEmployees.filter(
            emp => emp.id === session.user.id
          );
        }
        
        setEmployees(filteredEmployees);
      } catch (error) {
        console.error('Error fetching employees:', error);
        setError('ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
        setConnectionError(true);
        setEmployees([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (session) {
      fetchEmployees();
    }
  }, [session]);

  useEffect(() => {
    const fetchPositions = async () => {
      try {
        console.log('Fetching positions...');
        const res = await fetch('/api/positions');
        if (res.ok) {
          const data = await res.json();
          console.log('Positions data received:', data);
          if (data.success) {
            setPositions(data.data || []);
            console.log('Positions set:', data.data);
          } else {
            console.error('Error in positions response:', data);
            setPositions([]);
          }
        } else {
          console.error('Error fetching positions, status:', res.status);
          setPositions([]);
        }
      } catch (error) {
        console.error('Error fetching positions:', error);
        setPositions([]);
      }
    };

    if (session) {
      fetchPositions();
    }
  }, [session]);

  useEffect(() => {
    const fetchPositionLevels = async () => {
      try {
        console.log('Fetching position levels...');
        const res = await fetch('/api/position-levels');
        if (res.ok) {
          const data = await res.json();
          console.log('Position levels data received:', data);
          if (data.success) {
            setPositionLevels(data.data || []);
            console.log('Position levels set:', data.data);
          } else {
            console.error('Error in position levels response:', data);
            setPositionLevels([]);
          }
        } else {
          console.error('Error fetching position levels, status:', res.status);
          setPositionLevels([]);
        }
      } catch (error) {
        console.error('Error fetching position levels:', error);
        setPositionLevels([]);
      }
    };

    if (session) {
      fetchPositionLevels();
    }
  }, [session]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        console.log('Fetching departments...');
        const res = await fetch('/api/departments');
        if (res.ok) {
          const data = await res.json();
          console.log('Departments data received:', data);
          // แก้ไขโดยตรวจสอบโครงสร้างข้อมูลและตรวจให้แน่ใจว่า departments เป็น array
          const departmentsArray = data?.data && Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
          setDepartments(departmentsArray);
          console.log('Departments set:', departmentsArray);
        } else {
          console.error('Error fetching departments, status:', res.status);
          setDepartments([]);
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
        setDepartments([]);
      }
    };

    if (session) {
      fetchDepartments();
    }
  }, [session]);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        console.log('Fetching teams...');
        const res = await fetch('/api/teams');
        if (res.ok) {
          const data = await res.json();
          console.log('Teams data received:', data);
          // แก้ไขโดยตรวจสอบโครงสร้างข้อมูลและตรวจให้แน่ใจว่า teams เป็น array
          const teamsArray = data?.data && Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
          setTeams(teamsArray);
          console.log('Teams set:', teamsArray);
        } else {
          console.error('Error fetching teams, status:', res.status);
          setTeams([]);
        }
      } catch (error) {
        console.error('Error fetching teams:', error);
        setTeams([]);
      }
    };

    if (session) {
      fetchTeams();
    }
  }, [session]);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        console.log('Fetching roles...');
        const res = await fetch('/api/roles');
        if (res.ok) {
          const data = await res.json();
          console.log('Roles data received:', data);
          // แก้ไขโดยตรวจสอบโครงสร้างข้อมูลและตรวจให้แน่ใจว่า roles เป็น array
          const rolesArray = data?.data && Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
          setRoles(rolesArray);
          console.log('Roles set:', rolesArray);
        } else {
          console.error('Error fetching roles, status:', res.status);
          setRoles([]);
        }
      } catch (error) {
        console.error('Error fetching roles:', error);
        setRoles([]);
      }
    };

    if (session) {
      fetchRoles();
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

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    
    try {
      setFormLoading(true);
      setFormError('');
      
      // ตรวจสอบรหัสผ่าน
      if (!passwordFormData.password) {
        setFormError('กรุณากรอกรหัสผ่าน');
        return;
      }
      
      if (passwordFormData.password !== passwordFormData.confirmPassword) {
        setFormError('รหัสผ่านไม่ตรงกัน');
        return;
      }
      
      const res = await fetch(`/api/employees/${selectedEmployee.id}/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPassword: passwordFormData.password }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setFormError(data.message || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
        return;
      }
      
      // ปิด Dialog
      setPasswordDialogOpen(false);
      
      toast({
        title: "เปลี่ยนรหัสผ่านสำเร็จ",
        description: `เปลี่ยนรหัสผ่านของ ${selectedEmployee.firstName} ${selectedEmployee.lastName} เรียบร้อยแล้ว`,
      });
      
    } catch (error) {
      console.error('Error changing password:', error);
      setFormError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
    } finally {
      setFormLoading(false);
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
    return (
      <ProfileImage 
        src={employee.image}
        alt={`${employee.firstName} ${employee.lastName}`}
        size="sm"
        fallbackText={`${employee.firstName} ${employee.lastName}`}
        withBorder={true}
        className="transition-transform duration-300"
      />
    );
  };

  // ฟังก์ชันเปิด Dialog สำหรับดูรายละเอียดพนักงาน
  const openViewDialog = (employee) => {
    console.log('Opening view dialog for employee:', employee);
    
    // เตรียมข้อมูลพนักงานให้พร้อมแสดง
    const employeeData = {
      ...employee,
      departmentName: departments.find(dept => dept.id === employee.departmentId)?.name || 
                      (employee.department ? (typeof employee.department === 'object' ? employee.department.name : employee.department) : '-'),
      teamName: teams.find(team => team.id === employee.teamId)?.name || 
                (employee.teamData ? (typeof employee.teamData === 'object' ? employee.teamData.name : employee.teamData) : '-'),
      positionName: positions?.find(p => p.code === employee.position)?.name || employee.position || '-',
      positionLevelName: positionLevels?.find(l => l.code === employee.positionLevel)?.name || employee.positionLevel || '-',
      roleName: roles.find(r => r.id === employee.roleId)?.name_th || 
                roles.find(r => r.id === employee.roleId)?.name || '-'
    };
    
    console.log('Prepared employee data for view:', employeeData);
    setSelectedEmployee(employeeData);
    setViewDialogOpen(true);
  };
  
  // ฟังก์ชันเปิด Dialog สำหรับแก้ไขข้อมูลพนักงาน
  const openEditDialog = (employee) => {
    if (!session) return;
    
    console.log('Opening edit dialog for employee:', employee);
    console.log('Current user roleId:', session.user.role_id);
    console.log('Current user ID:', session.user.id);
    console.log('Employee ID to edit:', employee.id);
    
    // ตรวจสอบสิทธิ์ในการแก้ไขข้อมูล
    const canEdit = 
      isUserAdmin() || // Admin แก้ไขได้ทั้งหมด
      (isTeamLead() && session.user.team_id === employee.teamId) || // แก้ไขในทีมตัวเอง
      (session.user.id === employee.id); // แก้ไขข้อมูลตัวเอง
    
    if (!canEdit) {
      console.log('User does not have permission to edit this employee.');
      toast({
        variant: "destructive",
        title: "ไม่มีสิทธิ์",
        description: "คุณไม่มีสิทธิ์ในการแก้ไขข้อมูลพนักงานนี้",
      });
      return;
    }
    
    // กำหนดข้อมูลพนักงานที่เลือกไว้สำหรับการแก้ไข
    setSelectedEmployee(employee);
    
    // กำหนดข้อมูลในฟอร์ม
    const formDataToSet = {
      employeeId: employee.employeeId || '',
      firstName: employee.firstName || '',
      lastName: employee.lastName || '',
      email: employee.email || '',
      position: employee.position || '',
      positionLevel: employee.positionLevel || '',
      positionTitle: employee.positionTitle || '',
      departmentId: employee.departmentId || '',
      teamId: employee.teamId || '',
      roleId: employee.roleId || '',
      role: employee.role || '',
      roleName: employee.roleName || employee.roleNameTh || '',
      isActive: employee.isActive !== undefined ? employee.isActive : true,
      birthDate: employee.birthDate ? (typeof employee.birthDate === 'string' ? employee.birthDate.split('T')[0] : format(new Date(employee.birthDate), 'yyyy-MM-dd')) : '',
      gender: employee.gender || '',
      phoneNumber: employee.phoneNumber || '',
      image: employee.image || ''
    };
    
    console.log('Setting form data:', formDataToSet);
    
    setFormData(formDataToSet);
    setFormError('');
    setImagePreview(employee.image || null);
    setEditDialogOpen(true);
  };
  
  // ฟังก์ชันเปิด Dialog สำหรับเปลี่ยนรหัสผ่าน
  const openPasswordDialog = (employee) => {
    if (!session) return;
    
    // ตรวจสอบว่ามีสิทธิ์ในการจัดการรหัสผ่าน
    const canManagePassword = isUserAdmin() ||
      (isTeamLead() && session.user.team_id === employee.team_id) || // แก้ไขในทีมตัวเอง
      (session.user.id === employee.id); // แก้ไขข้อมูลตัวเอง
    
    if (!canManagePassword) {
      toast({
        variant: "destructive",
        title: "ไม่มีสิทธิ์",
        description: "คุณไม่มีสิทธิ์ในการจัดการรหัสผ่านพนักงานนี้",
      });
      return;
    }
    
    setPasswordFormData({
      password: '',
      confirmPassword: ''
    });
    
    setSelectedEmployee(employee);
    setPasswordDialogOpen(true);
  };
  
  // ฟังก์ชันเปิด Dialog สำหรับยืนยันการลบพนักงาน
  const openDeleteDialog = (employee) => {
    if (!session) return;
    
    // ตรวจสอบว่ามีสิทธิ์ลบข้อมูล
    const canDelete = isUserAdmin();
    
    if (!canDelete) {
      toast({
        variant: "destructive",
        title: "ไม่มีสิทธิ์",
        description: "คุณไม่มีสิทธิ์ในการลบข้อมูลพนักงาน",
      });
      return;
    }
    
    setSelectedEmployee(employee);
    setDeleteDialogOpen(true);
  };
  
  // ฟังก์ชันเปิด Dialog สำหรับเพิ่มพนักงานใหม่
  const openAddDialog = () => {
    if (!session) return;
    
    // ตรวจสอบว่ามีสิทธิ์เพิ่มพนักงาน
    if (!isUserAdmin() && !isTeamLead()) {
      toast({
        variant: "destructive",
        title: "ไม่มีสิทธิ์",
        description: "คุณไม่มีสิทธิ์ในการเพิ่มพนักงาน",
      });
      return;
    }
    
    // รีเซ็ตฟอร์ม
    setFormData({
      employeeId: '',
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      position: '',
      positionLevel: '',
      positionTitle: '',
      departmentId: '',
      teamId: isTeamLead() ? session.user.team_id : '',
      roleId: '',
      role: '',
      roleName: '',
      isActive: true,
      birthDate: '',
      gender: '',
      phoneNumber: '',
      image: ''
    });
    
    // รีเซ็ตข้อมูลรูปภาพ
    setImagePreview(null);
    setFormError('');
    
    setAddDialogOpen(true);
  };

  // ฟังก์ชันจัดการการเปลี่ยนแปลงในฟอร์ม
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // ฟังก์ชันจัดการการเปลี่ยนแปลงในฟอร์มเปลี่ยนรหัสผ่าน
  const handlePasswordFormChange = (e) => {
    const { name, value } = e.target;
    
    setPasswordFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // ฟังก์ชันบันทึกข้อมูลพนักงานที่แก้ไข
  const handleUpdateEmployee = async (e) => {
    e.preventDefault();
    
    try {
      setFormLoading(true);
      setFormError('');
      
      // ตรวจสอบข้อมูลที่จำเป็น
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.employeeId) {
        setFormError('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
        return;
      }
      
      // อัปโหลดรูปภาพ (ถ้ามี)
      let imageUrl = formData.image;
      if (imagePreview) {
        imageUrl = await uploadImage();
      }
      
      // ดึงข้อมูลบทบาทจาก roleId
      const selectedRole = roles.find(r => r.id === formData.roleId);
      
      // แปลง camelCase เป็น snake_case เพื่อให้ตรงกับ API
      const transformedData = {
        employee_id: formData.employeeId,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        position: formData.position,
        position_level: formData.positionLevel,
        position_title: formData.positionTitle,
        department_id: formData.departmentId,
        team_id: formData.teamId,
        role_id: formData.roleId,
        is_active: formData.isActive,
        birth_date: formData.birthDate,
        gender: formData.gender,
        phone_number: formData.phoneNumber,
        image: imageUrl
      };
      
      const res = await fetch(`/api/employees/${selectedEmployee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transformedData),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setFormError(data.message || 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลพนักงาน');
        return;
      }
      
      // แปลง snake_case กลับเป็น camelCase
      const updatedEmployee = data.data || data;
      const transformedEmployee = {
        id: updatedEmployee.id || selectedEmployee.id,
        employeeId: updatedEmployee.employee_id || formData.employeeId,
        firstName: updatedEmployee.first_name || formData.firstName,
        lastName: updatedEmployee.last_name || formData.lastName,
        email: updatedEmployee.email || formData.email,
        position: updatedEmployee.position || formData.position,
        positionLevel: updatedEmployee.position_level || formData.positionLevel,
        positionTitle: updatedEmployee.position_title || formData.positionTitle,
        departmentId: updatedEmployee.department_id || formData.departmentId,
        teamId: updatedEmployee.team_id || formData.teamId,
        department: updatedEmployee.departments || selectedEmployee.department,
        teamData: updatedEmployee.teams || selectedEmployee.teamData,
        roleId: formData.roleId,
        role: selectedRole?.code || updatedEmployee.role || selectedEmployee.role,
        roleName: selectedRole?.name || updatedEmployee.role_name || selectedEmployee.roleName || '',
        roleNameTh: selectedRole?.name_th || updatedEmployee.role_name_th || selectedEmployee.roleNameTh || '',
        isActive: updatedEmployee.is_active !== undefined ? updatedEmployee.is_active : formData.isActive,
        birthDate: updatedEmployee.birth_date || formData.birthDate,
        gender: updatedEmployee.gender || formData.gender,
        phoneNumber: updatedEmployee.phone_number || formData.phoneNumber,
        image: updatedEmployee.image || imageUrl
      };
      
      // อัปเดตข้อมูลในรายการ
      setEmployees(prev => prev.map(emp => emp.id === selectedEmployee.id ? transformedEmployee : emp));
      
      // ปิด Dialog
      setEditDialogOpen(false);
      
      toast({
        title: "อัปเดตข้อมูลสำเร็จ",
        description: `อัปเดตข้อมูลของ ${transformedEmployee.firstName} ${transformedEmployee.lastName} เรียบร้อยแล้ว`,
      });
      
    } catch (error) {
      console.error('Error updating employee:', error);
      setFormError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
    } finally {
      setFormLoading(false);
      setUploadingImage(false);
    }
  };
  
  // ฟังก์ชันบันทึกข้อมูลพนักงานใหม่
  const handleAddEmployee = async (e) => {
    e.preventDefault();
    
    try {
      setFormLoading(true);
      setFormError('');
      
      // ตรวจสอบข้อมูลที่จำเป็น
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.employeeId) {
        setFormError('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
        return;
      }
      
      // อัปโหลดรูปภาพ (ถ้ามี)
      let imageUrl = formData.image;
      if (imagePreview) {
        imageUrl = await uploadImage();
      }
      
      // สร้างรหัสผ่านแบบสุ่ม
      const randomPassword = generateRandomPassword(10);
      
      // ดึงข้อมูลบทบาทจาก roleId
      const selectedRole = roles.find(r => r.id === formData.roleId);
      
      // แปลง camelCase เป็น snake_case เพื่อให้ตรงกับ API
      const transformedData = {
        employee_id: formData.employeeId,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        password: randomPassword,
        position: formData.position,
        position_level: formData.positionLevel,
        position_title: formData.positionTitle,
        department_id: formData.departmentId,
        team_id: formData.teamId,
        role_id: formData.roleId,
        is_active: formData.isActive,
        birth_date: formData.birthDate,
        gender: formData.gender,
        phone_number: formData.phoneNumber,
        image: imageUrl
      };
      
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transformedData),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setFormError(data.message || 'เกิดข้อผิดพลาดในการเพิ่มพนักงาน');
        return;
      }
      
      // แปลง snake_case กลับเป็น camelCase
      const transformedEmployee = {
        id: data.data?.id,
        employeeId: data.data?.employee_id || formData.employeeId,
        firstName: data.data?.first_name || formData.firstName,
        lastName: data.data?.last_name || formData.lastName,
        email: data.data?.email || formData.email,
        position: data.data?.position || formData.position,
        positionLevel: data.data?.position_level || formData.positionLevel,
        positionTitle: data.data?.position_title || formData.positionTitle,
        departmentId: data.data?.department_id || formData.departmentId,
        teamId: data.data?.team_id || formData.teamId,
        department: data.data?.departments,
        teamData: data.data?.teams,
        roleId: formData.roleId,
        role: selectedRole?.code || data.data?.role,
        roleName: selectedRole?.name || data.data?.role_name || '',
        roleNameTh: selectedRole?.name_th || data.data?.role_name_th || '',
        isActive: data.data?.is_active !== undefined ? data.data.is_active : formData.isActive,
        birthDate: data.data?.birth_date || formData.birthDate,
        gender: data.data?.gender || formData.gender,
        phoneNumber: data.data?.phone_number || formData.phoneNumber,
        image: data.data?.image || imageUrl
      };
      
      // เพิ่มข้อมูลในรายการ
      setEmployees(prev => [...prev, transformedEmployee]);
      
      // ปิด Dialog
      setAddDialogOpen(false);
      
      toast({
        title: "เพิ่มพนักงานสำเร็จ",
        description: `เพิ่มข้อมูลของ ${transformedEmployee.firstName} ${transformedEmployee.lastName} เรียบร้อยแล้ว`,
      });
      
    } catch (error) {
      console.error('Error adding employee:', error);
      setFormError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
    } finally {
      setFormLoading(false);
      setUploadingImage(false);
    }
  };
  
  // ฟังก์ชันสำหรับอัปโหลดไฟล์รูปภาพ
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    
    if (!file) {
      return;
    }
    
    // ตรวจสอบประเภทของไฟล์
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setFormError('กรุณาอัปโหลดไฟล์รูปภาพ (JPG, PNG, GIF, WEBP) เท่านั้น');
      return;
    }
    
    // ตรวจสอบขนาดของไฟล์ (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setFormError('ขนาดไฟล์ต้องไม่เกิน 10MB');
      return;
    }
    
    setImagePreview(URL.createObjectURL(file));
    setFormError('');
  };
  
  // ฟังก์ชันสำหรับลบรูปภาพที่เลือก
  const handleRemoveImage = () => {
    setImagePreview(null);
    setFormData(prev => ({
      ...prev,
      image: ''
    }));
  };
  
  // ฟังก์ชันสำหรับอัปโหลดรูปภาพไปยัง API
  const uploadImage = async () => {
    // ถ้าไม่มีรูปภาพ ให้ใช้รูปเดิม
    if (!imagePreview) return formData.image;
    
    try {
      setUploadingImage(true);
      
      // ถ้าเป็น URL ที่มาจาก API (ไม่ใช่ blob) ให้ส่งคืนค่านั้นได้เลย
      if (imagePreview.startsWith('http') && !imagePreview.startsWith('blob:')) {
        return imagePreview;
      }
      
      // สร้าง FormData สำหรับอัปโหลดไฟล์
      const formDataUpload = new FormData();
      
      // ดึงข้อมูลจาก blob URL และแปลงเป็นไฟล์
      const response = await fetch(imagePreview);
      const blobData = await response.blob();
      
      // สร้างไฟล์ใหม่ที่มีการระบุประเภทไฟล์ที่ชัดเจน
      const fileName = "profile-image.jpg";
      const file = new File([blobData], fileName, { type: "image/jpeg" });
      
      // เพิ่มไฟล์ลงใน FormData
      formDataUpload.append('file', file);
      formDataUpload.append('type', 'profile');
      
      // ส่งข้อมูลไปยัง API
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
      }
      
      return data.url;
    } catch (error) {
      console.error('Error uploading image:', error);
      // คืนค่ารูปเดิมในกรณีที่มีข้อผิดพลาด
      setFormError('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
      return formData.image;
    } finally {
      setUploadingImage(false);
    }
  };
  
  // ฟังก์ชันสำหรับดูรูปภาพขนาดใหญ่
  const handleImagePreview = (imageUrl) => {
    setSelectedImage(imageUrl);
    setImageViewerOpen(true);
  };
  
  // ฟังก์ชันตรวจสอบว่าสามารถเรียกใช้ permission ได้หรือไม่
  const hasRolePermission = (permission) => {
    if (!session || !session.user) return false;
    
    return hasPermission(session.user, permission);
  };
  
  // ฟังก์ชันตรวจสอบว่าเป็น admin หรือไม่
  const isUserAdmin = () => {
    if (!session || !session.user) return false;
    
    // ตรวจสอบจาก roles และ role โดยตรง
    return (
      session.user.roles?.code?.toUpperCase() === 'ADMIN' || 
      session.user.role?.toUpperCase() === 'ADMIN'
    );
  };
  
  // ฟังก์ชันตรวจสอบว่าเป็นหัวหน้าทีมหรือไม่
  const isTeamLead = () => {
    if (!session || !session.user) return false;
    
    // ตรวจสอบจาก roles และ role โดยตรง
    return (
      session.user.roles?.code?.toUpperCase() === 'SUPERVISOR' || 
      session.user.role?.toUpperCase() === 'SUPERVISOR'
    );
  };
  
  if (status === 'loading' || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingPage message="กำลังโหลดข้อมูลพนักงาน..." />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const canCreateEmployee = hasPermission(session.user, 'employees.create');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center transition-colors duration-300">
          <FiUsers className="mr-2 text-foreground" /> รายการพนักงาน
        </h1>
        {canCreateEmployee && (
          <Button
            key="header-add-button"
            onClick={openAddDialog}
            className="bg-foreground hover:bg-foreground/90 text-background"
          >
            <FiPlus className="mr-2" /> เพิ่มพนักงาน
          </Button>
        )}
      </div>
      
      {connectionError ? (
        <ConnectionErrorMessage />
      ) : error && (
        <ErrorMessage message={error} type="error" />
      )}
      
      <div className="mb-6">
        <div className="bg-background p-4 rounded-lg shadow-sm transition-colors duration-300 border">
          <div className="relative">
            <Input
              type="text"
              placeholder="ค้นหาพนักงาน..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FiSearch className="absolute left-3 top-3 text-muted-foreground" />
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <div className="text-center py-10">
          <LoadingSpinner size="lg" />
          <p className="mt-2 text-muted-foreground transition-colors duration-300">กำลังโหลดข้อมูล...</p>
        </div>
      ) : employees.length > 0 ? (
        <div className="bg-background rounded-xl shadow-md overflow-hidden transition-colors duration-300 border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">รหัสพนักงาน</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ชื่อ-นามสกุล</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ตำแหน่ง</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">บทบาท</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">แผนก</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ทีม</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">อีเมล</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">สถานะ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-muted/50 transition-colors duration-300">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{employee.employeeId}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getProfileDisplay(employee)}
                        <div className="ml-4">
                          <div className="text-sm font-medium">
                            {`${employee.firstName || ''} ${employee.lastName || ''}`}
                          </div>
                          {employee.positionTitle && (
                            <div className="text-xs text-muted-foreground">
                              {employee.positionTitle}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {employee.position && employee.positionLevel ? 
                        `${positions?.find(p => p.code === employee.position)?.name || employee.position} (${positionLevels?.find(l => l.code === employee.positionLevel)?.name || employee.positionLevel})` : 
                        employee.position ? 
                          `${positions?.find(p => p.code === employee.position)?.name || employee.position}` : 
                          employee.positionTitle ? employee.positionTitle : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge 
                        key={`role-badge-${employee.id}`}
                        className={
                          employee.role === 'admin' ? 'bg-red-100 text-red-800 hover:bg-red-200' : 
                          employee.role === 'supervisor' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' :
                          employee.role === 'permanent' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
                          employee.role === 'temporary' ? 'bg-orange-100 text-orange-800 hover:bg-orange-200' :
                          'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }
                      >
                        {employee.roleNameTh || employee.roleName || 
                         (employee.role === 'admin' ? 'ผู้ดูแลระบบ' : 
                          employee.role === 'supervisor' ? 'หัวหน้างาน' : 
                          employee.role === 'permanent' ? 'พนักงานประจำ' : 
                          employee.role === 'temporary' ? 'พนักงานชั่วคราว' : 
                          employee.role || '')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {departments.find(dept => dept.id === employee.departmentId)?.name ||
                       (employee.department && typeof employee.department === 'object' 
                         ? employee.department.name 
                         : (employee.department || <span key="no-department" className="text-muted-foreground">ไม่มีแผนก</span>))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {employee && employee.teamData ? (
                        <Badge key="team-data-badge" variant="outline" className="bg-blue-50 text-blue-800">
                          {employee.teamData.name}
                        </Badge>
                      ) : employee && employee.team ? (
                        <Badge key="team-badge" variant="outline" className="bg-blue-50 text-blue-800">
                          {employee.team}
                        </Badge>
                      ) : (
                        <span key="no-team" className="text-muted-foreground">ไม่มีทีม</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{employee.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge key={`status-badge-${employee.id}`} variant={employee.isActive ? "success" : "destructive"} className={employee.isActive ? 
                        "bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800" : 
                        "bg-red-50 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"}>
                        {employee.isActive ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button 
                          key={`view-button-${employee.id}`}
                          variant="ghost" 
                          size="icon"
                          onClick={() => openViewDialog(employee)} 
                          className="text-foreground hover:text-foreground/80 hover:bg-muted" 
                          title="ดูรายละเอียด"
                        >
                          <FiEye className="h-5 w-5" />
                        </Button>
                        
                        <Button 
                          key={`edit-button-${employee.id}`}
                          variant="ghost" 
                          size="icon"
                          onClick={() => openEditDialog(employee)} 
                          className="text-foreground hover:text-foreground/80 hover:bg-muted" 
                          title="แก้ไข"
                        >
                          <FiEdit className="h-5 w-5" />
                        </Button>
                        
                        {(hasPermission(session.user, 'employees.edit.all') || 
                          (hasPermission(session.user, 'employees.edit.team') && 
                           session.user.teamId && employee.teamId && session.user.teamId === employee.teamId)) && (
                          <Button
                            key={`password-button-${employee.id}`}
                            variant="ghost" 
                            size="icon"
                            onClick={() => openPasswordDialog(employee)}
                            className="text-foreground hover:text-foreground/80 hover:bg-muted"
                            title="จัดการรหัสผ่าน"
                          >
                            <FiKey className="h-5 w-5" />
                          </Button>
                        )}
                        
                        {hasPermission(session.user, 'employees.delete') && 
                          (session.user.role !== 'supervisor' || 
                           (session.user.teamId && employee.teamId && session.user.teamId === employee.teamId)) && (
                          <Button
                            key={`delete-button-${employee.id}`}
                            variant="ghost" 
                            size="icon"
                            onClick={() => openDeleteDialog(employee)}
                            className="text-foreground hover:text-foreground/80 hover:bg-muted"
                            title="ลบ"
                          >
                            <FiTrash2 className="h-5 w-5" />
                          </Button>
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
        <div className="bg-background rounded-xl shadow-md p-10 text-center transition-colors duration-300 border">
          <div className="flex flex-col items-center justify-center">
            <FiUser className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">ไม่พบข้อมูลพนักงาน</p>
            <p className="text-sm text-muted-foreground mt-1">เพิ่มพนักงานใหม่เพื่อเริ่มต้นใช้งานระบบ</p>
            {canCreateEmployee && (
              <Button
                key="add-employee-button"
                onClick={openAddDialog}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <FiPlus className="mr-2" /> เพิ่มพนักงาน
              </Button>
            )}
          </div>
        </div>
      )}

      {/* View Dialog */}
      {viewDialogOpen && selectedEmployee && (
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <FiUser className="text-blue-600 dark:text-blue-400" /> 
                ข้อมูลพนักงาน
              </DialogTitle>
              <DialogDescription>
                รายละเอียดข้อมูลพนักงาน
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex flex-col md:flex-row gap-6 py-4">
              <div className="flex flex-col items-center space-y-4">
                <ProfileImage
                  src={selectedEmployee.image}
                  alt={`${selectedEmployee.firstName} ${selectedEmployee.lastName}`}
                  size="xl"
                  fallbackText={`${selectedEmployee.firstName} ${selectedEmployee.lastName}`}
                  clickable={true}
                  onClick={() => selectedEmployee.image && handleImagePreview(selectedEmployee.image)}
                />
                <h3 className="text-xl font-semibold text-center">
                  {selectedEmployee.firstName} {selectedEmployee.lastName}
                </h3>
                <div className="text-center text-muted-foreground">
                  {selectedEmployee.employeeId}
                </div>
              </div>
              
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 md:mt-0">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-muted-foreground">อีเมล</h4>
                  <div className="text-base">{selectedEmployee.email}</div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-muted-foreground">เบอร์โทรศัพท์</h4>
                  <div className="text-base">{selectedEmployee.phoneNumber || '-'}</div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-muted-foreground">บทบาท</h4>
                  <div className="text-base">
                    <Badge 
                      key="role-badge-view"
                      variant={selectedEmployee.role === 'admin' ? 'destructive' : selectedEmployee.role === 'supervisor' ? 'default' : 'secondary'}
                      className={
                        selectedEmployee.role === 'admin' ? 'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800' : 
                        selectedEmployee.role === 'supervisor' ? 'bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800' :
                        'bg-gray-50 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800'
                      }
                    >
                      {selectedEmployee.roleName}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-muted-foreground">ตำแหน่ง</h4>
                  <div className="text-base">
                    {selectedEmployee.positionName} {selectedEmployee.positionLevelName ? `(${selectedEmployee.positionLevelName})` : ''}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-muted-foreground">ชื่อตำแหน่ง</h4>
                  <div className="text-base">{selectedEmployee.positionTitle || '-'}</div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-muted-foreground">แผนก</h4>
                  <div className="text-base">{selectedEmployee.departmentName || '-'}</div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-muted-foreground">ทีม</h4>
                  <div className="text-base">{selectedEmployee.teamName || '-'}</div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-muted-foreground">เพศ</h4>
                  <div className="text-base">
                    {selectedEmployee.gender === 'male' ? 'ชาย' : 
                     selectedEmployee.gender === 'female' ? 'หญิง' : 
                     selectedEmployee.gender === 'other' ? 'อื่นๆ' : '-'}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-muted-foreground">วันเกิด</h4>
                  <div className="text-base">
                    {selectedEmployee.birthDate ? new Date(selectedEmployee.birthDate).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    }) : '-'}
                  </div>
                </div>
                
                <div className="md:col-span-2 space-y-2">
                  <h4 className="font-semibold text-sm text-muted-foreground">สถานะ</h4>
                  <div className="text-base">
                    <Badge 
                      key="status-badge-view" 
                      variant={selectedEmployee.isActive ? 'success' : 'secondary'}
                      className={selectedEmployee.isActive ? 
                        "bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800" : 
                        "bg-red-50 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"}
                    >
                      {selectedEmployee.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                key="close-button"
                type="button" 
                variant="outline" 
                onClick={() => setViewDialogOpen(false)}
              >
                ปิด
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog แก้ไขข้อมูลพนักงาน */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <FiEdit className="text-blue-600 dark:text-blue-400" /> 
              แก้ไขข้อมูลพนักงาน
            </DialogTitle>
            <DialogDescription>
              แก้ไขข้อมูลส่วนตัวและการทำงานของพนักงาน
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleUpdateEmployee}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-3 md:col-span-1">
                <div className="space-y-1 h-[70px]">
                  <Label htmlFor="employeeId">รหัสพนักงาน<span className="text-red-500">*</span></Label>
                  <Input 
                    id="employeeId"
                    name="employeeId"
                    type="text"
                    placeholder="รหัสพนักงาน"
                    value={formData.employeeId}
                    onChange={handleFormChange}
                    required
                    className="h-9"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3 h-[70px]">
                  <div className="space-y-1">
                    <Label htmlFor="firstName">ชื่อ<span className="text-red-500">*</span></Label>
                    <Input 
                      id="firstName"
                      name="firstName"
                      type="text"
                      placeholder="ชื่อ"
                      value={formData.firstName}
                      onChange={handleFormChange}
                      required
                      className="h-9"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="lastName">นามสกุล<span className="text-red-500">*</span></Label>
                    <Input 
                      id="lastName"
                      name="lastName"
                      type="text"
                      placeholder="นามสกุล"
                      value={formData.lastName}
                      onChange={handleFormChange}
                      required
                      className="h-9"
                    />
                  </div>
                </div>
                
                <div className="space-y-1 h-[70px]">
                  <Label htmlFor="email">อีเมล<span className="text-red-500">*</span></Label>
                  <Input 
                    id="email"
                    name="email"
                    type="email"
                    placeholder="อีเมล"
                    value={formData.email}
                    onChange={handleFormChange}
                    required
                    className="h-9"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3 h-[70px]">
                  <div className="space-y-1">
                    <Label htmlFor="phoneNumber">เบอร์โทรศัพท์</Label>
                    <Input 
                      id="phoneNumber"
                      name="phoneNumber"
                      type="text"
                      placeholder="เบอร์โทรศัพท์"
                      value={formData.phoneNumber}
                      onChange={handleFormChange}
                      className="h-9"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="birthDate">วันเกิด</Label>
                    <Input 
                      id="birthDate"
                      name="birthDate"
                      type="date"
                      value={formData.birthDate || ''}
                      onChange={handleFormChange}
                      className="h-9"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 h-[70px]">
                  <div className="space-y-1">
                    <Label htmlFor="gender">เพศ</Label>
                    <Select
                      value={formData.gender || ''}
                      onValueChange={(value) => setFormData({...formData, gender: value})}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="เลือกเพศ">
                          {formData.gender === 'male' ? 'ชาย' : 
                           formData.gender === 'female' ? 'หญิง' : 
                           formData.gender === 'other' ? 'อื่นๆ' : ''}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">ชาย</SelectItem>
                        <SelectItem value="female">หญิง</SelectItem>
                        <SelectItem value="other">อื่นๆ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="roleId">บทบาท</Label>
                    <Select
                      value={formData.roleId || ''}
                      onValueChange={(value) => {
                        // เลือก role จาก id (ไม่ต้องกำหนด role และ roleName แล้ว)
                        setFormData({
                          ...formData, 
                          roleId: value
                        });
                      }}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="เลือกบทบาท">
                          {formData.roleId ? 
                            (roles.find(r => r.id === formData.roleId)?.name_th || roles.find(r => r.id === formData.roleId)?.name || '') : 
                            ''}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name_th} ({role.name})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 h-[70px]">
                  <div className="space-y-1">
                    <Label htmlFor="departmentId">แผนก</Label>
                    <Select
                      value={formData.departmentId || ''}
                      onValueChange={(value) => setFormData({...formData, departmentId: value})}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="เลือกแผนก">
                          {formData.departmentId ? departments.find(d => d.id === formData.departmentId)?.name || '' : ''}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((department) => (
                          <SelectItem key={department.id} value={department.id}>
                            {department.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="teamId">ทีม</Label>
                    <Select
                      value={formData.teamId || ''}
                      onValueChange={(value) => setFormData({...formData, teamId: value})}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="เลือกทีม">
                          {formData.teamId ? teams.find(t => t.id === formData.teamId)?.name || '' : ''}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3 md:col-span-1">
                {/* ส่วนของการอัปโหลดรูปโปรไฟล์ */}
                <div className="space-y-1 h-[233px]">
                  <Label>รูปโปรไฟล์</Label>
                  <div className="flex flex-col items-center border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-900 h-[200px]">
                    <div className="flex flex-col items-center">
                      {imagePreview ? (
                        <div className="relative mb-2">
                          <div className="w-20 h-20 overflow-hidden rounded-full border-2 border-primary/20 flex items-center justify-center">
                            <ProfileImage
                              src={imagePreview}
                              alt="รูปโปรไฟล์"
                              size="lg"
                              fallbackText={`${formData.firstName} ${formData.lastName}`}
                              clickable={false}
                              className="object-cover w-full h-full"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 shadow-sm"
                            title="ลบรูปภาพ"
                          >
                            <FiX size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-2 border-2 border-primary/20">
                          <FiUser className="h-10 w-10 text-gray-400" />
                        </div>
                      )}
                      
                      <label className="flex items-center justify-center px-2 py-1 text-xs bg-primary/10 text-primary hover:bg-primary/20 rounded-md cursor-pointer transition-colors">
                        <FiUpload className="mr-1 h-3 w-3" />
                        <span>อัปโหลดรูปภาพ</span>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          onChange={handleImageChange}
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 text-center">รองรับไฟล์ JPG, PNG, GIF, WEBP (≤10MB)</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 h-[70px] mt-14">
                  <div className="space-y-1">
                    <Label htmlFor="position">ตำแหน่ง</Label>
                    <Select
                      value={formData.position || ''}
                      onValueChange={(value) => {
                        // อัปเดตค่าตำแหน่ง
                        const selectedPosition = positions.find(p => p.code === value);
                        const positionName = selectedPosition ? selectedPosition.name : '';
                        
                        // อัปเดตชื่อตำแหน่งเมื่อมีการเลือกตำแหน่งและระดับตำแหน่ง
                        let positionTitle = '';
                        if (value && formData.positionLevel) {
                          const levelName = positionLevels.find(l => l.code === formData.positionLevel)?.name || '';
                          if (positionName && levelName) {
                            positionTitle = `${levelName} ${positionName}`;
                          }
                        }
                        
                        setFormData({
                          ...formData, 
                          position: value,
                          positionTitle: positionTitle || formData.positionTitle
                        });
                      }}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="เลือกตำแหน่ง">
                          {formData.position ? positions.find(p => p.code === formData.position)?.name || '' : ''}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {positions.map((position) => (
                          <SelectItem key={position.id} value={position.code}>
                            {position.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="positionLevel">ระดับตำแหน่ง</Label>
                    <Select
                      value={formData.positionLevel || ''}
                      onValueChange={(value) => {
                        // อัปเดตค่าระดับตำแหน่ง
                        const selectedLevel = positionLevels.find(l => l.code === value);
                        const levelName = selectedLevel ? selectedLevel.name : '';
                        
                        // อัปเดตชื่อตำแหน่งเมื่อมีการเลือกตำแหน่งและระดับตำแหน่ง
                        let positionTitle = '';
                        if (formData.position && value) {
                          const positionName = positions.find(p => p.code === formData.position)?.name || '';
                          if (positionName && levelName) {
                            positionTitle = `${levelName} ${positionName}`;
                          }
                        }
                        
                        setFormData({
                          ...formData, 
                          positionLevel: value,
                          positionTitle: positionTitle || formData.positionTitle
                        });
                      }}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="เลือกระดับตำแหน่ง">
                          {formData.positionLevel ? positionLevels.find(l => l.code === formData.positionLevel)?.name || '' : ''}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {positionLevels.map((level) => (
                          <SelectItem key={level.id} value={level.code}>
                            {level.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-1 h-[70px]">
                  <Label htmlFor="positionTitle">ชื่อตำแหน่ง</Label>
                  <Input 
                    id="positionTitle"
                    name="positionTitle"
                    type="text"
                    placeholder="ชื่อตำแหน่ง"
                    value={formData.positionTitle || ''}
                    onChange={handleFormChange}
                    className="h-9"
                  />
                </div>

                <div className="space-y-1 h-[70px]">
                  <Label>สถานะพนักงาน</Label>
                  <div className="flex items-center h-9 space-x-2">
                    <Switch 
                      id="isActive" 
                      name="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                    />
                    <Label htmlFor="isActive" className="font-normal">Active</Label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end mt-4 border-t pt-4">
              <Button 
                key="edit-cancel-button" 
                type="button" 
                variant="outline" 
                onClick={() => setEditDialogOpen(false)}
                className="mr-2 h-9"
              >
                ยกเลิก
              </Button>
              <Button 
                key="edit-save-button" 
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white h-9" 
                disabled={formLoading}
              >
                {formLoading ? (
                  <>
                    <LoadingSpinner className="mr-2" size="sm" /> กำลังบันทึก...
                  </>
                ) : 'บันทึกการเปลี่ยนแปลง'}
              </Button>
            </div>
            
            {formError && (
              <p className="text-sm text-red-500 mt-2">{formError}</p>
            )}
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog เปลี่ยนรหัสผ่าน */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>เปลี่ยนรหัสผ่าน</DialogTitle>
            <DialogDescription>
              กำหนดรหัสผ่านใหม่สำหรับ {selectedEmployee?.firstName} {selectedEmployee?.lastName}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleUpdatePassword}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="password">รหัสผ่านใหม่<span className="text-red-500">*</span></Label>
                <Input 
                  id="password"
                  name="password"
                  type="password"
                  placeholder="รหัสผ่านใหม่"
                  value={passwordFormData.password}
                  onChange={handlePasswordFormChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">ยืนยันรหัสผ่านใหม่<span className="text-red-500">*</span></Label>
                <Input 
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="ยืนยันรหัสผ่านใหม่"
                  value={passwordFormData.confirmPassword}
                  onChange={handlePasswordFormChange}
                  required
                />
              </div>
            </div>
            
            {formError && (
              <p className="text-sm text-red-500 mt-2">{formError}</p>
            )}
            
            <DialogFooter>
              <Button 
                key="password-cancel-button" 
                type="button" 
                variant="outline" 
                onClick={() => setPasswordDialogOpen(false)}
              >
                ยกเลิก
              </Button>
              <Button 
                key="password-save-button"
                type="submit"
                className="bg-foreground hover:bg-foreground/90 text-background" 
                disabled={formLoading}
              >
                {formLoading ? (
                  <>
                    <LoadingSpinner className="mr-2" size="sm" /> กำลังบันทึก...
                  </>
                ) : 'เปลี่ยนรหัสผ่าน'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Dialog ยืนยันการลบพนักงาน */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>ยืนยันการลบพนักงาน</DialogTitle>
            <DialogDescription>
              คุณต้องการลบข้อมูลพนักงาน {selectedEmployee?.firstName} {selectedEmployee?.lastName} ใช่หรือไม่?
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-red-500">
              คำเตือน: การดำเนินการนี้ไม่สามารถเรียกคืนได้ ข้อมูลที่เกี่ยวข้องทั้งหมดจะถูกลบออกจากระบบ
            </p>
          </div>
          
          <DialogFooter>
            <Button 
              key="delete-cancel-button"
              type="button" 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
            >
              ยกเลิก
            </Button>
            <Button 
              key="delete-confirm-button"
              type="button" 
              variant="destructive" 
              onClick={() => handleDelete(selectedEmployee?.id)}
              disabled={formLoading}
            >
              {formLoading ? (
                <>
                  <LoadingSpinner className="mr-2" size="sm" /> กำลังลบ...
                </>
              ) : 'ลบพนักงาน'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog เพิ่มพนักงานใหม่ */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <FiPlus className="text-foreground" /> 
              เพิ่มพนักงานใหม่
            </DialogTitle>
            <DialogDescription>
              กรอกข้อมูลพนักงานใหม่ที่ต้องการเพิ่มเข้าระบบ
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleAddEmployee}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-3 md:col-span-1">
                <div className="space-y-1 h-[70px]">
                  <Label htmlFor="employeeId">รหัสพนักงาน<span className="text-red-500">*</span></Label>
                  <Input 
                    id="employeeId"
                    name="employeeId"
                    type="text"
                    placeholder="รหัสพนักงาน"
                    value={formData.employeeId}
                    onChange={handleFormChange}
                    required
                    className="h-9"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3 h-[70px]">
                  <div className="space-y-1">
                    <Label htmlFor="firstName">ชื่อ<span className="text-red-500">*</span></Label>
                    <Input 
                      id="firstName"
                      name="firstName"
                      type="text"
                      placeholder="ชื่อ"
                      value={formData.firstName}
                      onChange={handleFormChange}
                      required
                      className="h-9"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="lastName">นามสกุล<span className="text-red-500">*</span></Label>
                    <Input 
                      id="lastName"
                      name="lastName"
                      type="text"
                      placeholder="นามสกุล"
                      value={formData.lastName}
                      onChange={handleFormChange}
                      required
                      className="h-9"
                    />
                  </div>
                </div>
                
                <div className="space-y-1 h-[70px]">
                  <Label htmlFor="email">อีเมล<span className="text-red-500">*</span></Label>
                  <Input 
                    id="email"
                    name="email"
                    type="email"
                    placeholder="อีเมล"
                    value={formData.email}
                    onChange={handleFormChange}
                    required
                    className="h-9"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3 h-[70px]">
                  <div className="space-y-1">
                    <Label htmlFor="phoneNumber">เบอร์โทรศัพท์</Label>
                    <Input 
                      id="phoneNumber"
                      name="phoneNumber"
                      type="text"
                      placeholder="เบอร์โทรศัพท์"
                      value={formData.phoneNumber}
                      onChange={handleFormChange}
                      className="h-9"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="birthDate">วันเกิด</Label>
                    <Input 
                      id="birthDate"
                      name="birthDate"
                      type="date"
                      value={formData.birthDate || ''}
                      onChange={handleFormChange}
                      className="h-9"
                    />
                  </div>
                </div>
                
                <div className="space-y-2 min-h-[85px]">
                  <Label htmlFor="roleId">บทบาท</Label>
                  <Select
                    value={formData.roleId || ''}
                    onValueChange={(value) => {
                      // หา role code และ name จาก roleId
                      const selectedRole = roles.find(r => r.id === value);
                      setFormData({
                        ...formData, 
                        roleId: value,
                        role: selectedRole ? selectedRole.code : formData.role, // ใช้ code ของ role
                        roleName: selectedRole ? selectedRole.name : formData.roleName // ใช้ name ของ role
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกบทบาท">
                        {formData.roleId ? 
                          (roles.find(r => r.id === formData.roleId)?.name_th || roles.find(r => r.id === formData.roleId)?.name || '') : 
                          (formData.roleName || formData.role || '')}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name_th} ({role.name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2 min-h-[85px]">
                  <Label htmlFor="gender">เพศ</Label>
                  <Select
                    value={formData.gender || ''}
                    onValueChange={(value) => setFormData({...formData, gender: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกเพศ">
                        {formData.gender === 'male' ? 'ชาย' : 
                         formData.gender === 'female' ? 'หญิง' : 
                         formData.gender === 'other' ? 'อื่นๆ' : ''}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">ชาย</SelectItem>
                      <SelectItem value="female">หญิง</SelectItem>
                      <SelectItem value="other">อื่นๆ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-4 md:col-span-1">
                {/* ส่วนของการอัปโหลดรูปโปรไฟล์ */}
                <div className="space-y-2 mb-4 min-h-[180px]">
                  <Label>รูปโปรไฟล์</Label>
                  <div className="flex flex-col items-center border border-gray-300 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex flex-col items-center">
                      {imagePreview ? (
                        <div className="relative mb-3">
                          <div className="w-24 h-24 overflow-hidden rounded-full border-2 border-primary/20">
                            <div className="w-full h-full overflow-hidden">
                              <ProfileImage
                                src={imagePreview}
                                alt="รูปโปรไฟล์"
                                size="lg"
                                fallbackText={`${formData.firstName} ${formData.lastName}`}
                                clickable={false}
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 shadow-sm"
                            title="ลบรูปภาพ"
                          >
                            <FiX size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3 border-2 border-primary/20">
                          <FiUser className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                      
                      <label className="flex items-center justify-center px-3 py-1.5 text-sm bg-primary/10 text-primary hover:bg-primary/20 rounded-md cursor-pointer transition-colors">
                        <FiUpload className="mr-1 h-3.5 w-3.5" />
                        <span>อัปโหลดรูปภาพ</span>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          onChange={handleImageChange}
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">รองรับไฟล์ JPG, PNG, GIF, WEBP<br/>ขนาดไม่เกิน 10 MB</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="birthDate">วันเกิด</Label>
                  <Input 
                    id="birthDate"
                    name="birthDate"
                    type="date"
                    value={formData.birthDate || ''}
                    onChange={handleFormChange}
                  />
                </div>
                
                <div className="space-y-2 min-h-[85px]">
                  <Label htmlFor="position">ตำแหน่ง</Label>
                  <Select
                    value={formData.position || ''}
                    onValueChange={(value) => {
                      // อัปเดตค่าตำแหน่ง
                      const selectedPosition = positions.find(p => p.code === value);
                      const positionName = selectedPosition ? selectedPosition.name : '';
                      
                      // อัปเดตชื่อตำแหน่งเมื่อมีการเลือกตำแหน่งและระดับตำแหน่ง
                      let positionTitle = '';
                      if (value && formData.positionLevel) {
                        const levelName = positionLevels.find(l => l.code === formData.positionLevel)?.name || '';
                        if (positionName && levelName) {
                          positionTitle = `${levelName} ${positionName}`;
                        }
                      }
                      
                      setFormData({
                        ...formData, 
                        position: value,
                        positionTitle: positionTitle || formData.positionTitle
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกตำแหน่ง">
                        {formData.position ? positions.find(p => p.code === formData.position)?.name || '' : ''}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {positions.map((position) => (
                        <SelectItem key={position.id} value={position.code}>
                          {position.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2 min-h-[85px]">
                  <Label htmlFor="positionLevel">ระดับตำแหน่ง</Label>
                  <Select
                    value={formData.positionLevel || ''}
                    onValueChange={(value) => {
                      // อัปเดตค่าระดับตำแหน่ง
                      const selectedLevel = positionLevels.find(l => l.code === value);
                      const levelName = selectedLevel ? selectedLevel.name : '';
                      
                      // อัปเดตชื่อตำแหน่งเมื่อมีการเลือกตำแหน่งและระดับตำแหน่ง
                      let positionTitle = '';
                      if (formData.position && value) {
                        const positionName = positions.find(p => p.code === formData.position)?.name || '';
                        if (positionName && levelName) {
                          positionTitle = `${levelName} ${positionName}`;
                        }
                      }
                      
                      setFormData({
                        ...formData, 
                        positionLevel: value,
                        positionTitle: positionTitle || formData.positionTitle
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกระดับตำแหน่ง">
                        {formData.positionLevel ? positionLevels.find(l => l.code === formData.positionLevel)?.name || '' : ''}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {positionLevels.map((level) => (
                        <SelectItem key={level.id} value={level.code}>
                          {level.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2 min-h-[85px]">
                  <Label htmlFor="positionTitle">ชื่อตำแหน่ง</Label>
                  <Input 
                    id="positionTitle"
                    name="positionTitle"
                    type="text"
                    placeholder="ชื่อตำแหน่ง"
                    value={formData.positionTitle || ''}
                    onChange={handleFormChange}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3 min-h-[85px]">
                  <div className="space-y-2">
                    <Label htmlFor="departmentId">แผนก</Label>
                    <Select
                      value={formData.departmentId || ''}
                      onValueChange={(value) => setFormData({...formData, departmentId: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกแผนก">
                          {formData.departmentId ? departments.find(d => d.id === formData.departmentId)?.name || '' : ''}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((department) => (
                          <SelectItem key={department.id} value={department.id}>
                            {department.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="teamId">ทีม</Label>
                    <Select
                      value={formData.teamId || ''}
                      onValueChange={(value) => setFormData({...formData, teamId: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกทีม">
                          {formData.teamId ? teams.find(t => t.id === formData.teamId)?.name || '' : ''}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2 min-h-[50px]">
                  <Switch 
                    id="isActive" 
                    name="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                  />
                  <Label htmlFor="isActive">เปิดใช้งาน</Label>
                </div>
              </div>
            </div>
            
            {formError && (
              <p className="text-sm text-red-500 mt-2">{formError}</p>
            )}
            
            <div className="flex justify-end mt-3">
              <Button 
                key="cancel-button" 
                type="button" 
                variant="outline" 
                onClick={() => setAddDialogOpen(false)}
                className="mr-2"
              >
                ยกเลิก
              </Button>
              <Button 
                key="save-button" 
                type="submit"
                className="bg-foreground hover:bg-foreground/90 text-background" 
                disabled={formLoading}
              >
                {formLoading ? (
                  <>
                    <LoadingSpinner className="mr-2" size="sm" /> กำลังบันทึก...
                  </>
                ) : 'เพิ่มพนักงาน'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog แสดงรูปภาพขนาดใหญ่ */}
      <Dialog open={imageViewerOpen} onOpenChange={setImageViewerOpen}>
        <DialogContent className="max-w-3xl p-4">
          <DialogHeader>
            <DialogTitle className="text-xl">รูปโปรไฟล์</DialogTitle>
            <DialogDescription>
              รูปโปรไฟล์ขนาดใหญ่
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-center items-center py-4">
            {selectedImage && (
              <Image 
                src={selectedImage} 
                alt="รูปโปรไฟล์" 
                width={500} 
                height={500} 
                className="rounded-lg object-contain max-h-[70vh]" 
              />
            )}
          </div>
          
          <DialogFooter>
            <Button 
              key="close-image-button" 
              type="button"
              className="bg-foreground hover:bg-foreground/90 text-background"
              onClick={() => setImageViewerOpen(false)}
            >
              ปิด
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 

// เพิ่มฟังก์ชัน generateRandomPassword
// ฟังก์ชันสำหรับสร้างรหัสผ่านแบบสุ่ม
function generateRandomPassword(length = 10) {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}