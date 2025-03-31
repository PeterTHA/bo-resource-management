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

  return !isModalOpen ? null : (
    <div className="fixed inset-0 z-50 overflow-auto bg-black/50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {leaveData ? 'รายละเอียดการลา' : 'สถานะการทำงาน'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4">
          {/* ข้อมูลพนักงาน */}
          {employee && (
            <div className="mb-4">
              <div className="font-medium">{employee.firstName} {employee.lastName}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{employee.position}</div>
              <div className="text-sm text-gray-500 dark:text-gray-500">{employee.department}</div>
            </div>
          )}
          
          {/* วันที่ */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <FiCalendar className="text-primary-500" />
              <span className="font-medium">วันที่</span>
            </div>
            <div className="pl-7">
              {date ? new Date(date).toLocaleDateString('th-TH', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) : '-'}
            </div>
          </div>
          
          {/* แสดงข้อมูลการลา */}
          {leaveData && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <FiClock className="text-primary-500" />
                  <span className="font-medium">ประเภทการลา</span>
                </div>
                <div className="pl-7">
                  {leaveData.leaveType || '-'}
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <FiCalendar className="text-primary-500" />
                  <span className="font-medium">ช่วงวันที่ลา</span>
                </div>
                <div className="pl-7">
                  {new Date(leaveData.startDate).toLocaleDateString('th-TH')} ถึง {new Date(leaveData.endDate).toLocaleDateString('th-TH')}
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    จำนวน {leaveData.totalDays} วัน ({leaveData.leaveFormat || 'เต็มวัน'})
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <FiClock className="text-primary-500" />
                  <span className="font-medium">สถานะ</span>
                </div>
                <div className="pl-7">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    leaveData.status === 'อนุมัติ' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : leaveData.status === 'ไม่อนุมัติ'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}>
                    {leaveData.status}
                  </span>
                  
                  {leaveData.cancelStatus && (
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                      {leaveData.cancelStatus === 'รออนุมัติ' ? 'รอยกเลิก' : leaveData.cancelStatus}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <FiClock className="text-primary-500" />
                  <span className="font-medium">เหตุผลการลา</span>
                </div>
                <div className="pl-7 whitespace-pre-wrap">
                  {leaveData.reason || '-'}
                </div>
              </div>
            </div>
          )}
          
          {/* แสดงแบบฟอร์มสถานะการทำงาน เมื่อไม่มีข้อมูลการลา */}
          {!leaveData && (
            <form onSubmit={handleSubmit}>
              {/* UI สำหรับการตั้งค่าช่วงวันที่ */}
              {!isViewOnly && (
                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      id="dateRangeToggle"
                      checked={isDateRange}
                      onChange={e => setIsDateRange(e.target.checked)}
                      className="mr-2 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <label htmlFor="dateRangeToggle" className="text-sm font-medium">
                      ตั้งค่าหลายวัน
                    </label>
                  </div>
                  
                  {isDateRange && (
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          วันที่เริ่มต้น
                        </label>
                        <input
                          type="date"
                          id="startDate"
                          value={formatDateForInput(startDateObj)}
                          disabled={true}
                          className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          วันที่สิ้นสุด
                        </label>
                        <input
                          type="date"
                          id="endDate"
                          value={endDate ? formatDateForInput(new Date(endDate)) : ''}
                          onChange={e => setEndDate(e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* สถานะการทำงาน */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  สถานะการทำงาน
                </label>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => !isViewOnly && setStatus('OFFICE')}
                    className={`p-3 rounded-lg border ${
                      status === 'OFFICE'
                        ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-200 dark:border-primary-700 text-primary-700 dark:text-primary-400'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                    } ${isViewOnly ? 'cursor-default' : 'hover:bg-gray-50 dark:hover:bg-gray-700'} transition-colors flex items-center justify-center gap-2`}
                    disabled={isViewOnly}
                  >
                    <FiBriefcase className={status === 'OFFICE' ? 'text-primary-500' : 'text-gray-500 dark:text-gray-400'} />
                    <span>ทำงานที่ออฟฟิศ</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => !isViewOnly && setStatus('WFH')}
                    className={`p-3 rounded-lg border ${
                      status === 'WFH'
                        ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-200 dark:border-primary-700 text-primary-700 dark:text-primary-400'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                    } ${isViewOnly ? 'cursor-default' : 'hover:bg-gray-50 dark:hover:bg-gray-700'} transition-colors flex items-center justify-center gap-2`}
                    disabled={isViewOnly}
                  >
                    <FiHome className={status === 'WFH' ? 'text-primary-500' : 'text-gray-500 dark:text-gray-400'} />
                    <span>ทำงานที่บ้าน</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => !isViewOnly && setStatus('HYBRID')}
                    className={`p-3 rounded-lg border ${
                      status === 'HYBRID'
                        ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-200 dark:border-primary-700 text-primary-700 dark:text-primary-400'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                    } ${isViewOnly ? 'cursor-default' : 'hover:bg-gray-50 dark:hover:bg-gray-700'} transition-colors flex items-center justify-center gap-2`}
                    disabled={isViewOnly}
                  >
                    <FiRefreshCw className={status === 'HYBRID' ? 'text-primary-500' : 'text-gray-500 dark:text-gray-400'} />
                    <span>แบบผสม</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => !isViewOnly && setStatus('OFFSITE')}
                    className={`p-3 rounded-lg border ${
                      status === 'OFFSITE'
                        ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-200 dark:border-primary-700 text-primary-700 dark:text-primary-400'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                    } ${isViewOnly ? 'cursor-default' : 'hover:bg-gray-50 dark:hover:bg-gray-700'} transition-colors flex items-center justify-center gap-2`}
                    disabled={isViewOnly}
                  >
                    <FiCoffee className={status === 'OFFSITE' ? 'text-primary-500' : 'text-gray-500 dark:text-gray-400'} />
                    <span>นอกสถานที่</span>
                  </button>
                </div>
              </div>
              
              {/* โน๊ต */}
              <div className="mb-4">
                <label htmlFor="note" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  โน๊ต (ถ้ามี)
                </label>
                <textarea
                  id="note"
                  rows="3"
                  value={note}
                  onChange={e => !isViewOnly && setNote(e.target.value)}
                  readOnly={isViewOnly}
                  placeholder="ระบุรายละเอียดเพิ่มเติม (ถ้ามี)"
                  className={`block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${
                    isViewOnly ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed' : ''
                  }`}
                ></textarea>
              </div>
              
              {/* ข้อมูล OT */}
              {overtimeData && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="mb-2 font-medium flex items-center gap-2">
                    <FiClock className="text-primary-500" />
                    <span>ข้อมูลการทำงานล่วงเวลา (OT)</span>
                  </div>
                  <div className="pl-7">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">เวลา:</span> {overtimeData.startTime || '--:--'} - {overtimeData.endTime || '--:--'}
                      <span className="ml-2">({overtimeData.totalHours} ชั่วโมง)</span>
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                      <span className="font-medium">สถานะ:</span> 
                      <span className={`ml-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        overtimeData.status === 'อนุมัติ' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : overtimeData.status === 'ไม่อนุมัติ'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {overtimeData.status}
                      </span>
                    </p>
                    {overtimeData.reason && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                        <span className="font-medium">เหตุผล:</span> {overtimeData.reason}
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {/* ปุ่มการทำงาน */}
              {!isViewOnly && (
                <div className="mt-6 flex gap-2 justify-end">
                  {existingStatus && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={loading}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ลบข้อมูล
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-primary-600 dark:bg-primary-700 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-primary-700 dark:hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'กำลังบันทึก...' : 'บันทึก'}
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
} 