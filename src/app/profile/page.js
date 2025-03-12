'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardContent, CardFooter } from '../../components/ui/Card';
import { FiUser, FiLock, FiMail, FiPhone, FiInfo } from 'react-icons/fi';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [employee, setEmployee] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    position: '',
    department: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('info');
  const [message, setMessage] = useState({ type: '', text: '' });

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
          setFormData({
            firstName: data.data.firstName,
            lastName: data.data.lastName,
            email: data.data.email,
            position: data.data.position,
            department: data.data.department,
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          });
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

    if (session) {
      fetchEmployeeData();
    }
  }, [session]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/employees/${session.user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          position: formData.position,
          department: formData.department,
        }),
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
        method: 'POST',
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

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full" role="status">
            <span className="visually-hidden">กำลังโหลด...</span>
          </div>
          <p className="mt-2">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="container mx-auto py-6 bg-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">โปรไฟล์ของฉัน</h1>
        <Link
          href="/dashboard"
          className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-md"
        >
          กลับ
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader 
            title="ข้อมูลส่วนตัว" 
            icon={<FiUser />} 
          />
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">ชื่อ</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="text-gray-500" />
                  </div>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="pl-10 w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">นามสกุล</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="text-gray-500" />
                  </div>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="pl-10 w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="text-gray-500" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10 w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">ตำแหน่ง</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiInfo className="text-gray-500" />
                  </div>
                  <input
                    type="text"
                    id="position"
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                    className="pl-10 w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    readOnly={session?.user?.role !== 'admin'}
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">แผนก</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiInfo className="text-gray-500" />
                  </div>
                  <input
                    type="text"
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="pl-10 w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    readOnly={session?.user?.role !== 'admin'}
                  />
                </div>
              </div>
              
              <div>
                <button 
                  type="submit" 
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader 
            title="เปลี่ยนรหัสผ่าน" 
            icon={<FiLock />} 
          />
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่านปัจจุบัน</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="text-gray-500" />
                  </div>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    className="pl-10 w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่านใหม่</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="text-gray-500" />
                  </div>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    className="pl-10 w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                    minLength={6}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร</p>
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">ยืนยันรหัสผ่านใหม่</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="text-gray-500" />
                  </div>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pl-10 w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              
              <div>
                <button 
                  type="submit" 
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
                >
                  เปลี่ยนรหัสผ่าน
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 