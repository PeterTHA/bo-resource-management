import { useState } from 'react';
import { toast } from 'sonner';

export function useProjectForm() {
  // State สำหรับฟอร์มโปรเจค
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    startDate: '',
    endDate: '',
    priority: 'medium',
    status: 'active',
    teamId: '',
    members: []
  });
  
  // State สำหรับข้อผิดพลาดในฟอร์ม
  const [formError, setFormError] = useState({});
  
  // State สำหรับการโหลดดิ้งของฟอร์ม
  const [formLoading, setFormLoading] = useState(false);
  
  // ฟังก์ชันรีเซ็ตฟอร์ม
  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      startDate: '',
      endDate: '',
      priority: 'medium',
      status: 'active',
      teamId: '',
      members: []
    });
    setFormError({});
  };
  
  // ฟังก์ชันกำหนดข้อมูลฟอร์มจากโปรเจคที่เลือก
  const setProjectToForm = (project) => {
    if (!project) return;
    
    console.log('Setting project data to form:', project);
    
    // แปลงวันที่เป็นรูปแบบที่ input date รองรับ
    let formattedStartDate = '';
    let formattedEndDate = '';
    
    if (project.startDate) {
      try {
        const startDate = new Date(project.startDate);
        if (!isNaN(startDate.getTime())) {
          const year = startDate.getFullYear();
          const month = String(startDate.getMonth() + 1).padStart(2, '0');
          const day = String(startDate.getDate()).padStart(2, '0');
          formattedStartDate = `${year}-${month}-${day}`;
        }
      } catch (error) {
        console.error('Error formatting start date:', error);
      }
    }
    
    if (project.endDate) {
      try {
        const endDate = new Date(project.endDate);
        if (!isNaN(endDate.getTime())) {
          const year = endDate.getFullYear();
          const month = String(endDate.getMonth() + 1).padStart(2, '0');
          const day = String(endDate.getDate()).padStart(2, '0');
          formattedEndDate = `${year}-${month}-${day}`;
        }
      } catch (error) {
        console.error('Error formatting end date:', error);
      }
    }
    
    setFormData({
      name: project.name || '',
      code: project.code || '',
      description: project.description || '',
      startDate: formattedStartDate,
      endDate: formattedEndDate,
      priority: project.priority || 'medium',
      status: project.status || 'active',
      teamId: project.teamId || '',
      members: project.members || []
    });
  };
  
  // ฟังก์ชันจัดการการเปลี่ยนแปลงของฟอร์ม
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'select-multiple') {
      const options = e.target.options;
      const selectedValues = [];
      for (let i = 0; i < options.length; i++) {
        if (options[i].selected) {
          selectedValues.push(options[i].value);
        }
      }
      setFormData(prev => ({ ...prev, [name]: selectedValues }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // ลบข้อผิดพลาดสำหรับฟิลด์นี้ถ้ามี
    if (formError[name]) {
      setFormError(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // ฟังก์ชันสำหรับการสร้างโปรเจคใหม่
  const addProject = async () => {
    setFormLoading(true);
    setFormError({});
    
    try {
      // ตรวจสอบความถูกต้องของข้อมูล
      const errors = {};
      
      if (!formData.name.trim()) {
        errors.name = 'กรุณาระบุชื่อโปรเจค';
      }
      
      if (!formData.code.trim()) {
        errors.code = 'กรุณาระบุรหัสโปรเจค';
      }
      
      if (Object.keys(errors).length > 0) {
        setFormError(errors);
        return null;
      }
      
      // เตรียมข้อมูลสำหรับส่งไป API
      const projectData = {
        ...formData,
        // แปลงวันที่เป็นรูปแบบที่ API ต้องการ
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
      };
      
      // ส่งข้อมูลไปสร้างโปรเจคใหม่
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'เกิดข้อผิดพลาดในการสร้างโปรเจค');
      }
      
      toast.success('สร้างโปรเจคใหม่สำเร็จ');
      return result.data;
    } catch (error) {
      console.error('Error adding project:', error);
      toast.error(error.message || 'เกิดข้อผิดพลาดในการสร้างโปรเจค');
      setFormError({ general: error.message || 'เกิดข้อผิดพลาดในการสร้างโปรเจค' });
      return null;
    } finally {
      setFormLoading(false);
    }
  };
  
  // ฟังก์ชันสำหรับการอัปเดตโปรเจค
  const updateProject = async (projectId) => {
    setFormLoading(true);
    setFormError({});
    
    try {
      // ตรวจสอบความถูกต้องของข้อมูล
      const errors = {};
      
      if (!formData.name.trim()) {
        errors.name = 'กรุณาระบุชื่อโปรเจค';
      }
      
      if (!formData.code.trim()) {
        errors.code = 'กรุณาระบุรหัสโปรเจค';
      }
      
      if (Object.keys(errors).length > 0) {
        setFormError(errors);
        return null;
      }
      
      // เตรียมข้อมูลสำหรับส่งไป API
      const projectData = {
        ...formData,
        // แปลงวันที่เป็นรูปแบบที่ API ต้องการ
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
      };
      
      // ส่งข้อมูลไปอัปเดตโปรเจค
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'เกิดข้อผิดพลาดในการอัปเดตโปรเจค');
      }
      
      toast.success('อัปเดตโปรเจคสำเร็จ');
      return result.data;
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error(error.message || 'เกิดข้อผิดพลาดในการอัปเดตโปรเจค');
      setFormError({ general: error.message || 'เกิดข้อผิดพลาดในการอัปเดตโปรเจค' });
      return null;
    } finally {
      setFormLoading(false);
    }
  };
  
  return {
    formData,
    formError,
    formLoading,
    resetForm,
    setProjectToForm,
    handleFormChange,
    addProject,
    updateProject
  };
} 