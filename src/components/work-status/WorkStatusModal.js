import { useState, useEffect } from 'react';
import { FiHome, FiCheckSquare, FiX, FiBriefcase, FiCoffee, FiRefreshCw, FiCalendar, FiClock } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import ProfileImage from '@/components/ui/ProfileImage';

// ฟังก์ชันสำหรับจัดรูปแบบวันที่
const formatDate = (date) => {
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });
};

// ฟังก์ชันสำหรับจัดรูปแบบเวลา
const formatTime = (date) => {
  try {
    // ตรวจสอบว่าเป็น Date object ที่ถูกต้อง
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return 'ไม่ระบุเวลา';
    }
    return date.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'ไม่ระบุเวลา';
  }
};

export default function WorkStatusModal({ isOpen, onClose, employee, date, onSave, currentUser, existingStatus = null }) {
  const [status, setStatus] = useState(existingStatus ? existingStatus.status : 'OFFICE');
  const [note, setNote] = useState(existingStatus ? existingStatus.note : '');
  const [loading, setLoading] = useState(false);
  const [endDate, setEndDate] = useState(date ? date : null);
  
  // ตรวจสอบว่าเป็นการเปิดในโหมดดูอย่างเดียวหรือไม่
  const isViewOnly = isOpen && typeof isOpen === 'object' && isOpen.viewOnly === true;
  const isModalOpen = typeof isOpen === 'object' ? isOpen.isOpen : isOpen;
  
  // ดึงข้อมูล OT และการลาจาก props
  const leaveData = isOpen && typeof isOpen === 'object' ? isOpen.leaveData : null;
  const overtimeData = isOpen && typeof isOpen === 'object' ? isOpen.overtimeData : null;
  
  // เตรียมข้อมูลวันที่สำหรับแสดงผลและส่งไปยัง API
  const startDateObj = date ? new Date(date) : new Date();
  const endDateObj = endDate ? new Date(endDate) : startDateObj;
  
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
      setEndDate(date);
    }
  }, [isOpen, existingStatus, date]);

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
  
  // ฟังก์ชันบันทึกข้อมูล
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!canEdit) {
      toast.error('คุณไม่มีสิทธิ์ในการแก้ไขข้อมูลนี้');
      return;
    }
    
    setLoading(true);
    
    try {
      if (endDate) {
        // สร้าง Date object ที่เป็น UTC เวลา 12:00 น. เพื่อป้องกันปัญหา timezone
        const inputDate = new Date(endDate);
        const year = inputDate.getFullYear();
        const month = inputDate.getMonth();
        const day = inputDate.getDate();
        const utcDate = new Date(Date.UTC(year, month, day, 12, 0, 0));
        
        console.log('Submitting work status:');
        console.log('- Original date:', endDate);
        console.log('- Original date ISO:', inputDate.toISOString());
        console.log('- UTC date to submit:', utcDate.toISOString());
        console.log('- Local date (th-TH):', utcDate.toLocaleDateString('th-TH'));
        console.log('- Status:', status);
        
        // สำหรับการบันทึกวันเดียว
        const response = await fetch('/api/work-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            employeeId: employee.id,
            date: utcDate.toISOString(),
            status,
            note,
            forceUpdate: true // เพิ่ม flag ให้สามารถบันทึกคล่อมข้อมูลเดิมได้
          }),
        });
        
        const data = await response.json();
        
        if (data.success) {
          toast.success(data.message || 'บันทึกสถานะการทำงานเรียบร้อยแล้ว');
          if (onSave) {
            const savedData = {
              ...data.data,
              forceRefresh: true
            };
            onSave(savedData);
          }
          onClose();
        } else {
          toast.error(data.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        }
      }
    } catch (error) {
      console.error('Error saving work status:', error);
      toast.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง');
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
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-2xl w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">
            {leaveData ? 'รายละเอียดการลา' : 'สถานะการทำงาน'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* ข้อมูลพนักงาน */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center">
            <ProfileImage 
              src={employee?.image}
              alt={`${employee?.firstName || ''} ${employee?.lastName || ''}`}
              size="md"
              fallbackText={`${employee?.firstName || ''} ${employee?.lastName || ''}`}
            />
            <div className="ml-4">
              <h3 className="text-lg font-medium">
                {employee?.firstName} {employee?.lastName}
              </h3>
              <div className="text-gray-600 dark:text-gray-300">
                {employee?.position}
              </div>
              <div className="text-gray-500 dark:text-gray-400">
                {employee?.department}
              </div>
            </div>
          </div>
        </div>

        {/* รายละเอียดการลา */}
        {leaveData && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-sm text-gray-500 dark:text-gray-400">ประเภทการลา</div>
                <div className="font-medium mt-1">{leaveData.leaveType}</div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-sm text-gray-500 dark:text-gray-400">สถานะ</div>
                <div className="font-medium mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium
                    ${leaveData.status === 'อนุมัติ' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      leaveData.status === 'ไม่อนุมัติ' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}`}>
                    {leaveData.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-sm text-gray-500 dark:text-gray-400">ระยะเวลา</div>
              <div className="font-medium mt-1">
                {formatDate(new Date(leaveData.startDate))} - {formatDate(new Date(leaveData.endDate))}
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                  ({leaveData.totalDays} วัน)
                </span>
              </div>
            </div>

            {leaveData.reason && (
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-sm text-gray-500 dark:text-gray-400">เหตุผลการลา</div>
                <div className="font-medium mt-1">{leaveData.reason}</div>
              </div>
            )}
          </div>
        )}

        {/* รายละเอียดการทำงานล่วงเวลา */}
        {overtimeData && (
          <div className="space-y-4 mt-4">
            <h3 className="text-lg font-semibold flex items-center">
              <FiClock className="mr-2" /> ข้อมูลการทำงานล่วงเวลา (OT)
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-sm text-gray-500 dark:text-gray-400">จำนวนชั่วโมงทำงานล่วงเวลา</div>
                <div className="font-medium mt-1">
                  {overtimeData.hours || overtimeData.totalHours || 0} ชั่วโมง
                </div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-sm text-gray-500 dark:text-gray-400">สถานะ</div>
                <div className="font-medium mt-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {overtimeData.status === 'approved' ? 'อนุมัติแล้ว' : 
                     overtimeData.status === 'waiting_for_approve' ? 'รออนุมัติ' : 
                     overtimeData.status === 'rejected' ? 'ไม่อนุมัติ' : 
                     overtimeData.status}
                  </span>
                </div>
              </div>
            </div>

            {(overtimeData.startTime && overtimeData.endTime) ? (
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-sm text-gray-500 dark:text-gray-400">เวลาทำงาน</div>
                <div className="font-medium mt-1 flex items-center">
                  <FiClock className="mr-2 text-purple-500" />
                  {(() => {
                    try {
                      console.log('======== OT TIME DEBUG ========');
                      console.log('Overtime data:', overtimeData);
                      console.log('Start time:', overtimeData.startTime);
                      console.log('End time:', overtimeData.endTime);
                      
                      // ตรวจสอบรูปแบบของเวลา
                      const isTimeString = (time) => {
                        return typeof time === 'string' && /^\d{1,2}:\d{2}(:\d{2})?$/.test(time);
                      };
                      
                      // ถ้าเป็น string เวลาโดยตรงเช่น "18:00" ให้ใช้ตรงๆ
                      if (isTimeString(overtimeData.startTime) && isTimeString(overtimeData.endTime)) {
                        console.log('Using time strings directly');
                        return `${overtimeData.startTime} - ${overtimeData.endTime} น.`;
                      }
                      
                      // ตรวจสอบว่าวันที่ถูกต้องหรือไม่ (Date object หรือ ISO string)
                      const startTimeObj = new Date(overtimeData.startTime);
                      const endTimeObj = new Date(overtimeData.endTime);
                      
                      if (isNaN(startTimeObj.getTime()) || isNaN(endTimeObj.getTime())) {
                        throw new Error('Invalid date format');
                      }
                      
                      const startTimeFormatted = startTimeObj.toLocaleTimeString('th-TH', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                      });
                      
                      const endTimeFormatted = endTimeObj.toLocaleTimeString('th-TH', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                      });
                      
                      console.log('Formatted start time:', startTimeFormatted);
                      console.log('Formatted end time:', endTimeFormatted);
                      console.log('============================');
                      
                      return `${startTimeFormatted} - ${endTimeFormatted} น.`;
                    } catch (error) {
                      console.error('Error formatting overtime time:', error, overtimeData);
                      
                      // ดึงจำนวนชั่วโมงที่ทำ OT
                      const hours = overtimeData.hours || overtimeData.totalHours || 0;
                      return `จำนวน ${hours} ชั่วโมง (ไม่ระบุเวลาแน่ชัด)`;
                    }
                  })()}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-sm text-gray-500 dark:text-gray-400">เวลาทำงาน</div>
                <div className="font-medium mt-1 text-gray-500 italic">
                  {overtimeData.hours || overtimeData.totalHours ? 
                    `จำนวน ${overtimeData.hours || overtimeData.totalHours} ชั่วโมง (ไม่ระบุเวลาแน่ชัด)` : 
                    'ไม่ระบุเวลาทำงาน'}
                </div>
              </div>
            )}

            {overtimeData.reason && (
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-sm text-gray-500 dark:text-gray-400">เหตุผลการทำ OT</div>
                <div className="font-medium mt-1">{overtimeData.reason}</div>
              </div>
            )}

            {overtimeData.description && (
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-sm text-gray-500 dark:text-gray-400">รายละเอียดงาน</div>
                <div className="font-medium mt-1 whitespace-pre-line">{overtimeData.description}</div>
              </div>
            )}
          </div>
        )}

        {/* แสดงแบบฟอร์มสถานะการทำงาน เมื่อไม่มีข้อมูลการลา */}
        {!leaveData && (
          <form onSubmit={handleSubmit}>
            {/* UI สำหรับการตั้งค่าช่วงวันที่ */}
            {!isViewOnly && (
              <div className="mb-4">
                <div className="grid grid-cols-2 gap-3">
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
  );
} 