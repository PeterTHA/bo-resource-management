'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FiSave, FiArrowLeft, FiUpload, FiX, FiKey, FiUser, FiEdit2, FiLock } from 'react-icons/fi';
import { LoadingPage, LoadingButton } from '../../../../components/ui/LoadingSpinner';
import ErrorMessage from '../../../../components/ui/ErrorMessage';
import { use } from 'react';

export default function EditEmployeePage({ params }) {
  // ใช้ React.use เพื่อแกะ params promise
  const resolvedParams = use(params);
  const employeeId = resolvedParams.id;
  
  const { data: session, status } = useSession();
  const router = useRouter();
  const [formData, setFormData] = useState({
    employeeId: '',
    firstName: '',
    lastName: '',
    email: '',
    position: '',
    department: '',
    teamId: '',
    hireDate: '',
    role: 'employee',
    isActive: true,
    image: '',
  });
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // เรียกข้อมูลทีมเมื่อโหลดหน้า
  useEffect(() => {
    if (status === 'authenticated' && session.user.role === 'admin') {
      fetchTeams();
    }
  }, [status, session]);

  // ดึงข้อมูลทีมจาก API
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

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session.user.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        const res = await fetch(`/api/employees/${employeeId}`);
        const data = await res.json();
        
        if (data.success) {
          // แปลงข้อมูล
          const employee = data.data;
          
          // แปลง hireDate ให้ถูกต้องป้องกัน Invalid time value
          let formattedHireDate = '';
          try {
            if (employee.hireDate) {
              const hireDate = new Date(employee.hireDate);
              formattedHireDate = hireDate.toISOString().split('T')[0];
            }
          } catch (error) {
            console.error('Error formatting hire date:', error);
          }
          
          setFormData({
            employeeId: employee.employeeId,
            firstName: employee.firstName,
            lastName: employee.lastName,
            email: employee.email,
            position: employee.position,
            department: employee.department,
            teamId: employee.teamId || '',
            hireDate: formattedHireDate,
            role: employee.role,
            isActive: employee.isActive,
            image: employee.image || '',
          });
          
          // ตั้งค่าภาพตัวอย่างถ้ามีรูปภาพ
          if (employee.image) {
            setImagePreview(employee.image);
          }
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
    
    if (session && employeeId) {
      fetchEmployeeData();
    }
  }, [session, employeeId]);

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
    setFormData((prev) => ({
      ...prev,
      image: '',
    }));
  };

  // อัปโหลดรูปภาพไปยัง API
  const uploadImage = async () => {
    if (!imageFile) return formData.image;

    try {
      setUploadingImage(true);
      const formDataUpload = new FormData();
      formDataUpload.append('file', imageFile);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      const data = await res.json();
      setUploadingImage(false);

      if (data.success) {
        return data.url;
      } else {
        setError(data.message || 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
        return formData.image;
      }
    } catch (error) {
      setUploadingImage(false);
      setError('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
      console.error('Error uploading image:', error);
      return formData.image;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // อัปโหลดรูปภาพถ้ามี
      let imageUrl = formData.image;
      if (imageFile) {
        imageUrl = await uploadImage();
      }

      const dataToSend = {
        ...formData,
        image: imageUrl,
      };
      
      const res = await fetch(`/api/employees/${employeeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setSuccess('อัปเดตข้อมูลพนักงานเรียบร้อยแล้ว');
        setTimeout(() => {
          router.push('/employees');
        }, 2000);
      } else {
        setError(data.message || 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลพนักงาน');
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingPage message="กำลังโหลดข้อมูลพนักงาน..." />
      </div>
    );
  }

  if (!session || session.user.role !== 'admin') {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
          <FiEdit2 className="mr-2 text-purple-600 dark:text-purple-400" /> แก้ไขพนักงาน
        </h1>
        <div className="flex gap-2">
          <Link
            href={`/employees/${employeeId}/change-password`}
            className="btn btn-outline btn-sm border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 inline-flex items-center justify-center"
          >
            <FiLock className="mr-1.5 h-4 w-4" />
            <span>เปลี่ยนรหัสผ่าน</span>
          </Link>
          <Link
            href="/employees"
            className="btn btn-outline btn-sm border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 inline-flex items-center justify-center"
          >
            <FiArrowLeft className="mr-1.5 h-4 w-4" />
            <span>กลับ</span>
          </Link>
        </div>
      </div>
      
      {error && <ErrorMessage message={error} type="error" />}
      
      {success && <ErrorMessage message={success} type="success" />}
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/30 p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* รูปโปรไฟล์ */}
            <div className="col-span-1 md:col-span-2 flex flex-col items-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
              <h3 className="text-lg font-medium mb-4 text-gray-700 dark:text-gray-200">รูปโปรไฟล์พนักงาน</h3>
              
              {imagePreview ? (
                <div className="relative w-40 h-40 mb-4">
                  <Image
                    src={imagePreview}
                    alt="รูปโปรไฟล์"
                    fill
                    className="object-cover rounded-full border-4 border-gray-200 dark:border-gray-700"
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
                <div className="w-40 h-40 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                  <FiUser className="w-20 h-20 text-gray-400 dark:text-gray-500" />
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
            
            <div>
              <label htmlFor="employeeId" className="block text-gray-700 dark:text-gray-200 font-medium mb-2">
                รหัสพนักงาน <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="employeeId"
                name="employeeId"
                value={formData.employeeId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              />
            </div>
            
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">-- เลือกทีม --</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="hireDate" className="block text-gray-700 dark:text-gray-200 font-medium mb-2">
                วันที่เริ่มงาน <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="hireDate"
                name="hireDate"
                value={formData.hireDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              />
            </div>
            
            <div>
              <label htmlFor="role" className="block text-gray-700 dark:text-gray-200 font-medium mb-2">
                บทบาท <span className="text-red-500">*</span>
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              >
                <option value="employee">พนักงาน</option>
                <option value="manager">ผู้จัดการ</option>
                <option value="admin">ผู้ดูแลระบบ</option>
              </select>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400 border-gray-300 dark:border-gray-600 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-gray-700 dark:text-gray-200">
                สถานะการทำงาน (ทำงานอยู่)
              </label>
            </div>
          </div>
          
          <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
            <LoadingButton
              type="submit"
              loading={submitting || uploadingImage}
              className="btn btn-primary w-full inline-flex items-center justify-center text-white"
            >
              <FiSave className="mr-1.5 h-4 w-4" />
              <span>{submitting || uploadingImage ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}</span>
            </LoadingButton>
          </div>
        </form>
      </div>
    </div>
  );
} 