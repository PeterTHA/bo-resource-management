'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/ui/use-toast';

// นำเข้าคอมโพเนนต์ที่แยกออกมา
import EmployeeList from './components/EmployeeList';
import AddEmployeeDialog from './components/dialogs/AddEmployeeDialog';
import EditEmployeeDialog from './components/dialogs/EditEmployeeDialog';
import ViewEmployeeDialog from './components/dialogs/ViewEmployeeDialog';
import PasswordDialog from './components/dialogs/PasswordDialog';
import DeleteConfirmDialog from './components/dialogs/DeleteConfirmDialog';

// นำเข้า Custom Hooks
import { useEmployees } from './hooks/useEmployees';
import { useEmployeeForm } from './hooks/useEmployeeForm';

// นำเข้า Service
import * as employeeService from './services/employeeService';

export default function EmployeesPage() {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  
  // นำ Custom Hooks มาใช้
  const {
    employees,
    isLoading,
    error,
    connectionError,
    fetchEmployees,
    addEmployee: addEmployeeToList,
    updateEmployee: updateEmployeeInList,
    deleteEmployee: removeEmployeeFromList
  } = useEmployees();
  
  const {
    formData,
    passwordFormData,
    formLoading,
    formError,
    imagePreview,
    handleFormChange,
    handlePasswordFormChange,
    handleImageChange,
    handleRemoveImage,
    addEmployee,
    updateEmployee,
    updatePassword,
    resetForm,
    setEmployeeToForm
  } = useEmployeeForm();
  
  // State สำหรับจัดการ Dialog
  const [dialogState, setDialogState] = useState({
    add: false,
    edit: false,
    view: false,
    password: false,
    delete: false
  });
  
  // State อื่นๆ
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  
  // State สำหรับข้อมูลอ้างอิง (จากตาราง Master Data)
  const [positions, setPositions] = useState([]);
  const [positionLevels, setPositionLevels] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [roles, setRoles] = useState([]);
  
  // สิทธิ์การใช้งาน
  const isAdmin = session?.user?.role?.toLowerCase() === 'admin';
  const isTeamLead = session?.user?.role?.toLowerCase() === 'team_lead';
  const currentUserId = session?.user?.id;
  const currentTeamId = session?.user?.teamId;
  
  // เพิ่ม debug log เพื่อตรวจสอบค่า role
  useEffect(() => {
    console.log("User role:", session?.user?.role);
    console.log("isAdmin:", isAdmin);
    console.log("isTeamLead:", isTeamLead);
  }, [session, isAdmin, isTeamLead]);
  
  // ดึงข้อมูลที่จำเป็น
  useEffect(() => {
    if (session) {
      // ดึงข้อมูลอ้างอิง
      fetchReferenceData();
    }
  }, [session]);
  
  // ฟังก์ชันดึงข้อมูลอ้างอิง
  const fetchReferenceData = async () => {
    try {
      // ดึงข้อมูลตำแหน่ง
      const positionsRes = await employeeService.fetchPositions();
      setPositions(positionsRes.data || []);
      
      // ดึงข้อมูลระดับตำแหน่ง
      const positionLevelsRes = await employeeService.fetchPositionLevels();
      setPositionLevels(positionLevelsRes.data || []);
      
      // ดึงข้อมูลแผนก
      const departmentsRes = await employeeService.fetchDepartments();
      setDepartments(departmentsRes.data || []);
      
      // ดึงข้อมูลทีม
      const teamsRes = await employeeService.fetchTeams();
      setTeams(teamsRes.data || []);
      
      // ดึงข้อมูลบทบาท
      const rolesRes = await employeeService.fetchRoles();
      setRoles(rolesRes.data || []);
    } catch (error) {
      console.error('Error fetching reference data:', error);
      toast({
        variant: "destructive",
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถดึงข้อมูลอ้างอิงได้ กรุณาลองใหม่อีกครั้ง",
      });
    }
  };
  
  // ฟังก์ชันจัดการการเปิด/ปิด Dialog
  const openDialog = (dialog, employee = null) => {
    if (employee) {
      setSelectedEmployee(employee);
      
      if (dialog === 'edit' || dialog === 'password') {
        setEmployeeToForm(employee);
      }
    }
    
    setDialogState(prev => ({ ...prev, [dialog]: true }));
  };
  
  const closeDialog = (dialog) => {
    setDialogState(prev => ({ ...prev, [dialog]: false }));
    
    if (dialog === 'add' || dialog === 'edit') {
      resetForm();
    }
    
    if (dialog === 'password') {
      setDeleteError('');
    }
    
    if (dialog === 'delete') {
      setIsDeleting(false);
      setDeleteError('');
    }
  };
  
  // ฟังก์ชันจัดการการเพิ่มพนักงาน
  const handleAddEmployee = async (e) => {
    e.preventDefault();
    
    const newEmployee = await addEmployee();
    
    if (newEmployee) {
      addEmployeeToList(newEmployee);
      closeDialog('add');
      
      toast({
        title: "เพิ่มพนักงานสำเร็จ",
        description: `เพิ่ม ${newEmployee.firstName} ${newEmployee.lastName} เข้าระบบเรียบร้อยแล้ว`,
      });
    }
  };
  
  // ฟังก์ชันจัดการการอัปเดตพนักงาน
  const handleUpdateEmployee = async (e) => {
    e.preventDefault();
    
    const updatedEmployee = await updateEmployee(selectedEmployee.id);
    
    if (updatedEmployee) {
      updateEmployeeInList(updatedEmployee);
      closeDialog('edit');
      
      toast({
        title: "อัปเดตข้อมูลสำเร็จ",
        description: `อัปเดตข้อมูล ${updatedEmployee.firstName} ${updatedEmployee.lastName} เรียบร้อยแล้ว`,
      });
    }
  };
  
  // ฟังก์ชันจัดการการเปลี่ยนรหัสผ่าน
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    
    const success = await updatePassword(selectedEmployee.id);
    
    if (success) {
      closeDialog('password');
      
      toast({
        title: "เปลี่ยนรหัสผ่านสำเร็จ",
        description: `เปลี่ยนรหัสผ่านของ ${selectedEmployee.firstName} ${selectedEmployee.lastName} เรียบร้อยแล้ว`,
      });
    }
  };
  
  // ฟังก์ชันจัดการการลบพนักงาน
  const handleConfirmDelete = async (employeeId) => {
    try {
      setIsDeleting(true);
      setDeleteError('');
      
      const res = await employeeService.deleteEmployee(employeeId);
      
      removeEmployeeFromList(employeeId);
      closeDialog('delete');
      
      toast({
        title: "ลบพนักงานสำเร็จ",
        description: `ลบข้อมูลพนักงานเรียบร้อยแล้ว`,
      });
    } catch (error) {
      console.error('Error deleting employee:', error);
      setDeleteError(error.message || 'เกิดข้อผิดพลาดในการลบพนักงาน');
    } finally {
      setIsDeleting(false);
    }
  };
  
  // แสดงหน้าโหลดหากยังไม่พร้อม
  if (status === 'loading') {
    return null;
  }
  
  return (
    <div className="container mx-auto p-4">
      {/* รายการพนักงาน */}
      <EmployeeList 
        employees={employees}
        isLoading={isLoading}
        error={error}
        connectionError={connectionError}
        isAdmin={isAdmin}
        isTeamLead={isTeamLead}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onView={(employee) => openDialog('view', employee)}
        onEdit={(employee) => openDialog('edit', employee)}
        onDelete={(employee) => openDialog('delete', employee)}
        onPasswordChange={(employee) => openDialog('password', employee)}
        onAdd={() => openDialog('add')}
        currentUserId={currentUserId}
      />
      
      {/* Dialog เพิ่มพนักงาน */}
      <AddEmployeeDialog 
        open={dialogState.add}
        onOpenChange={(open) => open ? openDialog('add') : closeDialog('add')}
        formData={formData}
        formError={formError}
        formLoading={formLoading}
        positions={positions}
        positionLevels={positionLevels}
        departments={departments}
        teams={teams}
        roles={roles}
        handleFormChange={handleFormChange}
        handleAddEmployee={handleAddEmployee}
        imagePreview={imagePreview}
        handleImageChange={handleImageChange}
        handleRemoveImage={handleRemoveImage}
      />
      
      {/* Dialog แก้ไขพนักงาน */}
      <EditEmployeeDialog 
        open={dialogState.edit}
        onOpenChange={(open) => open ? openDialog('edit', selectedEmployee) : closeDialog('edit')}
        formData={formData}
        formError={formError}
        formLoading={formLoading}
        positions={positions}
        positionLevels={positionLevels}
        departments={departments}
        teams={teams}
        roles={roles}
        handleFormChange={handleFormChange}
        handleUpdateEmployee={handleUpdateEmployee}
        imagePreview={imagePreview}
        handleImageChange={handleImageChange}
        handleRemoveImage={handleRemoveImage}
      />
      
      {/* Dialog ดูข้อมูลพนักงาน */}
      <ViewEmployeeDialog 
        open={dialogState.view}
        onOpenChange={(open) => open ? openDialog('view', selectedEmployee) : closeDialog('view')}
        employee={selectedEmployee}
        isAdmin={isAdmin}
        isTeamLead={isTeamLead}
        isCurrentUser={selectedEmployee?.id === currentUserId}
        departments={departments}
        teams={teams}
        onEdit={(employee) => {
          closeDialog('view');
          openDialog('edit', employee);
        }}
        onPasswordChange={(employee) => {
          closeDialog('view');
          openDialog('password', employee);
        }}
      />
      
      {/* Dialog เปลี่ยนรหัสผ่าน */}
      <PasswordDialog 
        open={dialogState.password}
        onOpenChange={(open) => open ? openDialog('password', selectedEmployee) : closeDialog('password')}
        employee={selectedEmployee}
        passwordFormData={passwordFormData}
        formLoading={formLoading}
        formError={formError}
        handlePasswordFormChange={handlePasswordFormChange}
        handleUpdatePassword={handleUpdatePassword}
      />
      
      {/* Dialog ยืนยันการลบ */}
      <DeleteConfirmDialog 
        open={dialogState.delete}
        onOpenChange={(open) => open ? openDialog('delete', selectedEmployee) : closeDialog('delete')}
        employee={selectedEmployee}
        isDeleting={isDeleting}
        onConfirmDelete={handleConfirmDelete}
        error={deleteError}
      />
    </div>
  );
}