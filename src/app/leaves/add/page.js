'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiSave, FiArrowLeft } from 'react-icons/fi';
import { LoadingPage, LoadingButton } from '../../../components/ui/LoadingSpinner';

export default function AddLeavePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    employee: '',
    leaveType: 'ลาป่วย',
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetch('/api/employees');
        const data = await res.json();
        
        if (data.success) {
          setEmployees(data.data);
        }
      } catch (error) {
        console.error('Error fetching employees:', error);
      }
    };
    
    if (session && (session.user.role === 'admin' || session.user.role === 'manager')) {
      fetchEmployees();
    }
  }, [session]);

  useEffect(() => {
    if (session && session.user.role === 'employee') {
      setFormData(prev => ({
        ...prev,
        employee: session.user.id,
      }));
    }
  }, [session]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // ตรวจสอบวันที่
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    
    if (endDate < startDate) {
      setError('วันที่สิ้นสุดการลาต้องมากกว่าหรือเท่ากับวันที่เริ่มลา');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/leaves', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await res.json();
      
      if (data.success) {
        router.push('/leaves');
      } else {
        setError(data.message || 'เกิดข้อผิดพลาดในการเพิ่มข้อมูลการลา');
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

  if (!session) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">ขอลางาน</h1>
        <Link
          href="/leaves"
          className="btn btn-outline btn-sm border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <FiArrowLeft className="mr-1 h-4 w-4" />
          กลับ
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
            {(session.user.role === 'admin' || session.user.role === 'manager') && (
              <div>
                <label htmlFor="employee" className="block text-gray-700 dark:text-gray-200 font-medium mb-2">
                  พนักงาน
                </label>
                <select
                  id="employee"
                  name="employee"
                  value={formData.employee}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                >
                  <option value="">เลือกพนักงาน</option>
                  {employees.map((employee) => (
                    <option key={employee._id} value={employee._id}>
                      {employee.firstName} {employee.lastName} ({employee.employeeId})
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div>
              <label htmlFor="leaveType" className="block text-gray-700 dark:text-gray-200 font-medium mb-2">
                ประเภทการลา
              </label>
              <select
                id="leaveType"
                name="leaveType"
                value={formData.leaveType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              >
                <option value="ลาป่วย">ลาป่วย</option>
                <option value="ลากิจ">ลากิจ</option>
                <option value="ลาพักร้อน">ลาพักร้อน</option>
                <option value="ลาคลอด">ลาคลอด</option>
                <option value="อื่นๆ">อื่นๆ</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="startDate" className="block text-gray-700 dark:text-gray-200 font-medium mb-2">
                วันที่เริ่มลา
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              />
            </div>
            
            <div>
              <label htmlFor="endDate" className="block text-gray-700 dark:text-gray-200 font-medium mb-2">
                วันที่สิ้นสุดการลา
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              />
            </div>
            
            <div className="md:col-span-2">
              <label htmlFor="reason" className="block text-gray-700 dark:text-gray-200 font-medium mb-2">
                เหตุผลการลา
              </label>
              <textarea
                id="reason"
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              ></textarea>
            </div>
          </div>
          
          <div className="mt-6">
            <LoadingButton
              type="submit"
              loading={loading}
              className="btn btn-primary w-full"
              textClass="text-black dark:text-white"
            >
              <FiSave className="mr-2 h-4 w-4" />
              {loading ? 'กำลังบันทึก...' : 'บันทึก'}
            </LoadingButton>
          </div>
        </form>
      </div>
    </div>
  );
} 