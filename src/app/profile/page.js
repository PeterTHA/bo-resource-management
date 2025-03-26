'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FiUser, FiLock, FiMail, FiInfo, FiSave, FiArrowLeft, FiUpload, FiX, FiCalendar, FiBriefcase, FiRefreshCw } from 'react-icons/fi';
import { LoadingPage, LoadingButton } from '../../components/ui/LoadingSpinner';
import ErrorMessage from '../../components/ui/ErrorMessage';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [employee, setEmployee] = useState(null);
  const [teams, setTeams] = useState([]);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    position: '',
    department: '',
    teamId: '',
    hireDate: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
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
          setEmployee(data.data);
          
          // แปลง hireDate ให้ถูกต้อง
          let formattedHireDate = '';
          try {
            if (data.data.hireDate) {
              const hireDate = new Date(data.data.hireDate);
              formattedHireDate = hireDate.toISOString().split('T')[0];
            }
          } catch (error) {
            console.error('Error formatting hire date:', error);
          }
          
          setFormData({
            firstName: data.data.firstName || '',
            lastName: data.data.lastName || '',
            email: data.data.email || '',
            position: data.data.position || '',
            department: data.data.department || '',
            teamId: data.data.teamId || '',
            hireDate: formattedHireDate,
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          });
          
          // ตั้งค่าภาพตัวอย่างถ้ามีรูปภาพ
          if (data.data.image) {
            setImagePreview(data.data.image);
          }

          // ดึงข้อมูลทีม
          fetchTeams();
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
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        position: formData.position,
        department: formData.department,
        teamId: formData.teamId,
        hireDate: formData.hireDate,
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
        setSuccess('อัปเดตข้อมูลส่วนตัวเรียบร้อยแล้ว');
        setEmployee(data.data);
      } else {
        setError(data.message || 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
      console.error(error);
    } finally {
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

    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/employees/${session.user.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(`รีเซ็ตรหัสผ่านเรียบร้อยแล้ว รหัสผ่านใหม่คือ: ${data.password}`);
      } else {
        setError(data.message || 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน');
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
      console.error(error);
    } finally {
      setUpdating(false);
    }
  };

  // แสดงค่า role เป็นภาษาไทย
  const getRoleDisplay = (role) => {
    switch (role) {
      case 'admin':
        return 'ผู้ดูแลระบบ';
      case 'manager':
        return 'ผู้จัดการ';
      case 'employee':
        return 'พนักงาน';
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
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="relative mb-2 sm:mb-0">
              {imagePreview ? (
                <div className="relative h-24 w-24 rounded-full overflow-hidden border-4 border-purple-200 dark:border-purple-900">
                  <Image 
                    src={imagePreview} 
                    alt={`${employee.firstName} ${employee.lastName}`}
                    fill
                    sizes="96px"
                    className="object-cover" 
                  />
                </div>
              ) : (
                <div className="h-24 w-24 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center border-4 border-purple-200 dark:border-purple-900">
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
              <p className="text-gray-600 dark:text-gray-400">{employee.position}</p>
              <div className="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
                <span className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                  {employee.department}
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
              <div className="flex flex-col items-center gap-4">
                {imagePreview ? (
                  <div className="relative h-28 w-28 rounded-full overflow-hidden">
                    <Image 
                      src={imagePreview} 
                      alt="Profile preview" 
                      fill
                      sizes="112px"
                      className="object-cover" 
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full inline-flex items-center justify-center"
                      title="ลบรูปภาพ"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="h-28 w-28 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <FiUser size={40} className="text-gray-400 dark:text-gray-500" />
                  </div>
                )}
                
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-gray-700 dark:text-gray-200 font-medium mb-2">
                    ชื่อ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="lastName" className="block text-gray-700 dark:text-gray-200 font-medium mb-2">
                    นามสกุล <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-gray-700 dark:text-gray-200 font-medium mb-2">
                    อีเมล <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="position" className="block text-gray-700 dark:text-gray-200 font-medium mb-2">
                    ตำแหน่ง <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="position"
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="department" className="block text-gray-700 dark:text-gray-200 font-medium mb-2">
                    แผนก <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="employeeId" className="block text-gray-700 dark:text-gray-200 font-medium mb-2">
                    รหัสพนักงาน
                  </label>
                  <input
                    type="text"
                    id="employeeId"
                    name="employeeId"
                    value={employee?.employeeId || ''}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-gray-100"
                    disabled
                  />
                </div>

                <div>
                  <label htmlFor="hireDate" className="block text-gray-700 dark:text-gray-200 font-medium mb-2">
                    วันที่เริ่มงาน
                  </label>
                  <input
                    type="date"
                    id="hireDate"
                    name="hireDate"
                    value={formData.hireDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label htmlFor="teamId" className="block text-gray-700 dark:text-gray-200 font-medium mb-2">
                    ทีม
                  </label>
                  <select
                    id="teamId"
                    name="teamId"
                    value={formData.teamId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">-- เลือกทีม --</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
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