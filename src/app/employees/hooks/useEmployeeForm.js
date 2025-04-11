'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';

export function useEmployeeForm(initialData = {}) {
  const { toast } = useToast();
  
  const defaultFormData = {
    employeeId: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phoneNumber: '',
    role: '',
    roleId: '',
    roleName: '',
    position: '',
    positionLevel: '',
    positionTitle: '',
    departmentId: '',
    teamId: '',
    gender: '',
    birthDate: '',
    isActive: true,
    image: ''
  };
  
  const [formData, setFormData] = useState({ ...defaultFormData, ...initialData });
  const [passwordFormData, setPasswordFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [imagePreview, setImagePreview] = useState(initialData.image || null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // ฟังก์ชันจัดการการเปลี่ยนแปลงในฟอร์ม
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'select') {
      // สำหรับ Select ที่ส่งค่ามาจาก onValueChange
      const additionalData = e.additionalData || {};
      
      setFormData(prev => ({
        ...prev,
        [name]: value,
        ...additionalData
      }));
    } else {
      // สำหรับ Input ปกติ
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };
  
  // ฟังก์ชันจัดการการเปลี่ยนแปลงในฟอร์มเปลี่ยนรหัสผ่าน
  const handlePasswordFormChange = (e) => {
    const { name, value } = e.target;
    
    setPasswordFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // ฟังก์ชันจัดการการเปลี่ยนรูปภาพ
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // ตรวจสอบประเภทไฟล์
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "รูปแบบไฟล์ไม่ถูกต้อง",
        description: "กรุณาอัปโหลดไฟล์ภาพ JPG, PNG, GIF หรือ WEBP เท่านั้น",
      });
      return;
    }
    
    // ตรวจสอบขนาดไฟล์ (ไม่เกิน 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "ไฟล์มีขนาดใหญ่เกินไป",
        description: "กรุณาอัปโหลดไฟล์ที่มีขนาดไม่เกิน 10MB",
      });
      return;
    }
    
    // แสดงตัวอย่างรูปภาพ
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };
  
  // ฟังก์ชันลบรูปภาพ
  const handleRemoveImage = () => {
    setImagePreview(null);
    setFormData(prev => ({ ...prev, image: '' }));
  };
  
  // ฟังก์ชันอัปโหลดรูปภาพไปยังเซิร์ฟเวอร์
  const uploadImage = async () => {
    if (!imagePreview || imagePreview === formData.image) return formData.image;
    
    try {
      setUploadingImage(true);
      
      // ตรวจสอบว่าเป็น Base64 string ใหม่หรือไม่
      if (imagePreview.startsWith('data:image')) {
        // แปลง Base64 เป็น Blob
        const response = await fetch(imagePreview);
        const blob = await response.blob();
        
        // สร้าง FormData
        const formDataUpload = new FormData();
        formDataUpload.append('file', blob, 'profile.jpg');
        
        // อัปโหลดไฟล์
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formDataUpload,
        });
        
        if (!uploadRes.ok) {
          throw new Error('อัปโหลดรูปภาพไม่สำเร็จ');
        }
        
        const uploadData = await uploadRes.json();
        return uploadData.url;
      }
      
      return imagePreview; // ถ้าไม่ใช่รูปใหม่ ส่งค่าเดิมกลับไป
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        variant: "destructive",
        title: "อัปโหลดรูปภาพไม่สำเร็จ",
        description: error.message || "กรุณาลองใหม่อีกครั้ง",
      });
      return formData.image || ''; // หากเกิดข้อผิดพลาด คืนค่ารูปเดิม
    } finally {
      setUploadingImage(false);
    }
  };
  
  // ฟังก์ชันเพิ่มพนักงานใหม่
  const addEmployee = async () => {
    try {
      setFormLoading(true);
      setFormError('');
      
      // ตรวจสอบข้อมูลที่จำเป็น
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.employeeId) {
        setFormError('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
        return null;
      }
      
      // อัปโหลดรูปภาพ (ถ้ามี)
      let imageUrl = formData.image;
      if (imagePreview && imagePreview !== formData.image) {
        imageUrl = await uploadImage();
      }
      
      // สร้างรหัสผ่านแบบสุ่ม
      const randomPassword = generateRandomPassword(10);
      
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
        return null;
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
        role: data.data?.role || formData.role,
        roleName: data.data?.role_name || formData.roleName || '',
        roleNameTh: data.data?.role_name_th || formData.roleNameTh || '',
        isActive: data.data?.is_active !== undefined ? data.data.is_active : formData.isActive,
        birthDate: data.data?.birth_date || formData.birthDate,
        gender: data.data?.gender || formData.gender,
        phoneNumber: data.data?.phone_number || formData.phoneNumber,
        image: data.data?.image || imageUrl
      };
      
      // Reset form
      resetForm();
      
      return transformedEmployee;
    } catch (error) {
      console.error('Error adding employee:', error);
      setFormError('เกิดข้อผิดพลาดในการเพิ่มพนักงาน');
      return null;
    } finally {
      setFormLoading(false);
    }
  };
  
  // ฟังก์ชันอัปเดตพนักงาน
  const updateEmployee = async (employeeId) => {
    try {
      setFormLoading(true);
      setFormError('');
      
      // ตรวจสอบข้อมูลที่จำเป็น
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.employeeId) {
        setFormError('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
        return null;
      }
      
      // อัปโหลดรูปภาพ (ถ้ามี)
      let imageUrl = formData.image;
      if (imagePreview && imagePreview !== formData.image) {
        imageUrl = await uploadImage();
      }
      
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
      
      const res = await fetch(`/api/employees/${employeeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transformedData),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setFormError(data.message || 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลพนักงาน');
        return null;
      }
      
      // แปลง snake_case กลับเป็น camelCase
      const updatedEmployee = {
        id: employeeId,
        employeeId: data.data?.employee_id || formData.employeeId,
        firstName: data.data?.first_name || formData.firstName,
        lastName: data.data?.last_name || formData.lastName,
        email: data.data?.email || formData.email,
        position: data.data?.position || formData.position,
        positionLevel: data.data?.position_level || formData.positionLevel,
        positionTitle: data.data?.position_title || formData.positionTitle,
        departmentId: data.data?.department_id || formData.departmentId,
        teamId: data.data?.team_id || formData.teamId,
        department: data.data?.departments || formData.department,
        teamData: data.data?.teams || formData.teamData,
        roleId: formData.roleId,
        role: data.data?.role || formData.role,
        roleName: data.data?.role_name || formData.roleName || '',
        roleNameTh: data.data?.role_name_th || formData.roleNameTh || '',
        isActive: data.data?.is_active !== undefined ? data.data.is_active : formData.isActive,
        birthDate: data.data?.birth_date || formData.birthDate,
        gender: data.data?.gender || formData.gender,
        phoneNumber: data.data?.phone_number || formData.phoneNumber,
        image: data.data?.image || imageUrl
      };
      
      return updatedEmployee;
    } catch (error) {
      console.error('Error updating employee:', error);
      setFormError('เกิดข้อผิดพลาดในการอัปเดตข้อมูลพนักงาน');
      return null;
    } finally {
      setFormLoading(false);
    }
  };
  
  // ฟังก์ชันเปลี่ยนรหัสผ่าน
  const updatePassword = async (employeeId) => {
    try {
      setFormLoading(true);
      setFormError('');
      
      // ตรวจสอบว่ารหัสผ่านตรงกัน
      if (passwordFormData.password !== passwordFormData.confirmPassword) {
        setFormError('รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน');
        return false;
      }
      
      // ตรวจสอบความยาวรหัสผ่าน
      if (passwordFormData.password.length < 6) {
        setFormError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
        return false;
      }
      
      const res = await fetch(`/api/employees/${employeeId}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: passwordFormData.password }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setFormError(data.message || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
        return false;
      }
      
      // รีเซ็ตข้อมูลฟอร์ม
      setPasswordFormData({
        password: '',
        confirmPassword: ''
      });
      
      return true;
    } catch (error) {
      console.error('Error updating password:', error);
      setFormError('เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
      return false;
    } finally {
      setFormLoading(false);
    }
  };
  
  // ฟังก์ชันรีเซ็ตฟอร์ม
  const resetForm = () => {
    setFormData(defaultFormData);
    setFormError('');
    setImagePreview(null);
  };
  
  // ฟังก์ชันกำหนดข้อมูลฟอร์มจากพนักงานที่เลือก
  const setEmployeeToForm = (employee) => {
    if (!employee) return;
    
    setFormData({
      employeeId: employee.employeeId || '',
      firstName: employee.firstName || '',
      lastName: employee.lastName || '',
      email: employee.email || '',
      phoneNumber: employee.phoneNumber || '',
      role: employee.role || '',
      roleId: employee.roleId || '',
      roleName: employee.roleName || '',
      roleNameTh: employee.roleNameTh || '',
      position: employee.position || '',
      positionLevel: employee.positionLevel || '',
      positionTitle: employee.positionTitle || '',
      departmentId: employee.departmentId || '',
      teamId: employee.teamId || '',
      gender: employee.gender || '',
      birthDate: employee.birthDate || '',
      isActive: employee.isActive !== undefined ? employee.isActive : true,
      image: employee.image || ''
    });
    
    setImagePreview(employee.image || null);
    setFormError('');
  };
  
  // ฟังก์ชันสร้างรหัสผ่านแบบสุ่ม
  const generateRandomPassword = (length = 10) => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+";
    let password = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    return password;
  };
  
  return {
    formData,
    setFormData,
    passwordFormData,
    setPasswordFormData,
    formLoading,
    formError,
    setFormError,
    imagePreview,
    uploadingImage,
    handleFormChange,
    handlePasswordFormChange,
    handleImageChange,
    handleRemoveImage,
    uploadImage,
    addEmployee,
    updateEmployee,
    updatePassword,
    resetForm,
    setEmployeeToForm
  };
} 