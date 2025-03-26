'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiSave, FiArrowLeft, FiRefreshCw, FiLock, FiKey } from 'react-icons/fi';
import { LoadingPage, LoadingButton } from '../../../../components/ui/LoadingSpinner';
import ErrorMessage from '../../../../components/ui/ErrorMessage';
import { use } from 'react';

export default function ChangePasswordPage({ params }) {
  // ใช้ React.use เพื่อแกะ params promise
  const resolvedParams = use(params);
  const employeeId = resolvedParams.id;

  const { data: session, status } = useSession();
  const router = useRouter();
  const [employeeInfo, setEmployeeInfo] = useState(null);
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [randomPassword, setRandomPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // เช็คสิทธิ์การเข้าถึง
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session.user.role !== 'admin') {
      router.push('/dashboard');
    } else if (status === 'authenticated' && session.user.role === 'admin') {
      fetchEmployeeInfo();
    }
  }, [status, session, router, employeeId]);

  // ดึงข้อมูลพนักงาน
  const fetchEmployeeInfo = async () => {
    try {
      const res = await fetch(`/api/employees/${employeeId}`);
      const data = await res.json();

      if (data.success) {
        setEmployeeInfo(data.data);
      } else {
        setError(data.message || 'ไม่พบข้อมูลพนักงาน');
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ฟังก์ชันเปลี่ยนรหัสผ่าน
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    // ตรวจสอบรหัสผ่านใหม่
    if (formData.newPassword !== formData.confirmPassword) {
      setError('รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน');
      setSubmitting(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`/api/employees/${employeeId}/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newPassword: formData.newPassword,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess('เปลี่ยนรหัสผ่านเรียบร้อยแล้ว');
        setFormData({
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        setError(data.message || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  // ฟังก์ชันรีเซ็ตรหัสผ่าน (สร้างรหัสผ่านแบบสุ่ม)
  const handleResetPassword = async () => {
    setResetting(true);
    setError('');
    setSuccess('');
    setRandomPassword('');

    try {
      const res = await fetch(`/api/employees/${employeeId}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(`รีเซ็ตรหัสผ่านเรียบร้อยแล้ว รหัสผ่านใหม่คือ: ${data.password}`);
        setRandomPassword(data.password);
      } else {
        setError(data.message || 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน');
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
      console.error(error);
    } finally {
      setResetting(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingPage message="กำลังโหลดข้อมูล..." />
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
          <FiLock className="mr-2 text-purple-600 dark:text-purple-400" /> เปลี่ยนรหัสผ่าน
        </h1>
        <Link
          href={`/employees/${employeeId}/edit`}
          className="btn btn-outline btn-sm border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 inline-flex items-center justify-center"
        >
          <FiArrowLeft className="mr-1.5 h-4 w-4" />
          <span>กลับ</span>
        </Link>
      </div>

      {error && <ErrorMessage message={error} type="error" />}
      {success && <ErrorMessage message={success} type="success" />}

      {employeeInfo && (
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <h2 className="text-lg font-semibold mb-2">ข้อมูลพนักงาน</h2>
          <p className="mb-1">
            <strong>รหัสพนักงาน:</strong> {employeeInfo.employeeId}
          </p>
          <p className="mb-1">
            <strong>ชื่อ-นามสกุล:</strong> {employeeInfo.firstName} {employeeInfo.lastName}
          </p>
          <p>
            <strong>อีเมล:</strong> {employeeInfo.email}
          </p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FiLock className="mr-2" />
            เปลี่ยนรหัสผ่าน
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div className="mt-6 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <LoadingButton
                  type="submit"
                  loading={submitting}
                  className="btn btn-secondary inline-flex items-center justify-center text-white"
                >
                  <FiLock className="mr-1.5 h-4 w-4" />
                  <span>{submitting ? 'กำลังบันทึก...' : 'เปลี่ยนรหัสผ่าน'}</span>
                </LoadingButton>
                
                <LoadingButton
                  type="button"
                  onClick={handleResetPassword}
                  loading={resetting}
                  className="btn btn-accent inline-flex items-center justify-center text-white"
                >
                  <FiRefreshCw className="mr-1.5 h-4 w-4" />
                  <span>{resetting ? 'กำลังรีเซ็ต...' : 'รีเซ็ตรหัสผ่าน'}</span>
                </LoadingButton>
              </div>
            </div>
          </form>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FiRefreshCw className="mr-2" />
            รีเซ็ตรหัสผ่าน
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            คลิกปุ่มด้านล่างเพื่อรีเซ็ตรหัสผ่านและสร้างรหัสผ่านใหม่แบบสุ่ม 
            ระบบจะแสดงรหัสผ่านใหม่ให้คุณเห็นหลังจากรีเซ็ต
          </p>

          {randomPassword && (
            <div className="mb-6 p-4 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800">
              <h3 className="font-medium text-green-800 dark:text-green-300 mb-2">รหัสผ่านใหม่:</h3>
              <div className="bg-white dark:bg-gray-700 p-3 rounded-md font-mono text-lg text-center break-all">
                {randomPassword}
              </div>
              <p className="mt-2 text-sm text-green-700 dark:text-green-400">
                โปรดแจ้งรหัสผ่านนี้แก่พนักงานผ่านช่องทางที่ปลอดภัย
              </p>
            </div>
          )}

          <LoadingButton
            onClick={handleResetPassword}
            loading={resetting}
            className="btn btn-secondary w-full"
          >
            <FiKey className="mr-2 h-4 w-4" />
            {resetting ? 'กำลังรีเซ็ตรหัสผ่าน...' : 'รีเซ็ตรหัสผ่าน'}
          </LoadingButton>
        </div>
      </div>
    </div>
  );
} 