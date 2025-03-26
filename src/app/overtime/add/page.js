'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiSave, FiArrowLeft } from 'react-icons/fi';
import { LoadingPage, LoadingButton } from '../../../components/ui/LoadingSpinner';

export default function AddOvertimePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    employee: '',
    date: '',
    startTime: '',
    endTime: '',
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

  const calculateTotalHours = () => {
    if (!formData.startTime || !formData.endTime) return 0;
    
    const [startHour, startMinute] = formData.startTime.split(':').map(Number);
    const [endHour, endMinute] = formData.endTime.split(':').map(Number);
    
    let hours = endHour - startHour;
    let minutes = endMinute - startMinute;
    
    if (minutes < 0) {
      hours -= 1;
      minutes += 60;
    }
    
    return parseFloat((hours + minutes / 60).toFixed(2));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // ตรวจสอบเวลา
    const totalHours = calculateTotalHours();
    
    if (totalHours <= 0) {
      setError('เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น');
      setLoading(false);
      return;
    }

    try {
      const dataToSend = {
        ...formData,
        totalHours,
      };
      
      const res = await fetch('/api/overtime', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });
      
      const data = await res.json();
      
      if (data.success) {
        router.push('/overtime');
      } else {
        setError(data.message || 'เกิดข้อผิดพลาดในการเพิ่มข้อมูลการทำงานล่วงเวลา');
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">ขอทำงานล่วงเวลา</h1>
        <Link
          href="/overtime"
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
              <label htmlFor="date" className="block text-gray-700 dark:text-gray-200 font-medium mb-2">
                วันที่ทำงานล่วงเวลา
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              />
            </div>
            
            <div>
              <label htmlFor="startTime" className="block text-gray-700 dark:text-gray-200 font-medium mb-2">
                เวลาเริ่มต้น
              </label>
              <input
                type="time"
                id="startTime"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              />
            </div>
            
            <div>
              <label htmlFor="endTime" className="block text-gray-700 dark:text-gray-200 font-medium mb-2">
                เวลาสิ้นสุด
              </label>
              <input
                type="time"
                id="endTime"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              />
            </div>
            
            <div className="md:col-span-2">
              <label htmlFor="reason" className="block text-gray-700 dark:text-gray-200 font-medium mb-2">
                เหตุผลการทำงานล่วงเวลา
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
            
            {formData.startTime && formData.endTime && (
              <div className="md:col-span-2">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                  <p className="font-medium text-gray-800 dark:text-gray-100">จำนวนชั่วโมงทำงานล่วงเวลา: <span className="text-blue-600 dark:text-blue-400">{calculateTotalHours()} ชั่วโมง</span></p>
                </div>
              </div>
            )}
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