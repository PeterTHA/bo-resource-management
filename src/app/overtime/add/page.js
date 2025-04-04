'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiSave, FiArrowLeft, FiFileText, FiUser, FiInfo, FiCalendar, FiClock } from 'react-icons/fi';
import { LoadingSpinner, LoadingPage } from '../../../components/ui/LoadingSpinner';
import ErrorMessage from '../../../components/ui/ErrorMessage';

export default function AddOvertimePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    employeeId: '',
    date: '',
    startTime: '',
    endTime: '',
    reason: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
    
    if (session && session.user.role === 'admin') {
      fetchEmployees();
    }
  }, [session]);

  useEffect(() => {
    if (session && (session.user.role === 'permanent' || session.user.role === 'temporary' || session.user.role === 'supervisor')) {
      setFormData(prev => ({
        ...prev,
        employeeId: session.user.id,
      }));
    }
  }, [session]);

  const calculateTotalHours = (startTimeValue, endTimeValue) => {
    // ใช้ค่าที่ส่งเข้ามาถ้ามี มิฉะนั้นใช้ค่าจาก state
    const startTime = startTimeValue || formData.startTime;
    const endTime = endTimeValue || formData.endTime;
    
    if (!startTime || !endTime) return 0;
    
    // ตรวจสอบว่าทั้งเวลาเริ่มต้นและเวลาสิ้นสุดไม่เป็นค่าว่าง
    if (startTime.trim() === '' || endTime.trim() === '') {
      return 0;
    }
    
    try {
      // แยกชั่วโมงและนาที
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);
      
      if (isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) {
        return 0;
      }
      
      // คำนวณเวลาเป็นนาที
      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;
      
      // เพิ่ม log แสดงข้อมูลการคำนวณ
      console.log('=== ข้อมูลการคำนวณเวลาทำงานล่วงเวลา (หน้าเพิ่ม) ===');
      console.log('ค่าที่ใช้คำนวณ - เวลาเริ่มต้น:', startTime);
      console.log('ค่าที่ใช้คำนวณ - เวลาสิ้นสุด:', endTime);
      console.log('ค่าใน state - เวลาเริ่มต้น:', formData.startTime);
      console.log('ค่าใน state - เวลาสิ้นสุด:', formData.endTime);
      console.log('ชั่วโมงเริ่มต้น:', startHour);
      console.log('นาทีเริ่มต้น:', startMinute);
      console.log('ชั่วโมงสิ้นสุด:', endHour);
      console.log('นาทีสิ้นสุด:', endMinute);
      console.log('เวลาเริ่มต้น (นาที):', startMinutes);
      console.log('เวลาสิ้นสุด (นาที):', endMinutes);
      
      // คำนวณความแตกต่างเป็นชั่วโมง
      const diffMinutes = Math.abs(endMinutes - startMinutes);
      const totalHours = diffMinutes / 60;
      
      console.log('ความแตกต่าง (นาที):', diffMinutes);
      console.log('จำนวนชั่วโมงทำงาน:', totalHours);
      console.log('จำนวนชั่วโมงทำงาน (หลังปัดทศนิยม):', Number(totalHours.toFixed(2)));
      console.log('=========================================');
      
      // แปลงให้เป็นทศนิยม 2 ตำแหน่ง
      return Number(totalHours.toFixed(2));
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการคำนวณชั่วโมงทำงาน:", error);
      return 0;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // ถ้าเปลี่ยนเวลาเริ่มหรือเวลาสิ้นสุด ให้คำนวณเวลาใหม่
    if (name === 'startTime' || name === 'endTime') {
      // คำนวณชั่วโมงทำงานทันทีโดยใช้ค่าจริงจาก input
      const updatedTotalHours = calculateTotalHours(
        name === 'startTime' ? value : formData.startTime,
        name === 'endTime' ? value : formData.endTime
      );
      
      // รีเซ็ตค่า totalHours ด้วยค่าที่คำนวณใหม่
      setFormData(prev => ({
        ...prev,
        [name]: value,
        totalHours: updatedTotalHours
      }));
    } else {
      // อัปเดต state ปกติสำหรับฟิลด์อื่น
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // ตรวจสอบเวลา - ใช้ฟังก์ชัน calculateTotalHours กับค่าปัจจุบัน
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
        setSuccess('บันทึกข้อมูลการทำงานล่วงเวลาเรียบร้อยแล้ว');
        // กลับไปที่หน้ารายการการทำงานล่วงเวลาหลังจาก 2 วินาที
        setTimeout(() => {
          router.push('/overtime');
        }, 2000);
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
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
          <FiClock className="mr-2 text-primary" /> ขอทำงานล่วงเวลา
        </h1>
        <Link
          href="/overtime"
          className="btn btn-outline btn-sm"
        >
          <FiArrowLeft className="mr-1.5" />
          <span>กลับ</span>
        </Link>
      </div>
      
      {error && <ErrorMessage message={error} />}
      {success && (
        <div className="alert alert-success mb-4">
          <FiInfo size={20} />
          <span>{success}</span>
        </div>
      )}
      
      <div className="card bg-base-100 shadow-xl overflow-hidden">
        <div className="card-body p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {session.user.role === 'admin' && (
                <div className="form-control">
                  <label className="label">
                    <span className="label-text flex items-center text-base">
                      <FiUser className="mr-2" />
                      พนักงาน
                    </span>
                  </label>
                  <select
                    name="employeeId"
                    value={formData.employeeId}
                    onChange={handleChange}
                    required
                    className="select select-bordered w-full"
                  >
                    <option value="">เลือกพนักงาน</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.firstName} {employee.lastName} ({employee.employeeId})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text flex items-center text-base">
                    <FiCalendar className="mr-2" />
                    วันที่ทำงานล่วงเวลา
                  </span>
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className="input input-bordered w-full cursor-pointer"
                  onClick={(e) => e.target.showPicker()}
                />
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text flex items-center text-base">
                    <FiClock className="mr-2" />
                    เวลาเริ่มต้น
                  </span>
                </label>
                <input
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  required
                  className="input input-bordered w-full"
                />
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text flex items-center text-base">
                    <FiClock className="mr-2" />
                    เวลาสิ้นสุด
                  </span>
                </label>
                <input
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  required
                  className="input input-bordered w-full"
                />
              </div>
              
              <div className="form-control md:col-span-2">
                <label className="label">
                  <span className="label-text flex items-center text-base">
                    <FiFileText className="mr-2" />
                    เหตุผลการทำงานล่วงเวลา
                  </span>
                </label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  required
                  className="textarea textarea-bordered w-full"
                  rows="3"
                ></textarea>
              </div>
              
              {formData.startTime && formData.endTime && (
                <div className="md:col-span-2">
                  <div className="mt-6 bg-base-200 rounded-lg p-4">
                    <div className="font-semibold mb-1">
                      จำนวนชั่วโมงทำงานล่วงเวลา: {calculateTotalHours() === 1 ? '1' : calculateTotalHours()} ชั่วโมง
                      {formData.startTime && formData.endTime && 
                        (() => {
                          const [startHour, startMinute] = formData.startTime.split(':').map(Number);
                          const [endHour, endMinute] = formData.endTime.split(':').map(Number);
                          const startMinutes = startHour * 60 + startMinute;
                          const endMinutes = endHour * 60 + endMinute;
                          
                          if (startMinutes > endMinutes) {
                            return (
                              <div className="text-sm text-yellow-600 mt-1">
                                หมายเหตุ: เวลาเริ่มต้นมากกว่าเวลาสิ้นสุด กรุณาตรวจสอบความถูกต้อง
                              </div>
                            );
                          }
                          return null;
                        })()
                      }
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-center">
              <button
                type="submit"
                className="btn btn-primary w-full md:w-auto min-w-[200px]"
                disabled={loading}
              >
                {loading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <FiSave className="mr-2" />
                    <span>บันทึกข้อมูล</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 