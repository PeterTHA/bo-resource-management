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
  // แก้ไขการตรวจสอบเพื่อให้ครอบคลุมหลายรูปแบบ
  const userRole = session?.user?.role || '';
  const isAdmin = userRole.toLowerCase() === 'admin' || 
                  session?.user?.isAdmin === true || 
                  session?.user?.permissions?.includes('admin');
  const isTeamLead = userRole.toLowerCase() === 'team_lead' || 
                    userRole.toLowerCase() === 'supervisor';
  const currentUserId = session?.user?.id;
  const currentTeamId = session?.user?.teamId;
  
  // เพิ่ม debug log เพื่อตรวจสอบค่า role
  useEffect(() => {
    console.log("========== USER ROLE DEBUG ==========");
    console.log("Original user role value:", session?.user?.role);
    console.log("User role (lowercase):", userRole.toLowerCase());
    console.log("isAdmin value:", isAdmin);
    console.log("isTeamLead value:", isTeamLead);
    console.log("Session object:", session);
    console.log("User object:", session?.user);
    console.log("====================================");
  }, [session, isAdmin, isTeamLead, userRole]);
  
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
      console.log("========== FETCHING REFERENCE DATA ==========");
      console.log("Current user role:", session?.user?.role);
      console.log("isAdmin:", isAdmin);
      
      // ดึงข้อมูลตำแหน่ง
      const positionsRes = await employeeService.fetchPositions();
      console.log('Positions API response success:', positionsRes.success);
      console.log('Positions data count:', positionsRes.data ? positionsRes.data.length : 0);
      
      if (positionsRes.data && positionsRes.data.length > 0) {
        // ตรวจสอบข้อมูลตัวอย่าง
        console.log('Position sample:', positionsRes.data[0]);
        
        // แสดงรายการ code ทั้งหมด
        console.log('All position codes:', positionsRes.data.map(p => p.code).join(', '));
        
        // ตรวจสอบตำแหน่ง WEBMASTER
        const webmaster = positionsRes.data.find(p => p.code === 'WEBMASTER');
        console.log('Found WEBMASTER position:', webmaster ? 'Yes' : 'No');
        if (webmaster) {
          console.log('WEBMASTER details:', webmaster);
        } else {
          console.log('Available position codes:', positionsRes.data.map(p => p.code));
        }
      }
      
      setPositions(positionsRes.data || []);
      
      // ดึงข้อมูลระดับตำแหน่ง
      const positionLevelsRes = await employeeService.fetchPositionLevels();
      console.log('Position Levels API response success:', positionLevelsRes.success);
      console.log('Position Levels data count:', positionLevelsRes.data ? positionLevelsRes.data.length : 0);
      
      if (positionLevelsRes.data && positionLevelsRes.data.length > 0) {
        // ตรวจสอบข้อมูลตัวอย่าง
        console.log('Position level sample:', positionLevelsRes.data[0]);
        
        // แสดงรายการ code ทั้งหมด
        console.log('All position level codes:', positionLevelsRes.data.map(p => p.code).join(', '));
        
        // ตรวจสอบระดับตำแหน่ง ADMIN
        const adminLevel = positionLevelsRes.data.find(p => p.code === 'ADMIN');
        console.log('Found ADMIN position level:', adminLevel ? 'Yes' : 'No');
        if (adminLevel) {
          console.log('ADMIN level details:', adminLevel);
        } else {
          console.log('Available position level codes:', positionLevelsRes.data.map(p => p.code));
        }
      }
      
      setPositionLevels(positionLevelsRes.data || []);
      
      // ดึงข้อมูลแผนก
      const departmentsRes = await employeeService.fetchDepartments();
      setDepartments(departmentsRes.data || []);
      
      // ดึงข้อมูลทีม
      const teamsRes = await employeeService.fetchTeams();
      setTeams(teamsRes.data || []);
      
      // ดึงข้อมูลบทบาท
      const rolesRes = await employeeService.fetchRoles();
      console.log('Roles API response success:', rolesRes.success);
      console.log('Roles data count:', rolesRes.data ? rolesRes.data.length : 0);
      
      if (rolesRes.data && rolesRes.data.length > 0) {
        // ตรวจสอบข้อมูลตัวอย่าง
        console.log('Role sample:', rolesRes.data[0]);
        
        // แสดงรายการ code ทั้งหมด
        console.log('All role codes:', rolesRes.data.map(r => r.code).join(', '));
      }
      
      setRoles(rolesRes.data || []);
      console.log("=========================================");
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
      console.log(`Opening ${dialog} dialog with employee:`, employee);
      console.log('Is admin user:', isAdmin);
      console.log('Available positions count:', positions?.length || 0);
      console.log('Available position levels count:', positionLevels?.length || 0);
      
      // ตรวจสอบและปรับปรุงข้อมูลตำแหน่งและระดับตำแหน่ง (กรณีที่ข้อมูลเดิมไม่มี positionId และ positionLevelId)
      if (dialog === 'edit' || dialog === 'password') {
        // หา position_id จาก code ถ้ายังไม่มี
        if (employee.position && !employee.positionId) {
          // ปรับปรุงการค้นหาให้สนใจเฉพาะตัวอักษรไม่สนใจตัวพิมพ์เล็ก/ใหญ่
          const foundPosition = positions.find(p => 
            String(p.code).trim().toLowerCase() === String(employee.position).trim().toLowerCase()
          );
          
          if (foundPosition) {
            console.log(`Found position for code ${employee.position}:`, foundPosition);
            employee = { ...employee, positionId: foundPosition.id };
          } else {
            console.warn(`Could not find position for code ${employee.position}`);
            console.log('Available positions:', positions.map(p => `${p.code} (${p.name})`));
          }
        }
        
        // หา position_level_id จาก code ถ้ายังไม่มี
        if (employee.positionLevel && !employee.positionLevelId) {
          // ปรับปรุงการค้นหาให้สนใจเฉพาะตัวอักษรไม่สนใจตัวพิมพ์เล็ก/ใหญ่
          const foundPositionLevel = positionLevels.find(p => 
            String(p.code).trim().toLowerCase() === String(employee.positionLevel).trim().toLowerCase()
          );
          
          if (foundPositionLevel) {
            console.log(`Found position level for code ${employee.positionLevel}:`, foundPositionLevel);
            employee = { ...employee, positionLevelId: foundPositionLevel.id };
          } else {
            console.warn(`Could not find position level for code ${employee.positionLevel}`);
            console.log('Available position levels:', positionLevels.map(p => `${p.code} (${p.name})`));
          }
        }
        
        // หา role_id จาก code ถ้ายังไม่มี
        if (employee.role && !employee.roleId) {
          // ปรับปรุงการค้นหาให้สนใจเฉพาะตัวอักษรไม่สนใจตัวพิมพ์เล็ก/ใหญ่
          const foundRole = roles.find(r => 
            String(r.code).trim().toLowerCase() === String(employee.role).trim().toLowerCase()
          );
          
          if (foundRole) {
            console.log(`Found role for code ${employee.role}:`, foundRole);
            employee = { ...employee, roleId: foundRole.id };
          } else {
            console.warn(`Could not find role for code ${employee.role}`);
            console.log('Available roles:', roles.map(r => `${r.code} (${r.name})`));
          }
        }
      }
      
      console.log(`Updated employee data for ${dialog} dialog:`, employee);
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
    
    const transformedData = {
      employee_id: formData.employeeId,
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email,
      password: randomPassword,
      position_id: formData.positionId,
      position_level_id: formData.positionLevelId,
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
    
    // Debug log ก่อนอัพเดต
    console.log("============ UPDATE EMPLOYEE DEBUG [FIXED] ============");
    console.log("ก่อนส่งข้อมูลไปอัพเดต:");
    console.log("formData.isActive:", formData.isActive);
    console.log("formData.isActive === true:", formData.isActive === true);
    console.log("formData.isActive === false:", formData.isActive === false);
    console.log("formData.isActive type:", typeof formData.isActive);
    
    // ตรวจสอบค่า isActive ที่จะส่งไป
    if (formData.isActive !== true && formData.isActive !== false) {
      console.warn("WARNING: isActive มีค่าที่ไม่ชัดเจน:", formData.isActive);
      console.warn("กำลังแปลงเป็นค่า boolean ที่ชัดเจน");
      
      // กำหนดค่า isActive ที่ชัดเจนก่อนเรียก API
      formData.isActive = formData.isActive === true ? true : false;
      console.log("formData.isActive หลังแปลงค่า:", formData.isActive);
    }
    
    console.log("==============================================");
    
    const updatedEmployee = await updateEmployee(selectedEmployee.id);
    
    if (updatedEmployee) {
      // Log ข้อมูลที่ได้รับกลับมาจาก API
      console.log("=========== AFTER UPDATE DEBUG [FIXED] ===========");
      console.log("ข้อมูลหลังอัพเดต:", updatedEmployee);
      console.log("updatedEmployee.is_active:", updatedEmployee.is_active);
      console.log("updatedEmployee.is_active === true:", updatedEmployee.is_active === true);
      console.log("updatedEmployee.is_active === false:", updatedEmployee.is_active === false);
      console.log("updatedEmployee.is_active type:", typeof updatedEmployee.is_active);
      console.log("===========================================");
      
      // หาข้อมูลบทบาทจาก roleId
      const selectedRole = roles.find(r => r.id === formData.roleId);
      
      // ใช้ค่า isActive ที่ชัดเจนจาก API - แก้ไขเป็น true หรือ false ชัดเจน
      // ถ้าเป็น string "false" จะถูกแปลงเป็น false
      const finalIsActive = typeof updatedEmployee.is_active === 'string' 
        ? updatedEmployee.is_active.toLowerCase() === 'false' ? false : true 
        : updatedEmployee.is_active === true ? true : false;
      
      console.log("หลังแปลงค่า finalIsActive:", finalIsActive);
      console.log("finalIsActive type:", typeof finalIsActive);
      
      const transformedEmployee = {
        id: updatedEmployee.id || selectedEmployee.id,
        employeeId: updatedEmployee.employee_id || formData.employeeId,
        firstName: updatedEmployee.first_name || formData.firstName,
        lastName: updatedEmployee.last_name || formData.lastName,
        email: updatedEmployee.email || formData.email,
        position: updatedEmployee.positions?.code || formData.position,
        positionLevel: updatedEmployee.position_levels?.code || formData.positionLevel,
        positionId: updatedEmployee.position_id || formData.positionId,
        positionLevelId: updatedEmployee.position_level_id || formData.positionLevelId,
        positionTitle: updatedEmployee.position_title || formData.positionTitle,
        departmentId: updatedEmployee.department_id || formData.departmentId,
        teamId: updatedEmployee.team_id || formData.teamId,
        department: updatedEmployee.departments || selectedEmployee.department,
        teamData: updatedEmployee.teams || selectedEmployee.teamData,
        roleId: formData.roleId,
        role: selectedRole?.code || updatedEmployee.role || selectedEmployee.role,
        roleName: selectedRole?.name || updatedEmployee.role_name || selectedEmployee.roleName || '',
        roleNameTh: selectedRole?.name_th || updatedEmployee.role_name_th || selectedEmployee.roleNameTh || '',
        isActive: finalIsActive, // ใช้ค่าที่แปลงเป็น boolean ชัดเจนแล้ว
        birthDate: updatedEmployee.birth_date || formData.birthDate,
        gender: updatedEmployee.gender || formData.gender,
        phoneNumber: updatedEmployee.phone_number || formData.phoneNumber,
        image: updatedEmployee.image || imageUrl
      };
      
      // Log ข้อมูลที่จะนำไปอัพเดตในรายการ
      console.log("transformedEmployee.isActive:", transformedEmployee.isActive);
      console.log("transformedEmployee.isActive === true:", transformedEmployee.isActive === true);
      console.log("transformedEmployee.isActive type:", typeof transformedEmployee.isActive);
      
      updateEmployeeInList(transformedEmployee);
      closeDialog('edit');
      
      // ดึงข้อมูลใหม่จาก API เพื่อให้แน่ใจว่าข้อมูลที่แสดงอัพเดตล่าสุด
      console.log("เรียกใช้ fetchEmployees เพื่อดึงข้อมูลใหม่หลังจากอัพเดต");
      await fetchEmployees();
      
        toast({
        title: "อัปเดตข้อมูลสำเร็จ",
        description: `อัปเดตข้อมูล ${transformedEmployee.firstName} ${transformedEmployee.lastName} เรียบร้อยแล้ว`,
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
        description: `เปลี่ยนรหัสผ่านของ ${selectedEmployee.firstName} ${selectedEmployee.lastName} เรียบร้อยแล้ว (ข้อมูลถูกเข้ารหัสอย่างปลอดภัย)`,
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
        positions={positions || []}
        positionLevels={positionLevels || []}
        departments={departments || []}
        teams={teams || []}
        roles={roles || []}
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
        positions={positions || []}
        positionLevels={positionLevels || []}
        departments={departments || []}
        teams={teams || []}
        roles={roles || []}
        handleFormChange={handleFormChange}
        handleUpdateEmployee={handleUpdateEmployee}
        imagePreview={imagePreview}
        handleImageChange={handleImageChange}
        handleRemoveImage={handleRemoveImage}
        isAdmin={isAdmin}
        isTeamLead={isTeamLead}
        isCurrentUser={selectedEmployee?.id === currentUserId}
        currentUserId={currentUserId}
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