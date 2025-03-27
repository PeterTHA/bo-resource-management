'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FiUser, FiLock, FiMail, FiInfo, FiSave, FiArrowLeft, FiUpload, FiX, FiCalendar, FiBriefcase, FiRefreshCw } from 'react-icons/fi';
import { LoadingPage, LoadingButton } from '../../components/ui/LoadingSpinner';
import ErrorMessage from '../../components/ui/ErrorMessage';

// เพิ่มฟังก์ชันตรวจสอบว่าเป็นรูปภาพจาก mock-images หรือไม่
const isMockImage = (src) => {
  return src && typeof src === 'string' && (src.startsWith('/mock-images/') || src.startsWith('./mock-images/'));
};

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [employee, setEmployee] = useState(null);
  const [teams, setTeams] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [positionLevels, setPositionLevels] = useState([]);
  const [formData, setFormData] = useState({
    employeeId: '',
    firstName: '',
    lastName: '',
    email: '',
    position: '',
    positionLevel: '',
    positionTitle: '',
    departmentId: '',
    teamId: '',
    hireDate: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    gender: 'male',
    birthDate: '',
    phoneNumber: '',
    role: '',
    status: true,
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('info');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (!session) return;

      try {
        const res = await fetch(`/api/employees/${session.user.id}`);
        const data = await res.json();

        if (data.success) {
          const employeeData = data.data || data;
          console.log('Employee data from API:', employeeData);
          
          // แปลง hireDate ให้ถูกต้อง
          let formattedHireDate = '';
          try {
            if (employeeData.hireDate) {
              const hireDate = new Date(employeeData.hireDate);
              formattedHireDate = hireDate.toISOString().split('T')[0];
            }
          } catch (error) {
            console.error('Error formatting hire date:', error);
          }
          
          // แปลง birthDate ให้ถูกต้อง
          let formattedBirthDate = '';
          try {
            if (employeeData.birthDate) {
              const birthDate = new Date(employeeData.birthDate);
              formattedBirthDate = birthDate.toISOString().split('T')[0];
            }
          } catch (error) {
            console.error('Error formatting birth date:', error);
          }
          
          console.log('API Response (Position):', employeeData.position);
          console.log('API Response (PositionLevel):', employeeData.positionLevel);
          
          // ตรวจสอบรูปแบบของตำแหน่งและระดับตำแหน่ง
          let positionValue = '';
          let positionLevelValue = '';
          let positionName = '';
          let positionLevelName = '';
          
          if (employeeData.position) {
            if (typeof employeeData.position === 'object') {
              positionValue = employeeData.position.id || employeeData.position.code || '';
              positionName = employeeData.position.name || '';
              console.log('Position is object, using ID/code:', positionValue, 'Name:', positionName);
            } else {
              positionValue = employeeData.position;
              console.log('Position is not object, using value:', positionValue);
            }
          }
          
          if (employeeData.positionLevel) {
            if (typeof employeeData.positionLevel === 'object') {
              positionLevelValue = employeeData.positionLevel.id || employeeData.positionLevel.code || '';
              positionLevelName = employeeData.positionLevel.name || '';
              console.log('PositionLevel is object, using ID/code:', positionLevelValue, 'Name:', positionLevelName);
            } else {
              positionLevelValue = employeeData.positionLevel;
              console.log('PositionLevel is not object, using value:', positionLevelValue);
            }
          }
          
          // เก็บข้อมูลพนักงานพร้อมข้อมูลเพิ่มเติมสำหรับการแสดงผล
          setEmployee({
            ...employeeData,
            _positionName: positionName,  // เก็บชื่อตำแหน่งไว้เป็นข้อมูลพิเศษ
            _positionLevelName: positionLevelName  // เก็บชื่อระดับตำแหน่งไว้เป็นข้อมูลพิเศษ
          });
          
          setFormData({
            employeeId: employeeData.employeeId || '',
            firstName: employeeData.firstName || '',
            lastName: employeeData.lastName || '',
            email: employeeData.email || '',
            position: positionValue,
            positionLevel: positionLevelValue,
            positionTitle: employeeData.positionTitle || '',
            departmentId: typeof employeeData.department === 'object' ? employeeData.department?.id : employeeData.departmentId || '',
            teamId: typeof employeeData.team === 'object' ? employeeData.team?.id : employeeData.teamId || '',
            hireDate: formattedHireDate,
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
            gender: employeeData.gender || 'male',
            birthDate: formattedBirthDate,
            phoneNumber: employeeData.phoneNumber || '',
            role: employeeData.role || '',
            status: employeeData.status !== undefined ? employeeData.status : true,
          });
          
          // ตั้งค่าภาพตัวอย่างถ้ามีรูปภาพ
          if (employeeData.image) {
            console.log('Profile image from API:', employeeData.image);
            setImagePreview(employeeData.image);
          } else {
            console.log('No profile image available');
            setImagePreview(null);
          }

          // ดึงข้อมูลทีมและแผนก
          fetchTeams();
          fetchDepartments();
          fetchPositions();
          fetchPositionLevels();
        } else {
          setError(data.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลพนักงาน');
        }
      } catch (error) {
        setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    // เพิ่มฟังก์ชันดึงข้อมูลทีม
    const fetchTeams = async () => {
      try {
        const res = await fetch('/api/teams');
        const data = await res.json();
        
        if (data.success) {
          setTeams(data.data || []);
        } else {
          console.error('Error fetching teams:', data.message);
        }
      } catch (error) {
        console.error('Error fetching teams:', error);
      }
    };

    // เพิ่มฟังก์ชันดึงข้อมูลแผนก
    const fetchDepartments = async () => {
      try {
        const res = await fetch('/api/departments');
        const data = await res.json();
        
        if (data.success) {
          setDepartments(data.data || []);
        } else {
          console.error('Error fetching departments:', data.message);
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
      }
    };

    // เพิ่มฟังก์ชันดึงข้อมูลตำแหน่ง
    const fetchPositions = async () => {
      try {
        const res = await fetch('/api/positions');
        const data = await res.json();
        
        console.log('Positions API Response:', data);
        
        if (data.success && Array.isArray(data.data)) {
          setPositions(data.data);
        } else if (Array.isArray(data)) {
          setPositions(data);
        } else {
          console.error('Error fetching positions: Invalid data format', data);
          // กำหนดข้อมูลพื้นฐานสำหรับกรณีที่ API ไม่ส่งข้อมูลกลับมา
          setPositions([
            { id: '1', code: 'BackendDeveloper', name: 'Backend Developer' },
            { id: '2', code: 'FrontendDeveloper', name: 'Frontend Developer' },
            { id: '3', code: 'FullstackDeveloper', name: 'Fullstack Developer' },
            { id: '4', code: 'ProductManager', name: 'Product Manager' },
            { id: '5', code: 'ProjectManager', name: 'Project Manager' }
          ]);
        }
        
        // หลังจากดึงข้อมูลตำแหน่งแล้ว ให้อัปเดต employee ถ้ามีข้อมูล position แต่ไม่มีชื่อ
        if (employee && formData.position && !employee._positionName) {
          const foundPosition = positions.find(p => p.id === formData.position || p.code === formData.position);
          if (foundPosition) {
            setEmployee(prev => ({
              ...prev,
              _positionName: foundPosition.name
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching positions:', error);
        // กำหนดข้อมูลพื้นฐานสำหรับกรณีที่ API ไม่ส่งข้อมูลกลับมา
        setPositions([
          { id: '1', code: 'BackendDeveloper', name: 'Backend Developer' },
          { id: '2', code: 'FrontendDeveloper', name: 'Frontend Developer' },
          { id: '3', code: 'FullstackDeveloper', name: 'Fullstack Developer' },
          { id: '4', code: 'ProductManager', name: 'Product Manager' },
          { id: '5', code: 'ProjectManager', name: 'Project Manager' }
        ]);
      }
    };

    // เพิ่มฟังก์ชันดึงข้อมูลระดับตำแหน่ง
    const fetchPositionLevels = async () => {
      try {
        const res = await fetch('/api/position-levels');
        const data = await res.json();
        
        console.log('Position Levels API Response:', data);
        
        if (data.success && Array.isArray(data.data)) {
          setPositionLevels(data.data);
        } else if (Array.isArray(data)) {
          setPositionLevels(data);
        } else {
          console.error('Error fetching position levels: Invalid data format', data);
          // กำหนดข้อมูลพื้นฐานสำหรับกรณีที่ API ไม่ส่งข้อมูลกลับมา
          setPositionLevels([
            { id: '1', code: 'Junior', name: 'Junior' },
            { id: '2', code: 'Middle', name: 'Middle' },
            { id: '3', code: 'Senior', name: 'Senior' },
            { id: '4', code: 'Lead', name: 'Lead' },
            { id: '5', code: 'Manager', name: 'Manager' }
          ]);
        }
        
        // หลังจากดึงข้อมูลระดับตำแหน่งแล้ว ให้อัปเดต employee ถ้ามีข้อมูล positionLevel แต่ไม่มีชื่อ
        if (employee && formData.positionLevel && !employee._positionLevelName) {
          const foundLevel = positionLevels.find(p => p.id === formData.positionLevel || p.code === formData.positionLevel);
          if (foundLevel) {
            setEmployee(prev => ({
              ...prev,
              _positionLevelName: foundLevel.name
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching position levels:', error);
        // กำหนดข้อมูลพื้นฐานสำหรับกรณีที่ API ไม่ส่งข้อมูลกลับมา
        setPositionLevels([
          { id: '1', code: 'Junior', name: 'Junior' },
          { id: '2', code: 'Middle', name: 'Middle' },
          { id: '3', code: 'Senior', name: 'Senior' },
          { id: '4', code: 'Lead', name: 'Lead' },
          { id: '5', code: 'Manager', name: 'Manager' }
        ]);
      }
    };

    if (session) {
      fetchEmployeeData();
    }
  }, [session]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // จัดการการอัปโหลดรูปภาพ
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // ตรวจสอบประเภทไฟล์
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น (JPEG, PNG, GIF, WEBP)');
      return;
    }

    // ตรวจสอบขนาดไฟล์ (6MB)
    const maxSize = 6 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('ขนาดไฟล์ต้องไม่เกิน 6 MB');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError('');
  };

  // ลบรูปภาพที่เลือก
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  // อัปโหลดรูปภาพไปยัง API
  const uploadImage = async () => {
    if (!imageFile) return null;

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('file', imageFile);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        return data.url;
      } else {
        setError(data.message || 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
        return null;
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
      console.error('Error uploading image:', error);
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      // อัปโหลดรูปภาพถ้ามี
      let imageUrl = employee?.image || null;
      if (imageFile) {
        imageUrl = await uploadImage();
        if (!imageUrl && imageFile) {
          setUpdating(false);
          return;
        }
      }

      const dataToSend = {
        employeeId: formData.employeeId,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        position: formData.position,
        positionLevel: formData.positionLevel,
        positionTitle: formData.positionTitle,
        departmentId: formData.departmentId,
        teamId: formData.teamId,
        hireDate: formData.hireDate,
        gender: formData.gender,
        birthDate: formData.birthDate,
        phoneNumber: formData.phoneNumber,
        role: formData.role,
        status: formData.status,
        image: imageUrl,
      };

      const res = await fetch(`/api/employees/${session.user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      const data = await res.json();

      if (data.success) {
        const updatedEmployee = data.data;
        setEmployee(updatedEmployee);
        setSuccess('อัปเดตข้อมูลส่วนตัวเรียบร้อยแล้ว');
      } else {
        setError(data.message || 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
      console.error(error);
    } finally {
      setUploadingImage(false);
      setUpdating(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError('');
    setSuccess('');

    // ตรวจสอบรหัสผ่านใหม่
    if (formData.newPassword !== formData.confirmPassword) {
      setError('รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน');
      setUpdating(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      setUpdating(false);
      return;
    }

    try {
      const res = await fetch(`/api/employees/${session.user.id}/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess('เปลี่ยนรหัสผ่านเรียบร้อยแล้ว');
        setFormData((prev) => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }));
      } else {
        setError(data.message || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
      console.error(error);
    } finally {
      setUpdating(false);
    }
  };

  // ฟังก์ชันรีเซ็ตรหัสผ่าน (สำหรับ admin เท่านั้น)
  const handleResetPassword = async () => {
    if (session.user.role !== 'admin') {
      setError('คุณไม่มีสิทธิ์ในการรีเซ็ตรหัสผ่าน');
      return;
    }

    if (!employee || !employee.id) {
      setError('ไม่พบข้อมูลพนักงาน');
      return;
    }

    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      console.log(`กำลังรีเซ็ตรหัสผ่านสำหรับพนักงาน ID: ${employee.id}`);

      const res = await fetch(`/api/employees/${employee.id}/reset-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('API Error Response:', errorText);
        throw new Error(`API responded with status ${res.status}: ${errorText || 'No response body'}`);
      }

      const data = await res.json();

      if (data.success) {
        setSuccess(`รีเซ็ตรหัสผ่านเรียบร้อยแล้ว ${data.emailSent ? 'และได้ส่งอีเมลรหัสผ่านใหม่ให้ผู้ใช้แล้ว' : 'แต่ไม่สามารถส่งอีเมลได้'}`);
      } else {
        setError(data.message || data.error || 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน');
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์: ' + error.message);
      console.error('Reset password error:', error);
    } finally {
      setUpdating(false);
    }
  };

  // แสดงค่า role เป็นภาษาไทย
  const getRoleDisplay = (role) => {
    switch (role) {
      case 'admin':
        return 'ผู้ดูแลระบบ';
      case 'supervisor':
        return 'หัวหน้างาน';
      case 'permanent':
        return 'พนักงานประจำ';
      case 'temporary':
        return 'พนักงานชั่วคราว';
      default:
        return role;
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingPage message="กำลังโหลดข้อมูลโปรไฟล์..." />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
          <FiUser className="mr-2 text-purple-600 dark:text-purple-400" /> โปรไฟล์ของฉัน
        </h1>
        <Link
          href="/dashboard"
          className="btn btn-outline btn-sm border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 inline-flex items-center justify-center"
        >
          <FiArrowLeft className="mr-1.5 h-4 w-4" />
          <span>กลับ</span>
        </Link>
      </div>

      {error && <ErrorMessage message={error} type="error" />}
      {success && <ErrorMessage message={success} type="success" />}

      {employee && (
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100/50 dark:bg-purple-900/20 rounded-bl-full -translate-y-8 translate-x-8"></div>
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
            <div className="relative mb-2 sm:mb-0">
              {imagePreview ? (
                <div className="relative h-28 w-28 rounded-full overflow-hidden border-4 border-purple-200 dark:border-purple-900 shadow-md">
                  <Image 
                    src={imagePreview} 
                    alt={`${employee.firstName} ${employee.lastName}`}
                    fill
                    sizes="112px"
                    className="object-cover" 
                    unoptimized={isMockImage(imagePreview)}
                  />
                </div>
              ) : (
                <div className="h-28 w-28 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center border-4 border-purple-200 dark:border-purple-900 shadow-md">
                  <span className="text-purple-600 dark:text-purple-400 text-3xl font-medium">
                    {employee.firstName?.charAt(0) || ''}{employee.lastName?.charAt(0) || ''}
                  </span>
                </div>
              )}
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {employee.firstName} {employee.lastName}
              </h2>
              
              <div className="mt-2 mb-3">
                {/* ชื่อตำแหน่งที่แสดง */}
                {formData.positionTitle ? (
                  <div className="inline-flex items-center px-3 py-1.5 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 rounded-lg text-base font-medium">
                    <FiBriefcase className="mr-1.5 h-4 w-4" />
                    <span>{formData.positionTitle}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {/* ตำแหน่ง */}
                    {(employee._positionName || (typeof employee.position === 'object' && employee.position.name)) && (
                      <div className="inline-flex items-center px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg text-base font-medium">
                        <FiBriefcase className="mr-1.5 h-4 w-4" />
                        <span>
                          {employee._positionName || (typeof employee.position === 'object' ? employee.position.name : '')}
                        </span>
                      </div>
                    )}
                    
                    {/* ระดับตำแหน่ง */}
                    {(employee._positionLevelName || (typeof employee.positionLevel === 'object' && employee.positionLevel.name)) && (
                      <div className="inline-flex items-center px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-lg text-base font-medium">
                        <span>
                          {employee._positionLevelName || (typeof employee.positionLevel === 'object' ? employee.positionLevel?.name : '')}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
                <span className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                  {typeof employee.department === 'object' ? employee.department.name : employee.department}
                </span>
                <span className="px-2 py-1 text-xs rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                  {getRoleDisplay(employee.role)}
                </span>
                <span className="px-2 py-1 text-xs rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300">
                  {employee.employeeId}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4">
        <div className="border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('info')}
              className={`mr-1 py-2 px-4 font-medium text-sm rounded-t-lg transition-colors duration-300 inline-flex items-center ${
                activeTab === 'info'
                  ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-b-2 border-purple-500 dark:border-purple-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <FiUser className="mr-1.5 h-4 w-4" /> <span>ข้อมูลส่วนตัว</span>
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`mr-1 py-2 px-4 font-medium text-sm rounded-t-lg transition-colors duration-300 inline-flex items-center ${
                activeTab === 'password'
                  ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-b-2 border-purple-500 dark:border-purple-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <FiLock className="mr-1.5 h-4 w-4" /> <span>เปลี่ยนรหัสผ่าน</span>
            </button>
          </nav>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/30 transition-colors duration-300">
        {activeTab === 'info' && (
          <form onSubmit={handleUpdateProfile} className="p-6">
            <div className="space-y-6">
              {/* รูปโปรไฟล์ */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative h-28 w-28 rounded-full overflow-hidden mb-4">
                  {imagePreview ? (
                    <Image 
                      src={imagePreview} 
                      alt="รูปโปรไฟล์" 
                      width={112} 
                      height={112}
                      className="object-cover rounded-full"
                      unoptimized={isMockImage(imagePreview)}
                    />
                  ) : (
                    <div className="h-28 w-28 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <FiUser size={40} className="text-gray-400 dark:text-gray-500" />
                    </div>
                  )}
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-1 right-1 bg-red-500 rounded-full p-1 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <FiX size={14} />
                    </button>
                  )}
                </div>
              
                <div className="flex items-center justify-center w-full">
                  <label className="btn btn-outline border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer inline-flex items-center justify-center">
                    <FiUpload className="mr-1.5 h-4 w-4" />
                    <span>{imageFile ? 'เปลี่ยนรูปภาพ' : 'อัปโหลดรูปภาพ'}</span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handleImageChange}
                    />
                  </label>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">รองรับไฟล์ JPG, PNG, GIF และ WEBP ขนาดไม่เกิน 6 MB</p>
              </div>
              
              {/* ข้อมูลพื้นฐาน */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* รหัสพนักงาน */}
                <div className="mb-6">
                  <label htmlFor="employeeId" className="block text-gray-700 dark:text-gray-200 font-semibold mb-2 border-l-4 border-blue-500 pl-2 py-0.5">
                    รหัสพนักงาน
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="employeeId"
                      name="employeeId"
                      value={formData.employeeId}
                      onChange={handleChange}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div className="mt-2 py-3 px-4 bg-gradient-to-r from-blue-50 to-white dark:from-gray-800 dark:to-gray-750 rounded-md border border-blue-200 dark:border-blue-900/40 shadow-sm">
                    <div className="flex items-center">
                      <div className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium">
                        <FiUser className="mr-1 h-3 w-3" />
                        <span>รหัสพนักงานปัจจุบัน</span>
                      </div>
                    </div>
                    <span className="block text-base font-medium text-gray-900 dark:text-gray-100 mt-1.5 pl-3">
                      {formData.employeeId || 'ไม่มีข้อมูลรหัสพนักงาน'}
                    </span>
                  </div>
                </div>
                
                {/* อีเมล */}
                <div className="mb-6">
                  <label htmlFor="email" className="block text-gray-700 dark:text-gray-200 font-semibold mb-2 border-l-4 border-green-500 pl-2 py-0.5">
                    อีเมล <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      required
                    />
                  </div>
                  <div className="mt-2 py-3 px-4 bg-gradient-to-r from-green-50 to-white dark:from-gray-800 dark:to-gray-750 rounded-md border border-green-200 dark:border-green-900/40 shadow-sm">
                    <div className="flex items-center">
                      <div className="inline-flex items-center px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm font-medium">
                        <FiMail className="mr-1 h-3 w-3" />
                        <span>อีเมลใช้งาน</span>
                      </div>
                    </div>
                    <span className="block text-base font-medium text-gray-900 dark:text-gray-100 mt-1.5 pl-3">
                      {formData.email || 'ไม่มีข้อมูลอีเมล'}
                    </span>
                  </div>
                </div>
                
                {/* ชื่อ */}
                <div className="mb-6">
                  <label htmlFor="firstName" className="block text-gray-700 dark:text-gray-200 font-semibold mb-2 border-l-4 border-amber-500 pl-2 py-0.5">
                    ชื่อ <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      required
                    />
                  </div>
                  <div className="mt-2 py-3 px-4 bg-gradient-to-r from-amber-50 to-white dark:from-gray-800 dark:to-gray-750 rounded-md border border-amber-200 dark:border-amber-900/40 shadow-sm">
                    <div className="flex items-center">
                      <div className="inline-flex items-center px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-lg text-sm font-medium">
                        <FiUser className="mr-1 h-3 w-3" />
                        <span>ชื่อปัจจุบัน</span>
                      </div>
                    </div>
                    <span className="block text-base font-medium text-gray-900 dark:text-gray-100 mt-1.5 pl-3">
                      {formData.firstName || 'ไม่มีข้อมูลชื่อ'}
                    </span>
                  </div>
                </div>
                
                {/* นามสกุล */}
                <div className="mb-6">
                  <label htmlFor="lastName" className="block text-gray-700 dark:text-gray-200 font-semibold mb-2 border-l-4 border-orange-500 pl-2 py-0.5">
                    นามสกุล <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      required
                    />
                  </div>
                  <div className="mt-2 py-3 px-4 bg-gradient-to-r from-orange-50 to-white dark:from-gray-800 dark:to-gray-750 rounded-md border border-orange-200 dark:border-orange-900/40 shadow-sm">
                    <div className="flex items-center">
                      <div className="inline-flex items-center px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-lg text-sm font-medium">
                        <FiUser className="mr-1 h-3 w-3" />
                        <span>นามสกุลปัจจุบัน</span>
                      </div>
                    </div>
                    <span className="block text-base font-medium text-gray-900 dark:text-gray-100 mt-1.5 pl-3">
                      {formData.lastName || 'ไม่มีข้อมูลนามสกุล'}
                    </span>
                  </div>
                </div>
                
                {/* ตำแหน่ง */}
                <div className="mb-6">
                  <label htmlFor="position" className="block text-gray-700 dark:text-gray-200 font-semibold mb-2 border-l-4 border-purple-500 pl-2 py-0.5">
                    ตำแหน่ง
                  </label>
                  <div className="relative">
                    <select
                      id="position"
                      name="position"
                      value={formData.position || ''}
                      onChange={handleChange}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
                    >
                      <option value="">-- เลือกตำแหน่ง --</option>
                      {positions.map((position) => (
                        <option key={position.id || position.code || Math.random()} value={position.id || position.code}>
                          {position.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mt-2 py-3 px-4 bg-gradient-to-r from-purple-50 to-white dark:from-gray-800 dark:to-gray-750 rounded-md border border-purple-200 dark:border-purple-900/40 shadow-sm">
                    <div className="flex items-center">
                      <div className="inline-flex items-center px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-sm font-medium">
                        <FiBriefcase className="mr-1 h-3 w-3" />
                        <span>ตำแหน่งปัจจุบัน</span>
                      </div>
                    </div>
                    <span className="block text-base font-medium text-gray-900 dark:text-gray-100 mt-1.5 pl-3">
                      {employee?._positionName || 
                        positions.find(p => p.id === formData.position || p.code === formData.position)?.name || 
                        (typeof employee?.position === 'object' ? employee?.position?.name : '') || 
                        'ไม่มีข้อมูลตำแหน่ง'}
                    </span>
                  </div>
                </div>
                
                {/* ระดับตำแหน่ง */}
                <div className="mb-6">
                  <label htmlFor="positionLevel" className="block text-gray-700 dark:text-gray-200 font-semibold mb-2 border-l-4 border-indigo-500 pl-2 py-0.5">
                    ระดับตำแหน่ง
                  </label>
                  <div className="relative">
                    <select
                      id="positionLevel"
                      name="positionLevel"
                      value={formData.positionLevel || ''}
                      onChange={handleChange}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
                    >
                      <option value="">-- เลือกระดับตำแหน่ง --</option>
                      {positionLevels.map((level) => (
                        <option key={level.id || level.code || Math.random()} value={level.id || level.code}>
                          {level.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mt-2 py-3 px-4 bg-gradient-to-r from-indigo-50 to-white dark:from-gray-800 dark:to-gray-750 rounded-md border border-indigo-200 dark:border-indigo-900/40 shadow-sm">
                    <div className="flex items-center">
                      <div className="inline-flex items-center px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm font-medium">
                        <span>ระดับตำแหน่งปัจจุบัน</span>
                      </div>
                    </div>
                    <span className="block text-base font-medium text-gray-900 dark:text-gray-100 mt-1.5 pl-3">
                      {employee?._positionLevelName || 
                        positionLevels.find(p => p.id === formData.positionLevel || p.code === formData.positionLevel)?.name || 
                        (typeof employee?.positionLevel === 'object' ? employee?.positionLevel?.name : '') || 
                        'ไม่มีข้อมูลระดับตำแหน่ง'}
                    </span>
                  </div>
                </div>
                
                {/* ชื่อตำแหน่งที่แสดง */}
                <div className="mb-6">
                  <label htmlFor="positionTitle" className="block text-gray-700 dark:text-gray-200 font-semibold mb-2 border-l-4 border-teal-500 pl-2 py-0.5">
                    ชื่อตำแหน่งที่แสดง
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="positionTitle"
                      name="positionTitle"
                      value={formData.positionTitle}
                      onChange={handleChange}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div className="mt-2 py-3 px-4 bg-gradient-to-r from-teal-50 to-white dark:from-gray-800 dark:to-gray-750 rounded-md border border-teal-200 dark:border-teal-900/40 shadow-sm">
                    <div className="flex items-center">
                      <div className="inline-flex items-center px-2 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded-lg text-sm font-medium">
                        <FiInfo className="mr-1 h-3 w-3" />
                        <span>คำอธิบาย</span>
                      </div>
                    </div>
                    <span className="block text-base font-medium text-gray-900 dark:text-gray-100 mt-1.5 pl-3">
                      {formData.positionTitle ? 
                        'ชื่อตำแหน่งนี้จะแสดงแทนตำแหน่งและระดับตำแหน่งในหน้าโปรไฟล์' : 
                        'คุณสามารถกำหนดชื่อตำแหน่งที่แสดงเพื่อใช้แทนการแสดงตำแหน่งและระดับตำแหน่ง'}
                    </span>
                  </div>
                </div>
                
                {/* เพศ */}
                <div className="mb-6">
                  <label htmlFor="gender" className="block text-gray-700 dark:text-gray-200 font-semibold mb-2 border-l-4 border-pink-500 pl-2 py-0.5">
                    เพศ <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      required
                    >
                      <option value="male">ชาย</option>
                      <option value="female">หญิง</option>
                      <option value="other">อื่นๆ</option>
                    </select>
                  </div>
                  <div className="mt-2 py-3 px-4 bg-gradient-to-r from-pink-50 to-white dark:from-gray-800 dark:to-gray-750 rounded-md border border-pink-200 dark:border-pink-900/40 shadow-sm">
                    <div className="flex items-center">
                      <div className="inline-flex items-center px-2 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded-lg text-sm font-medium">
                        <FiInfo className="mr-1 h-3 w-3" />
                        <span>เพศปัจจุบัน</span>
                      </div>
                    </div>
                    <span className="block text-base font-medium text-gray-900 dark:text-gray-100 mt-1.5 pl-3">
                      {formData.gender === 'male' ? 'ชาย' : formData.gender === 'female' ? 'หญิง' : 'อื่นๆ'}
                    </span>
                  </div>
                </div>
                
                {/* วันเกิด */}
                <div className="mb-6">
                  <label htmlFor="birthDate" className="block text-gray-700 dark:text-gray-200 font-semibold mb-2 border-l-4 border-red-500 pl-2 py-0.5">
                    วันเกิด
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      id="birthDate"
                      name="birthDate"
                      value={formData.birthDate}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div className="mt-2 py-3 px-4 bg-gradient-to-r from-red-50 to-white dark:from-gray-800 dark:to-gray-750 rounded-md border border-red-200 dark:border-red-900/40 shadow-sm">
                    <div className="flex items-center">
                      <div className="inline-flex items-center px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm font-medium">
                        <FiCalendar className="mr-1 h-3 w-3" />
                        <span>วันเกิดปัจจุบัน</span>
                      </div>
                    </div>
                    <span className="block text-base font-medium text-gray-900 dark:text-gray-100 mt-1.5 pl-3">
                      {formData.birthDate || 'ไม่มีข้อมูลวันเกิด'}
                    </span>
                  </div>
                </div>
                
                {/* เบอร์โทรศัพท์ */}
                <div className="mb-6">
                  <label htmlFor="phoneNumber" className="block text-gray-700 dark:text-gray-200 font-semibold mb-2 border-l-4 border-cyan-500 pl-2 py-0.5">
                    เบอร์โทรศัพท์
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      id="phoneNumber"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div className="mt-2 py-3 px-4 bg-gradient-to-r from-cyan-50 to-white dark:from-gray-800 dark:to-gray-750 rounded-md border border-cyan-200 dark:border-cyan-900/40 shadow-sm">
                    <div className="flex items-center">
                      <div className="inline-flex items-center px-2 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded-lg text-sm font-medium">
                        <FiInfo className="mr-1 h-3 w-3" />
                        <span>เบอร์โทรศัพท์ปัจจุบัน</span>
                      </div>
                    </div>
                    <span className="block text-base font-medium text-gray-900 dark:text-gray-100 mt-1.5 pl-3">
                      {formData.phoneNumber || 'ไม่มีข้อมูลเบอร์โทรศัพท์'}
                    </span>
                  </div>
                </div>
                
                {/* แผนก */}
                <div className="mb-6">
                  <label htmlFor="departmentId" className="block text-gray-700 dark:text-gray-200 font-semibold mb-2 border-l-4 border-emerald-500 pl-2 py-0.5">
                    แผนก
                  </label>
                  <div className="relative">
                    <select
                      id="departmentId"
                      name="departmentId"
                      value={formData.departmentId}
                      onChange={handleChange}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
                    >
                      <option value="">-- เลือกแผนก --</option>
                      {departments.map((department) => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mt-2 py-3 px-4 bg-gradient-to-r from-emerald-50 to-white dark:from-gray-800 dark:to-gray-750 rounded-md border border-emerald-200 dark:border-emerald-900/40 shadow-sm">
                    <div className="flex items-center">
                      <div className="inline-flex items-center px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg text-sm font-medium">
                        <FiBriefcase className="mr-1 h-3 w-3" />
                        <span>แผนกปัจจุบัน</span>
                      </div>
                    </div>
                    <span className="block text-base font-medium text-gray-900 dark:text-gray-100 mt-1.5 pl-3">
                      {departments.find(d => d.id === formData.departmentId)?.name || 
                        (typeof employee?.department === 'object' ? employee?.department?.name : '') || 
                        'ไม่มีข้อมูลแผนก'}
                    </span>
                  </div>
                </div>
                
                {/* ทีม */}
                <div className="mb-6">
                  <label htmlFor="teamId" className="block text-gray-700 dark:text-gray-200 font-semibold mb-2 border-l-4 border-blue-400 pl-2 py-0.5">
                    ทีม
                  </label>
                  <div className="relative">
                    <select
                      id="teamId"
                      name="teamId"
                      value={formData.teamId}
                      onChange={handleChange}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
                    >
                      <option value="">-- เลือกทีม --</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mt-2 py-3 px-4 bg-gradient-to-r from-blue-100 to-white dark:from-gray-800 dark:to-gray-750 rounded-md border border-blue-200 dark:border-blue-900/40 shadow-sm">
                    <div className="flex items-center">
                      <div className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium">
                        <FiInfo className="mr-1 h-3 w-3" />
                        <span>ทีมปัจจุบัน</span>
                      </div>
                    </div>
                    <span className="block text-base font-medium text-gray-900 dark:text-gray-100 mt-1.5 pl-3">
                      {teams.find(t => t.id === formData.teamId)?.name || 
                        (typeof employee?.team === 'object' ? employee?.team?.name : '') || 
                        'ไม่มีข้อมูลทีม'}
                    </span>
                  </div>
                </div>
                
                {/* วันที่เริ่มงาน */}
                <div className="mb-6">
                  <label htmlFor="hireDate" className="block text-gray-700 dark:text-gray-200 font-semibold mb-2 border-l-4 border-lime-500 pl-2 py-0.5">
                    วันที่เริ่มงาน
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      id="hireDate"
                      name="hireDate"
                      value={formData.hireDate}
                      onChange={handleChange}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
                    />
                  </div>
                  <div className="mt-2 py-3 px-4 bg-gradient-to-r from-lime-50 to-white dark:from-gray-800 dark:to-gray-750 rounded-md border border-lime-200 dark:border-lime-900/40 shadow-sm">
                    <div className="flex items-center">
                      <div className="inline-flex items-center px-2 py-1 bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-300 rounded-lg text-sm font-medium">
                        <FiCalendar className="mr-1 h-3 w-3" />
                        <span>วันที่เริ่มงานปัจจุบัน</span>
                      </div>
                    </div>
                    <span className="block text-base font-medium text-gray-900 dark:text-gray-100 mt-1.5 pl-3">
                      {formData.hireDate || 'ไม่มีข้อมูลวันที่เริ่มงาน'}
                    </span>
                  </div>
                </div>
                
                {/* บทบาท */}
                <div className="mb-6">
                  <label htmlFor="role" className="block text-gray-700 dark:text-gray-200 font-semibold mb-2 border-l-4 border-violet-500 pl-2 py-0.5">
                    บทบาท
                  </label>
                  <div className="relative">
                    <select
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
                    >
                      <option value="">-- เลือกบทบาท --</option>
                      <option value="permanent">พนักงานประจำ</option>
                      <option value="temporary">พนักงานชั่วคราว</option>
                      <option value="supervisor">หัวหน้างาน</option>
                      <option value="admin">ผู้ดูแลระบบ</option>
                    </select>
                  </div>
                  <div className="mt-2 py-3 px-4 bg-gradient-to-r from-violet-50 to-white dark:from-gray-800 dark:to-gray-750 rounded-md border border-violet-200 dark:border-violet-900/40 shadow-sm">
                    <div className="flex items-center">
                      <div className="inline-flex items-center px-2 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-lg text-sm font-medium">
                        <FiUser className="mr-1 h-3 w-3" />
                        <span>บทบาทปัจจุบัน</span>
                      </div>
                    </div>
                    <span className="block text-base font-medium text-gray-900 dark:text-gray-100 mt-1.5 pl-3">
                      {getRoleDisplay(formData.role) || 'ไม่มีข้อมูลบทบาท'}
                    </span>
                  </div>
                </div>
                
                {/* สถานะการทำงาน */}
                <div className="mb-6">
                  <label htmlFor="status" className="block text-gray-700 dark:text-gray-200 font-semibold mb-2 border-l-4 border-gray-500 pl-2 py-0.5">
                    สถานะการทำงาน
                  </label>
                  <div className="relative flex items-center mt-2">
                    <input
                      type="checkbox"
                      id="status"
                      name="status"
                      checked={formData.status}
                      onChange={handleChange}
                      disabled
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400 border-gray-300 dark:border-gray-600 rounded"
                    />
                    <label htmlFor="status" className="ml-2 text-gray-700 dark:text-gray-200">
                      ทำงานอยู่
                    </label>
                  </div>
                  <div className="mt-2 py-3 px-4 bg-gradient-to-r from-gray-100 to-white dark:from-gray-800 dark:to-gray-750 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center">
                      <div className="inline-flex items-center px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium">
                        <FiInfo className="mr-1 h-3 w-3" />
                        <span>สถานะปัจจุบัน</span>
                      </div>
                    </div>
                    <span className="block text-base font-medium text-gray-900 dark:text-gray-100 mt-1.5 pl-3">
                      {formData.status ? 'ทำงานอยู่' : 'ไม่ได้ทำงาน'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* ปุ่มบันทึก */}
              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                <LoadingButton
                  type="submit"
                  loading={updating || uploadingImage}
                  className="btn btn-primary w-full inline-flex items-center justify-center text-white"
                >
                  <FiSave className="mr-1.5 h-4 w-4" />
                  <span>{updating || uploadingImage ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}</span>
                </LoadingButton>
              </div>
            </div>
          </form>
        )}
        
        {activeTab === 'password' && (
          <form onSubmit={handleChangePassword} className="p-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-gray-700 dark:text-gray-200 font-medium mb-2">
                  รหัสผ่านปัจจุบัน <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="newPassword" className="block text-gray-700 dark:text-gray-200 font-medium mb-2">
                  รหัสผ่านใหม่ <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                  minLength={6}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร</p>
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-gray-700 dark:text-gray-200 font-medium mb-2">
                  ยืนยันรหัสผ่านใหม่ <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                  minLength={6}
                />
              </div>
              
              <div className="mt-6 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <LoadingButton
                    type="submit"
                    loading={updating}
                    className="btn btn-secondary inline-flex items-center justify-center text-white"
                  >
                    <FiLock className="mr-1.5 h-4 w-4" />
                    <span>{updating ? 'กำลังบันทึก...' : 'เปลี่ยนรหัสผ่าน'}</span>
                  </LoadingButton>
                  
                  {session.user.role === 'admin' && (
                    <LoadingButton
                      type="button"
                      onClick={handleResetPassword}
                      loading={updating}
                      className="btn btn-accent inline-flex items-center justify-center text-white"
                    >
                      <FiRefreshCw className="mr-1.5 h-4 w-4" />
                      <span>{updating ? 'กำลังรีเซ็ต...' : 'รีเซ็ตรหัสผ่าน'}</span>
                    </LoadingButton>
                  )}
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
} 