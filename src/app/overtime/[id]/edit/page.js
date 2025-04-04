'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { FiSave, FiArrowLeft, FiClock, FiFileText, FiUser, FiInfo, FiCalendar } from 'react-icons/fi';
import { LoadingPage, LoadingSpinner } from '../../../../components/ui/LoadingSpinner';
import ErrorMessage from '../../../../components/ui/ErrorMessage';

export default function EditOvertimePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [overtime, setOvertime] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    employee: '',
    date: '',
    startTime: '',
    endTime: '',
    reason: '',
  });
  const [totalHours, setTotalHours] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // ดึงรายชื่อพนักงาน (สำหรับแอดมินและผู้จัดการ)
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
    
    if (session && (session.user.role === 'admin' || session.user.role === 'supervisor')) {
      fetchEmployees();
    }
  }, [session]);

  // ดึงข้อมูลการทำงานล่วงเวลาที่ต้องการแก้ไข
  useEffect(() => {
    const fetchOvertimeDetails = async () => {
      if (!params?.id || !session) return;

      try {
        setLoading(true);
        const res = await fetch(`/api/overtime/${params.id}`);
        const data = await res.json();

        if (data.success) {
          const overtimeData = data.data;
          setOvertime(overtimeData);
          
          // ถ้าผู้ใช้ไม่ใช่เจ้าของหรือไม่ใช่แอดมิน หรือการทำงานล่วงเวลาไม่ได้อยู่ในสถานะรออนุมัติ ให้ redirect ไปหน้ารายการ
          if ((session.user.id !== overtimeData.employeeId && session.user.role !== 'admin') || overtimeData.status !== 'รออนุมัติ') {
            router.push(`/overtime/${params.id}`);
            return;
          }

          // กำหนดค่าเริ่มต้นให้ฟอร์ม
          setFormData({
            employee: overtimeData.employeeId,
            date: new Date(overtimeData.date).toISOString().split('T')[0],
            startTime: overtimeData.startTime,
            endTime: overtimeData.endTime,
            reason: overtimeData.reason,
          });
          
          // คำนวณจำนวนชั่วโมงทำงานล่วงเวลา
          setTotalHours(overtimeData.totalHours);
        } else {
          setError(data.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลการทำงานล่วงเวลา');
        }
      } catch (error) {
        setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchOvertimeDetails();
  }, [params?.id, session, router]);

  // คำนวณจำนวนชั่วโมงทำงานล่วงเวลา
  const calculateTotalHours = useCallback((startTimeValue, endTimeValue) => {
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
      console.log('=== ข้อมูลการคำนวณเวลาทำงานล่วงเวลา (หน้าแก้ไข) ===');
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
  }, [formData.startTime, formData.endTime]);

  useEffect(() => {
    // คำนวณชั่วโมงทำงานล่วงเวลาใหม่
    const hours = calculateTotalHours();
    setTotalHours(hours);
    
    // ตรวจสอบความถูกต้องของข้อมูล
    if (formData.startTime && formData.endTime) {
      const [startHour, startMinute] = formData.startTime.split(':').map(Number);
      const [endHour, endMinute] = formData.endTime.split(':').map(Number);
      
      if (!isNaN(startHour) && !isNaN(startMinute) && !isNaN(endHour) && !isNaN(endMinute)) {
        const startMinutes = startHour * 60 + startMinute;
        const endMinutes = endHour * 60 + endMinute;
        
        // ตรวจสอบกรณีที่เวลาเริ่มต้นมากกว่าเวลาสิ้นสุด
        if (startMinutes > endMinutes) {
          setError('หมายเหตุ: เวลาเริ่มต้นมากกว่าเวลาสิ้นสุด กรุณาตรวจสอบความถูกต้อง');
        } else {
          setError('');
        }
      }
    }
  }, [formData.startTime, formData.endTime, calculateTotalHours]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // ถ้าเปลี่ยนเวลาเริ่มหรือเวลาสิ้นสุด ให้คำนวณเวลาใหม่ทันทีด้วยค่าปัจจุบัน
    if (name === 'startTime' || name === 'endTime') {
      // สร้าง object ชั่วคราวเพื่อเก็บค่าที่อัปเดต
      const updatedFormData = { ...formData, [name]: value };
      
      // คำนวณทันทีด้วยค่าที่กำลังจะอัปเดต
      const totalHours = calculateTotalHours(
        name === 'startTime' ? value : formData.startTime,
        name === 'endTime' ? value : formData.endTime
      );
      
      // แสดงผลลัพธ์ทันที
      setTotalHours(totalHours);
      
      // ตรวจสอบความถูกต้อง
      if (updatedFormData.startTime && updatedFormData.endTime) {
        const [startHour, startMinute] = updatedFormData.startTime.split(':').map(Number);
        const [endHour, endMinute] = updatedFormData.endTime.split(':').map(Number);
        
        if (!isNaN(startHour) && !isNaN(startMinute) && !isNaN(endHour) && !isNaN(endMinute)) {
          const startMinutes = startHour * 60 + startMinute;
          const endMinutes = endHour * 60 + endMinute;
          
          // ตรวจสอบกรณีที่เวลาเริ่มต้นมากกว่าเวลาสิ้นสุด
          if (startMinutes > endMinutes) {
            setError('หมายเหตุ: เวลาเริ่มต้นมากกว่าเวลาสิ้นสุด กรุณาตรวจสอบความถูกต้อง');
          } else {
            setError('');
          }
        }
      }
    }
    
    // อัปเดต state หลังจากตรวจสอบและคำนวณเสร็จ
    setFormData({ ...formData, [name]: value });
    
    // รีเซ็ตข้อความแสดงข้อผิดพลาด
    if (name !== 'startTime' && name !== 'endTime') {
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      setError('');
      setSuccess('');
      
      // ตรวจสอบข้อมูลที่จำเป็น
      if (!formData.date || !formData.startTime || !formData.endTime || !formData.reason) {
        setError('กรุณากรอกข้อมูลให้ครบถ้วน');
        return;
      }
      
      // ตรวจสอบเวลา
      const totalHours = calculateTotalHours();
      
      if (totalHours <= 0) {
        setError('เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น');
        return;
      }
      
      // ส่งข้อมูลไปบันทึก
      const response = await fetch(`/api/overtime/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: formData.employee,
          date: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          reason: formData.reason,
          totalHours: totalHours,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSuccess('บันทึกข้อมูลการทำงานล่วงเวลาเรียบร้อยแล้ว');
        
        // รอสักครู่แล้วนำทางไปหน้ารายการการทำงานล่วงเวลา
        setTimeout(() => {
          router.push('/overtime');
        }, 1500);
      } else {
        setError(result.message || 'บันทึกข้อมูลไม่สำเร็จ');
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading' || loading) {
    return <LoadingPage message="กำลังโหลดข้อมูล..." />;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
          <FiClock className="mr-2 text-primary" /> แก้ไขการทำงานล่วงเวลา
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
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingPage message="กำลังโหลดข้อมูล..." />
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(session.user.role === 'admin' || session.user.role === 'supervisor') && (
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text flex items-center text-base">
                        <FiUser className="mr-2" />
                        พนักงาน
                      </span>
                    </label>
                    <select
                      name="employee"
                      value={formData.employee}
                      onChange={handleInputChange}
                      required
                      className="select select-bordered w-full"
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
                    onChange={handleInputChange}
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
                    onChange={handleInputChange}
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
                    onChange={handleInputChange}
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
                    onChange={handleInputChange}
                    required
                    className="textarea textarea-bordered w-full"
                    rows="3"
                  ></textarea>
                </div>
                
                {formData.startTime && formData.endTime && totalHours > 0 && (
                  <div className="md:col-span-2">
                    <div className="mt-6 bg-base-200 rounded-lg p-4">
                      <div className="font-semibold mb-1">จำนวนชั่วโมงทำงานล่วงเวลา: {totalHours === 1 ? '1' : totalHours} ชั่วโมง</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-center">
                <button
                  type="submit"
                  className="btn btn-primary w-full md:w-auto min-w-[200px]"
                  disabled={submitting || totalHours <= 0}
                >
                  {submitting ? (
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
          )}
        </div>
      </div>
    </div>
  );
} 