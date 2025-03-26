'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FiSave, FiArrowLeft, FiUpload, FiX, FiUser } from 'react-icons/fi';
import { LoadingPage, LoadingButton } from '../../../components/ui/LoadingSpinner';

export default function AddEmployeePage() {
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
  });
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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
      setUploadingImage(false);

      if (data.success) {
        return data.url;
      } else {
        setError(data.message || 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
        return null;
      }
    } catch (error) {
      setUploadingImage(false);
      setError('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // อัปโหลดรูปภาพถ้ามี
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadImage();
        if (!imageUrl) {
          setLoading(false);
          return;
        }
      }

      const dataToSend = {
        ...formData,
        image: imageUrl,
      };
      
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });
      
      const data = await res.json();
      
      if (data.success) {
        router.push('/employees');
      } else {
        setError(data.message || 'เกิดข้อผิดพลาดในการเพิ่มข้อมูลพนักงาน');
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="container mx-auto p-4">
        <LoadingPage message="กำลังโหลด..." />
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
          <FiUser className="mr-2 text-purple-600 dark:text-purple-400" /> เพิ่มพนักงาน
        </h1>
        <Link
          href="/employees"
          className="btn btn-outline btn-sm border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 inline-flex items-center justify-center"
        >
          <FiArrowLeft className="mr-1.5 h-4 w-4" />
          <span>กลับ</span>
        </Link>
      </div>
      
      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800/50 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
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
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              <span className="text-amber-500">หมายเหตุ:</span> รหัสผ่านจะถูกสร้างโดยอัตโนมัติและส่งไปยังอีเมลของพนักงาน
            </p>
            <LoadingButton
              type="submit"
              loading={loading}
              className="btn btn-primary w-full inline-flex items-center justify-center text-white"
            >
              <FiSave className="mr-1.5 h-4 w-4" />
              <span>{loading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}</span>
            </LoadingButton>
          </div>
        </form>
      </div>
    </div>
  );
} 