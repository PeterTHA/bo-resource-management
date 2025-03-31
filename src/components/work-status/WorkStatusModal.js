import { useState, useEffect } from 'react';
import { FiHome, FiCheckSquare, FiX, FiBriefcase, FiCoffee, FiRefreshCw, FiCalendar, FiClock } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

export default function WorkStatusModal({ isOpen, onClose, employee, date, onSave, currentUser, existingStatus = null }) {
  const [status, setStatus] = useState(existingStatus ? existingStatus.status : 'OFFICE');
  const [note, setNote] = useState(existingStatus ? existingStatus.note : '');
  const [loading, setLoading] = useState(false);
  const [isDateRange, setIsDateRange] = useState(false);
  const [endDate, setEndDate] = useState(null);
  
  // ตรวจสอบว่าเป็นการเปิดในโหมดดูอย่างเดียวหรือไม่
  const isViewOnly = isOpen && typeof isOpen === 'object' && isOpen.viewOnly === true;
  const isModalOpen = typeof isOpen === 'object' ? isOpen.isOpen : isOpen;
  
  // ดึงข้อมูล OT และการลาจาก props
  const leaveData = isOpen && typeof isOpen === 'object' ? isOpen.leaveData : null;
  const overtimeData = isOpen && typeof isOpen === 'object' ? isOpen.overtimeData : null;
  
  // เตรียมข้อมูลวันที่สำหรับแสดงผลและส่งไปยัง API
  const startDateObj = date ? new Date(date) : new Date();
  const endDateObj = endDate ? new Date(endDate) : new Date(startDateObj);
  
  // ฟอร์แมตวันที่เป็น ISO string สำหรับใช้กับ input type="date"
  const formatDateForInput = (dateObj) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    // รีเซ็ตค่าเมื่อมีการเปิด modal
    if (isOpen) {
      setStatus(existingStatus ? existingStatus.status : 'OFFICE');
      setNote(existingStatus ? existingStatus.note : '');
      setIsDateRange(false);
      setEndDate(null);
    }
  }, [isOpen, existingStatus]);

  // ตรวจสอบว่าผู้ใช้มีสิทธิ์แก้ไขข้อมูลหรือไม่
  const isAdmin = currentUser?.role === 'admin';
  const isTeamLead = currentUser?.role === 'team_lead' || currentUser?.role === 'supervisor';
  const isSameUser = currentUser?.id === employee?.id;
  
  // แก้ไขการตรวจสอบทีม โดยเปรียบเทียบว่าหัวหน้าทีมและสมาชิกอยู่ทีมเดียวกันหรือไม่
  // ตรวจสอบทั้งกรณีที่ teamId เป็น string และกรณีที่เป็น object ที่มี id
  const currentUserTeamId = currentUser?.teamId || (currentUser?.team?.id || null);
  const employeeTeamId = employee?.teamId || (employee?.team?.id || null);
  const isInSameTeam = isTeamLead && currentUserTeamId && employeeTeamId && currentUserTeamId === employeeTeamId;
  
  const canEdit = isAdmin || isSameUser || isInSameTeam;
  
  // ตรวจสอบวันที่
  const validateDates = () => {
    if (!isDateRange) return true;
    
    const start = new Date(startDateObj);
    const end = new Date(endDateObj);
    
    if (end < start) {
      toast.error('วันที่สิ้นสุดต้องมาหลังวันที่เริ่มต้น');
      return false;
    }
    
    // ตรวจสอบว่าช่วงเวลาไม่ยาวเกินไป (เช่น ไม่เกิน 31 วัน)
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    if (diffDays > 31) {
      toast.error('ช่วงวันที่ไม่ควรเกิน 31 วัน');
      return false;
    }
    
    return true;
  };

  // ฟังก์ชันบันทึกข้อมูล
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!canEdit) {
      toast.error('คุณไม่มีสิทธิ์ในการแก้ไขข้อมูลนี้');
      return;
    }
    
    if (!validateDates()) {
      return;
    }
    
    setLoading(true);
    
    try {
      if (isDateRange && endDate) {
        // สำหรับการบันทึกแบบช่วงวันที่
        const start = new Date(startDateObj);
        const end = new Date(endDateObj);
        
        // สร้างอาเรย์ของวันที่ทั้งหมดในช่วง
        const dateRange = [];
        const currentDate = new Date(start);
        
        while (currentDate <= end) {
          dateRange.push(new Date(currentDate));
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // บันทึกข้อมูลทีละวัน
        const responses = await Promise.all(
          dateRange.map(dateItem => 
            fetch('/api/work-status', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                employeeId: employee.id,
                date: dateItem.toISOString(),
                status,
                note,
                forceUpdate: true // เพิ่ม flag ให้สามารถบันทึกคล่อมข้อมูลเดิมได้
              }),
            }).then(res => res.json())
          )
        );
        
        // ตรวจสอบผลลัพธ์
        const hasErrors = responses.some(res => !res.success);
        
        if (hasErrors) {
          const errorMessages = responses
            .filter(res => !res.success)
            .map(res => res.message)
            .join(', ');
          
          toast.error(`เกิดข้อผิดพลาดบางส่วน: ${errorMessages}`);
        } else {
          toast.success(`บันทึกข้อมูลสำเร็จ ${dateRange.length} วัน`);
          
          // ส่งข้อมูลทั้งหมดกลับไปเพื่อรีเฟรชหน้าจอ
          const allWorkStatuses = responses.map(res => res.data);
          onSave({ 
            multipleUpdate: true, 
            statuses: allWorkStatuses,
            forceRefresh: true // เพิ่ม flag ให้รีเฟรชข้อมูลใหม่
          });
          
          onClose();
        }
      } else {
        // สำหรับการบันทึกวันเดียว (แบบเดิม)
        const response = await fetch('/api/work-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            employeeId: employee.id,
            date: startDateObj.toISOString(),
            status,
            note,
            forceUpdate: true // เพิ่ม flag ให้สามารถบันทึกคล่อมข้อมูลเดิมได้
          }),
        });
        
        const data = await response.json();
        
        if (data.success) {
          toast.success(data.message || 'บันทึกข้อมูลสำเร็จ');
          onSave({
            ...data.data,
            forceRefresh: true // เพิ่ม flag ให้รีเฟรชข้อมูลใหม่
          });
          onClose();
        } else {
          toast.error(data.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        }
      }
    } catch (error) {
      console.error('Error saving work status:', error);
      toast.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันลบข้อมูล
  const handleDelete = async () => {
    if (!existingStatus) return;
    
    if (!canEdit) {
      toast.error('คุณไม่มีสิทธิ์ในการลบข้อมูลนี้');
      return;
    }
    
    if (!confirm('คุณต้องการลบข้อมูลสถานะการทำงานนี้ใช่หรือไม่?')) return;
    
    setLoading(true);
    
    try {
      const response = await fetch(`/api/work-status?id=${existingStatus.id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message || 'ลบข้อมูลสำเร็จ');
        onSave(null); // ส่ง null เพื่อให้รู้ว่าลบข้อมูลแล้ว
        onClose();
      } else {
        toast.error(data.message || 'เกิดข้อผิดพลาดในการลบข้อมูล');
      }
    } catch (error) {
      console.error('Error deleting work status:', error);
      toast.error('เกิดข้อผิดพลาดในการลบข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันแสดงชื่อสถานะการทำงาน
  const getStatusText = (statusCode) => {
    switch (statusCode) {
      case 'WFH':
        return 'Work From Home';
      case 'OFFICE':
        return 'ทำงานที่ออฟฟิศ';
      case 'MIXED':
        return 'ทำงานแบบผสม';
      default:
        return 'ไม่ระบุ';
    }
  };

  // ฟังก์ชันแสดงไอคอนสถานะการทำงาน
  const getStatusIcon = (statusCode) => {
    switch (statusCode) {
      case 'WFH':
        return <FiHome className="w-5 h-5" />;
      case 'OFFICE':
        return <FiBriefcase className="w-5 h-5" />;
      case 'MIXED':
        return <FiRefreshCw className="w-5 h-5" />;
      default:
        return <FiCheckSquare className="w-5 h-5" />;
    }
  };

  if (!isModalOpen) return null;

  const formattedDate = date ? new Date(date).toLocaleDateString('th-TH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) : '';

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${isModalOpen ? 'visible' : 'invisible'}`}>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 dark:bg-black/70" 
        onClick={onClose}
      ></div>
      
      {/* Modal Content */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
            สถานะการทำงาน
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>
        
        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* ข้อมูลพนักงาน */}
          {employee && (
            <div className="mb-6 flex items-center">
              <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-semibold text-gray-700 dark:text-gray-200 mr-3 overflow-hidden">
                {employee.image ? (
                  <img src={employee.image} alt={`${employee.firstName} ${employee.lastName}`} className="w-full h-full object-cover" />
                ) : (
                  <span>{employee.firstName?.charAt(0)}{employee.lastName?.charAt(0)}</span>
                )}
              </div>
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                  {employee.firstName} {employee.lastName}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {employee.position} • {typeof employee.department === 'object' ? employee.department.name : employee.department}
                </p>
              </div>
            </div>
          )}
          
          {/* วันที่ */}
          <div className="mb-6">
            <div className="mb-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center mb-2">
                <FiCalendar className="mr-2" /> วันที่
              </h4>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {startDateObj.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            
            {/* แสดงข้อมูลสถานะต่างๆ ในวันนี้ */}
            {(leaveData || overtimeData) && (
              <div className="mb-4 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                  ข้อมูลสถานะในวันนี้
                </h4>
                
                <div className="space-y-3">
                  {/* ข้อมูลการลา */}
                  {leaveData && (
                    <div className={`p-3 rounded-lg ${
                      leaveData.status === 'อนุมัติ'
                        ? 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 dark:border-green-600'
                        : leaveData.status === 'ไม่อนุมัติ'
                        ? 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-600'
                        : 'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 dark:border-yellow-600'
                    }`}>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center">
                          <FiCalendar className={`mr-2 ${
                            leaveData.status === 'อนุมัติ'
                              ? 'text-green-600 dark:text-green-400'
                              : leaveData.status === 'ไม่อนุมัติ'
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-yellow-600 dark:text-yellow-400'
                          }`} />
                          <div>
                            <h5 className="font-medium text-gray-900 dark:text-white">{leaveData.leaveType}</h5>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {new Date(leaveData.startDate).toLocaleDateString('th-TH')} - {new Date(leaveData.endDate).toLocaleDateString('th-TH')}
                            </p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          leaveData.status === 'อนุมัติ'
                            ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                            : leaveData.status === 'ไม่อนุมัติ'
                            ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                        }`}>
                          {leaveData.status}
                        </span>
                      </div>
                      {leaveData.reason && (
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 pl-6">
                          <span className="font-medium">เหตุผล:</span> {leaveData.reason}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* ข้อมูล OT */}
                  {overtimeData && (
                    <div className={`p-3 rounded-lg ${
                      overtimeData.status === 'อนุมัติ'
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-500 dark:border-indigo-600'
                        : overtimeData.status === 'ไม่อนุมัติ'
                        ? 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-600'
                        : 'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 dark:border-yellow-600'
                    }`}>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center">
                          <FiClock className={`mr-2 ${
                            overtimeData.status === 'อนุมัติ'
                              ? 'text-indigo-600 dark:text-indigo-400'
                              : overtimeData.status === 'ไม่อนุมัติ'
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-yellow-600 dark:text-yellow-400'
                          }`} />
                          <div>
                            <h5 className="font-medium text-gray-900 dark:text-white">ทำงานล่วงเวลา {overtimeData.totalHours || overtimeData.hours} ชั่วโมง</h5>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {overtimeData.startTime && overtimeData.endTime ? 
                                (() => {
                                  try {
                                    // ตรวจสอบรูปแบบของ startTime และ endTime
                                    let startTimeStr = overtimeData.startTime;
                                    let endTimeStr = overtimeData.endTime;
                                    
                                    // ถ้าเป็นเวลารูปแบบ string "HH:MM" แบบปกติ ให้เพิ่มวันที่
                                    if (typeof startTimeStr === 'string' && startTimeStr.match(/^\d{1,2}:\d{2}$/)) {
                                      startTimeStr = `2023-01-01T${startTimeStr}:00`;
                                    }
                                    if (typeof endTimeStr === 'string' && endTimeStr.match(/^\d{1,2}:\d{2}$/)) {
                                      endTimeStr = `2023-01-01T${endTimeStr}:00`;
                                    }
                                    
                                    const startTime = new Date(startTimeStr);
                                    const endTime = new Date(endTimeStr);
                                    
                                    // ตรวจสอบว่าวันที่ถูกต้องหรือไม่
                                    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
                                      throw new Error('Invalid date');
                                    }
                                    
                                    const formattedStartTime = startTime.toLocaleTimeString('th-TH', {hour: '2-digit', minute: '2-digit'});
                                    const formattedEndTime = endTime.toLocaleTimeString('th-TH', {hour: '2-digit', minute: '2-digit'});
                                    
                                    return `เวลา ${formattedStartTime} - ${formattedEndTime}`;
                                  } catch (e) {
                                    // ถ้าเป็นรูปแบบเวลาที่ไม่ใช่ Date object ให้ลองแสดงค่าดิบ
                                    if (typeof overtimeData.startTime === 'string' && typeof overtimeData.endTime === 'string') {
                                      return `เวลา ${overtimeData.startTime} - ${overtimeData.endTime}`;
                                    }
                                    
                                    // ถ้าแปลงไม่ได้ ให้แสดงจำนวนชั่วโมงรวมแทน
                                    return overtimeData.timeRange || (overtimeData.hours && `จำนวน ${overtimeData.hours} ชั่วโมง`) || `${overtimeData.totalHours} ชั่วโมง`;
                                  }
                                })() : 
                                overtimeData.timeRange || (overtimeData.hours && `จำนวน ${overtimeData.hours} ชั่วโมง`) || `${overtimeData.totalHours} ชั่วโมง`
                              }
                            </p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          overtimeData.status === 'อนุมัติ'
                            ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-100'
                            : overtimeData.status === 'ไม่อนุมัติ'
                            ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                        }`}>
                          {overtimeData.status}
                        </span>
                      </div>
                      {overtimeData.description && (
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 pl-6">
                          <span className="font-medium">รายละเอียด:</span> {overtimeData.description}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* ตรวจสอบว่าถ้ามีการลา ไม่ให้แก้ไขหรือบันทึกสถานะการทำงาน */}
            {leaveData && !isAdmin && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border-l-4 border-yellow-400 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700 dark:text-yellow-200">
                      มีการลางานในวันนี้ ไม่สามารถกำหนดสถานะการทำงานได้
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* แบบฟอร์มสถานะการทำงาน */}
          {(!leaveData || isAdmin) && (
            <form onSubmit={handleSubmit} className={isViewOnly ? 'pointer-events-none opacity-80' : ''}>
              {/* ตัวเลือกสถานะการทำงาน */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  สถานะการทำงาน
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                      status === 'OFFICE'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-900/10'
                    }`}
                    onClick={() => setStatus('OFFICE')}
                    disabled={isViewOnly}
                  >
                    <FiBriefcase className={`w-6 h-6 mb-1 ${status === 'OFFICE' ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400'}`} />
                    <span className="text-sm font-medium">ออฟฟิศ</span>
                  </button>
                  
                  <button
                    type="button"
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                      status === 'WFH'
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                        : 'border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700 hover:bg-green-50/50 dark:hover:bg-green-900/10'
                    }`}
                    onClick={() => setStatus('WFH')}
                    disabled={isViewOnly}
                  >
                    <FiHome className={`w-6 h-6 mb-1 ${status === 'WFH' ? 'text-green-500' : 'text-gray-500 dark:text-gray-400'}`} />
                    <span className="text-sm font-medium">WFH</span>
                  </button>
                  
                  <button
                    type="button"
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                      status === 'MIXED'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50/50 dark:hover:bg-purple-900/10'
                    }`}
                    onClick={() => setStatus('MIXED')}
                    disabled={isViewOnly}
                  >
                    <FiRefreshCw className={`w-6 h-6 mb-1 ${status === 'MIXED' ? 'text-purple-500' : 'text-gray-500 dark:text-gray-400'}`} />
                    <span className="text-sm font-medium">ผสม</span>
                  </button>
                </div>
              </div>
              
              {/* หมายเหตุ */}
              <div className="mb-6">
                <label htmlFor="note" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  หมายเหตุ (ถ้ามี)
                </label>
                <textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="block w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  rows="3"
                  disabled={isViewOnly}
                />
              </div>
              
              {/* ตัวเลือกช่วงวันที่ */}
              {!isViewOnly && !existingStatus && (
                <div className="mb-6">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isDateRange"
                      checked={isDateRange}
                      onChange={(e) => setIsDateRange(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <label htmlFor="isDateRange" className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      กำหนดสถานะเป็นช่วงวันที่
                    </label>
                  </div>
                  
                  {isDateRange && (
                    <div className="mt-3 grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          วันที่เริ่มต้น
                        </label>
                        <input
                          type="date"
                          id="startDate"
                          className="block w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
                          value={formatDateForInput(startDateObj)}
                          readOnly
                        />
                      </div>
                      <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          วันที่สิ้นสุด
                        </label>
                        <input
                          type="date"
                          id="endDate"
                          className="block w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
                          value={endDate ? formatDateForInput(endDateObj) : ''}
                          onChange={(e) => setEndDate(e.target.value)}
                          min={formatDateForInput(startDateObj)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </form>
          )}
        </div>
        
        {/* Modal Footer */}
        {!isViewOnly && (!leaveData || isAdmin) && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            {existingStatus ? (
              <>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 rounded-md text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 focus:outline-none"
                  disabled={loading}
                >
                  ลบข้อมูล
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-md text-sm font-medium text-white focus:outline-none"
                  disabled={loading}
                >
                  {loading ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none"
                  disabled={loading}
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-md text-sm font-medium text-white focus:outline-none"
                  disabled={loading}
                >
                  {loading ? 'กำลังบันทึก...' : isDateRange ? 'บันทึกทั้งช่วงวันที่' : 'บันทึกข้อมูล'}
                </button>
              </>
            )}
          </div>
        )}
        
        {isViewOnly && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md text-sm font-medium text-gray-800 dark:text-white focus:outline-none"
            >
              ปิด
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 