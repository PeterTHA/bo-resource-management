'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FiCalendar, FiUser, FiClock, FiFileText, FiMessageCircle, 
        FiCheckCircle, FiXCircle, FiArrowLeft, FiDownload, FiInfo, FiMail, FiUsers, FiAlertTriangle, FiEdit, FiTrash2 } from 'react-icons/fi';
import { LoadingPage } from '../../../components/ui/LoadingSpinner';
import ErrorMessage from '../../../components/ui/ErrorMessage';
import ProfileImage from '../../../components/ui/ProfileImage';

// เพิ่มฟังก์ชันตรวจสอบว่าเป็นรูปภาพจาก mock-images หรือไม่
const isMockImage = (src) => {
  return src && typeof src === 'string' && (src.startsWith('/mock-images/') || src.startsWith('./mock-images/'));
};

// เพิ่มฟังก์ชันตรวจสอบว่าเป็นรูปภาพหรือไม่
const isImageFile = (url) => {
  if (!url) return false;
  const extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  return extensions.some(ext => url.toLowerCase().endsWith(ext));
};

export default function LeaveDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [leave, setLeave] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelRejectModal, setShowCancelRejectModal] = useState(false);
  const [cancelRejectReason, setCancelRejectReason] = useState('');
  const [leaveStats, setLeaveStats] = useState({
    sick: 0,
    personal: 0,
    vacation: 0,
    other: 0
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchLeaveDetail = async () => {
      if (!params?.id || !session) return;

      try {
        setLoading(true);
        const res = await fetch(`/api/leaves/${params.id}`);
        const data = await res.json();

        if (data.success) {
          console.log('Leave data:', data.data);
          console.log('Approver data:', data.data.approvedBy);
          setLeave(data.data);
          
          // ถ้าได้ข้อมูลการลา ให้ดึงสถิติการลาของพนักงานคนนี้
          if (data.data.employee) {
            await fetchLeaveStatistics(data.data.employee.id);
          }
        } else {
          setError(data.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลการลา');
        }
      } catch (error) {
        setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaveDetail();
  }, [params?.id, session]);
  
  const fetchLeaveStatistics = async (employeeId) => {
    try {
      const currentYear = new Date().getFullYear();
      const res = await fetch(`/api/leaves?employeeId=${employeeId}`);
      const data = await res.json();
      
      if (data.success) {
        // กรองเฉพาะการลาในปีปัจจุบันที่อนุมัติแล้ว
        const approvedLeaves = data.data.filter(leave => 
          leave.status === 'อนุมัติ' && 
          !leave.isCancelled &&
          new Date(leave.startDate).getFullYear() === currentYear
        );
        
        // คำนวณจำนวนวันลาตามประเภท
        const stats = {
          sick: 0,
          personal: 0,
          vacation: 0,
          other: 0
        };
        
        approvedLeaves.forEach(leave => {
          if (leave.leaveType === 'ลาป่วย') {
            stats.sick += leave.totalDays;
          } else if (leave.leaveType === 'ลากิจ') {
            stats.personal += leave.totalDays;
          } else if (leave.leaveType === 'ลาพักร้อน') {
            stats.vacation += leave.totalDays;
          } else {
            stats.other += leave.totalDays;
          }
        });
        
        setLeaveStats(stats);
      }
    } catch (error) {
      console.error('Error fetching leave statistics:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleApprove = async () => {
    if (!confirm('คุณต้องการอนุมัติการลานี้ใช่หรือไม่?')) {
      return;
    }
    
    try {
      setActionLoading(true);
      const res = await fetch(`/api/leaves/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: 'อนุมัติ',
          approvedById: session.user.id,
          comment: null
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setSuccess('อนุมัติการลาเรียบร้อยแล้ว');
        // รอสักครู่แล้วนำทางไปหน้ารายการลา
        setTimeout(() => {
          router.push('/leaves');
        }, 1500);
      } else {
        setError(data.message || 'เกิดข้อผิดพลาดในการอัปเดตสถานะการลา');
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectModal = () => {
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/leaves/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: 'ไม่อนุมัติ',
          approvedById: session.user.id,
          comment: rejectReason || null
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setSuccess('ปฏิเสธการลาเรียบร้อยแล้ว');
        setShowRejectModal(false);
        // รอสักครู่แล้วนำทางไปหน้ารายการลา
        setTimeout(() => {
          router.push('/leaves');
        }, 1500);
      } else {
        setError(data.message || 'เกิดข้อผิดพลาดในการอัปเดตสถานะการลา');
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('คุณต้องการลบข้อมูลการลานี้ใช่หรือไม่?')) {
      return;
    }
    
    try {
      setActionLoading(true);
      const res = await fetch(`/api/leaves/${params.id}`, {
        method: 'DELETE',
      });
      
      const data = await res.json();
      
      if (data.success) {
        setSuccess('ลบข้อมูลการลาเรียบร้อยแล้ว');
        setTimeout(() => {
          router.push('/leaves');
        }, 1500);
      } else {
        setError(data.message || 'เกิดข้อผิดพลาดในการลบข้อมูลการลา');
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  // ตรวจสอบว่าผู้ใช้มีสิทธิ์อนุมัติหรือไม่
  const canApprove = () => {
    if (!session || !leave) return false;
    
    // แอดมินและหัวหน้างานอนุมัติได้ (ไม่ต้องตรวจสอบว่าเป็นการลาของตัวเองหรือไม่)
    if ((session.user.role === 'admin' || session.user.role === 'supervisor') && 
        leave.status === 'รออนุมัติ') {
      return true;
    }
    
    return false;
  };

  // ตรวจสอบว่าสามารถลบได้หรือไม่
  const canDelete = () => {
    if (!session || !leave) return false;
    
    // พนักงานลบของตัวเองได้ถ้ายังไม่อนุมัติ
    if ((session.user.id === leave.employeeId) && leave.status === 'รออนุมัติ') {
      return true;
    }
    
    // แอดมินลบอะไรก็ได้
    if (session.user.role === 'admin') {
      return true;
    }
    
    return false;
  };

  // ตรวจสอบว่าสามารถแก้ไขได้หรือไม่
  const canEdit = () => {
    if (!session || !leave) return false;
    
    // พนักงานแก้ไขข้อมูลของตัวเองได้ถ้ายังไม่อนุมัติ
    if ((session.user.id === leave.employeeId) && leave.status === 'รออนุมัติ') {
      return true;
    }
    
    // แอดมินแก้ไขได้ทุกรายการที่ยังไม่อนุมัติ
    if (session.user.role === 'admin' && leave.status === 'รออนุมัติ') {
      return true;
    }
    
    return false;
  };

  // ตรวจสอบว่าสามารถขอยกเลิกการลาได้หรือไม่
  const canRequestCancel = () => {
    if (!session || !leave) return false;
    
    // ต้องเป็นเจ้าของหรือแอดมิน
    const isOwnerOrAdmin = session.user.id === leave.employeeId || session.user.role === 'admin';
    
    // ต้องเป็นการลาที่อนุมัติแล้ว และยังไม่ได้ยกเลิก
    // กรณีที่ cancelStatus เป็น null หมายความว่าไม่เคยขอยกเลิกหรือถูกปฏิเสธการยกเลิกและถูกซ่อนสถานะแล้ว (รวมถึงกรณีถูกปฏิเสธการยกเลิก) ก็สามารถขอยกเลิกใหม่ได้
    const isApprovedNotCancelled = leave.status === 'อนุมัติ' && 
                                  !leave.isCancelled && 
                                  leave.cancelStatus !== 'รออนุมัติ' && 
                                  leave.cancelStatus !== 'ยกเลิกแล้ว';
    
    return isOwnerOrAdmin && isApprovedNotCancelled;
  };

  // ตรวจสอบว่าสามารถอนุมัติการยกเลิกการลาได้หรือไม่
  const canApproveCancel = () => {
    if (!session || !leave) return false;
    
    // ต้องเป็นแอดมินหรือหัวหน้างาน
    const isAdminOrSupervisor = session.user.role === 'admin' || session.user.role === 'supervisor';
    
    // ต้องเป็นการลาที่ขอยกเลิกและรออนุมัติ
    const isPendingCancelRequest = leave.cancelStatus === 'รออนุมัติ';
    
    return isAdminOrSupervisor && isPendingCancelRequest;
  };

  // ฟังก์ชันสำหรับขอยกเลิกการลา
  const handleRequestCancel = async () => {
    if (!cancelReason.trim()) {
      setError('กรุณาระบุเหตุผลในการยกเลิกการลา');
      return;
    }
    
    try {
      setActionLoading(true);
      const res = await fetch(`/api/leaves/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'requestCancel',
          reason: cancelReason
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setSuccess(data.message || 'ส่งคำขอยกเลิกการลาเรียบร้อยแล้ว');
        setLeave({
          ...leave,
          ...data.data
        });
        setShowCancelModal(false);
      } else {
        setError(data.message || 'เกิดข้อผิดพลาดในการส่งคำขอยกเลิกการลา');
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  // ฟังก์ชันสำหรับอนุมัติการยกเลิกการลา
  const handleApproveCancel = async () => {
    if (!confirm('คุณต้องการอนุมัติการยกเลิกการลานี้ใช่หรือไม่?')) {
      return;
    }
    
    try {
      setActionLoading(true);
      const res = await fetch(`/api/leaves/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'approveCancel'
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setSuccess(data.message || 'อนุมัติการยกเลิกการลาเรียบร้อยแล้ว');
        // รอสักครู่แล้วนำทางไปหน้ารายการลา
        setTimeout(() => {
          router.push('/leaves');
        }, 1500);
      } else {
        setError(data.message || 'เกิดข้อผิดพลาดในการอนุมัติการยกเลิกการลา');
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  // ฟังก์ชันสำหรับไม่อนุมัติการยกเลิกการลา
  const handleRejectCancel = async () => {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/leaves/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'rejectCancel',
          comment: cancelRejectReason
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setSuccess(data.message || 'ปฏิเสธการขอยกเลิกการลาเรียบร้อยแล้ว');
        setShowCancelRejectModal(false);
        
        // อัปเดตข้อมูลการลาในหน้าเว็บ ทำให้ปุ่มขอยกเลิกปรากฏ
        if (data.data) {
          setLeave(data.data);
        }
        
        // รอสักครู่แล้วนำทางไปหน้ารายการลา
        setTimeout(() => {
          router.push('/leaves');
        }, 1500);
      } else {
        setError(data.message || 'เกิดข้อผิดพลาดในการปฏิเสธการขอยกเลิกการลา');
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  // แสดงหน้าโหลดข้อมูล
  if (loading) {
    return <LoadingPage />;
  }

  // แสดงหน้าเมื่อมีข้อผิดพลาด
  if (error && !leave) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-4">
          <Link href="/leaves" className="btn btn-ghost">
            <FiArrowLeft size={20} className="mr-2" /> กลับไปหน้ารายการ
          </Link>
        </div>
        <ErrorMessage message={error} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* แสดงข้อความสำเร็จ */}
      {success && (
        <div className="alert alert-success mb-4">
          <FiCheckCircle size={20} />
          <span>{success}</span>
        </div>
      )}
      
      {/* แสดงข้อความผิดพลาด */}
      {error && (
        <ErrorMessage message={error} />
      )}
      
      {/* ปุ่มย้อนกลับ */}
      <div className="flex justify-between items-center mb-6">
        <Link href="/leaves" className="btn btn-ghost">
          <FiArrowLeft size={20} className="mr-2" /> กลับไปหน้ารายการ
        </Link>
        
        <div className="flex gap-2">
          {/* ปุ่มแก้ไขข้อมูลการลา */}
          {canEdit() && (
            <Link href={`/leaves/${params.id}/edit`} className="btn btn-secondary">
              <FiEdit size={20} className="mr-2" /> แก้ไข
            </Link>
          )}

          {/* ปุ่มขอยกเลิกการลา */}
          {canRequestCancel() && (
            <button
              className="btn btn-warning"
              onClick={() => setShowCancelModal(true)}
              disabled={actionLoading}
            >
              <FiXCircle size={20} className="mr-2" /> ขอยกเลิกการลา
            </button>
          )}
          
          {/* ปุ่มลบ */}
          {canDelete() && (
            <button
              className="btn btn-error"
              onClick={handleDelete}
              disabled={actionLoading}
            >
              <FiTrash2 size={20} className="mr-2" /> ลบข้อมูลการลา
            </button>
          )}
        </div>
      </div>
      
      {/* แสดงข้อมูลการลา */}
      {leave && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* คอลัมน์ซ้าย: ข้อมูลหลัก */}
          <div className="md:col-span-2">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title text-2xl mb-4 flex items-center flex-wrap">
                  <span className="mr-2">รายละเอียดการลา</span>
                  <div className={`badge ${
                    leave.status === 'อนุมัติ' ? 'badge-success' : 
                    leave.status === 'ไม่อนุมัติ' ? 'badge-error' : 
                    'badge-warning'
                  } badge-lg mr-2`}>
                    {leave.status}
                  </div>
                  
                  {/* แสดงสถานะการยกเลิก */}
                  {leave.cancelStatus && (
                    <div className={`badge ${
                      leave.cancelStatus === 'อนุมัติ' ? 'badge-info' : 
                      leave.cancelStatus === 'ไม่อนุมัติ' ? 'badge-error' : 
                      'badge-warning'
                    } badge-lg`}>
                      {leave.cancelStatus === 'อนุมัติ' ? 'ยกเลิกแล้ว' : 
                      leave.cancelStatus === 'ไม่อนุมัติ' ? 'ปฏิเสธการยกเลิก' : 
                      'รอยกเลิก'}
                    </div>
                  )}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-2">
                    <FiFileText size={20} className="mt-1 text-primary" />
                    <div>
                      <div className="font-semibold">ประเภทการลา</div>
                      <div>{leave.leaveType}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <FiCalendar size={20} className="mt-1 text-primary" />
                    <div>
                      <div className="font-semibold">วันที่ลา</div>
                      <div>
                        {formatDate(leave.startDate)} 
                        {leave.startDate !== leave.endDate && ` ถึง ${formatDate(leave.endDate)}`}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <FiClock size={20} className="mt-1 text-primary" />
                    <div>
                      <div className="font-semibold">รูปแบบการลา</div>
                      <div>{leave.leaveFormat || 'เต็มวัน'}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <FiInfo size={20} className="mt-1 text-primary" />
                    <div>
                      <div className="font-semibold">จำนวนวันลา</div>
                      <div>{leave.totalDays} วัน</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2 md:col-span-2">
                    <FiMessageCircle size={20} className="mt-1 text-primary" />
                    <div>
                      <div className="font-semibold">เหตุผลการลา</div>
                      <div className="whitespace-pre-wrap">{leave.reason}</div>
                    </div>
                  </div>
                  
                  {leave.attachments && leave.attachments.length === 0 && leave.attachmentUrl && (
                    <div className="flex items-start gap-2 md:col-span-2">
                      <FiFileText size={20} className="mt-1 text-primary" />
                      <div>
                        <div className="font-semibold">เอกสารแนบ</div>
                        <div>
                          {isImageFile(leave.attachmentUrl) ? (
                            <div className="mt-2">
                              <Image 
                                src={leave.attachmentUrl}
                                alt="Attachment"
                                width={300}
                                height={200}
                                className="rounded-md"
                              />
                            </div>
                          ) : (
                            <a 
                              href={leave.attachmentUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="btn btn-primary btn-sm mt-2"
                            >
                              <FiDownload size={16} className="mr-2" /> ดาวน์โหลดเอกสาร
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {leave.attachments && leave.attachments.length > 0 && (
                    <div className="flex items-start gap-2 md:col-span-2">
                      <FiFileText size={20} className="mt-1 text-primary" />
                      <div className="w-full">
                        <div className="font-semibold">เอกสารแนบ ({leave.attachments.length})</div>
                        <div className="mt-2 space-y-2">
                          {leave.attachments.map((attachment, index) => {
                            const fileName = attachment.split('/').pop();
                            return (
                              <div key={index} className="flex items-center justify-between bg-base-200 p-2 px-3 rounded-md">
                                <div className="flex items-center flex-1 overflow-hidden">
                                  <FiFileText className="mr-2 text-primary flex-shrink-0" />
                                  <span className="truncate">{fileName}</span>
                                </div>
                                <div className="flex">
                                  {isImageFile(attachment) && (
                                    <a 
                                      href={attachment} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="btn btn-ghost btn-sm"
                                      title="ดูรูปภาพ"
                                    >
                                      <FiFileText size={16} />
                                    </a>
                                  )}
                                  <a 
                                    href={attachment} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    download
                                    className="btn btn-ghost btn-sm text-primary"
                                    title="ดาวน์โหลด"
                                  >
                                    <FiDownload size={16} />
                                  </a>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* ข้อมูลการอนุมัติ */}
                {leave.status !== 'รออนุมัติ' && (
                  <div className="mt-6 border-t border-gray-200 pt-4">
                    <h3 className="font-semibold text-lg mb-2">ข้อมูลการอนุมัติ</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start gap-2">
                        <FiUser size={20} className="mt-1 text-primary" />
                        <div>
                          <div className="font-semibold">ผู้อนุมัติ</div>
                          <div>
                            {leave.approvedBy ? 
                              `${leave.approvedBy.firstName || ''} ${leave.approvedBy.lastName || ''}` : 
                              'ไม่ระบุ'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <FiCalendar size={20} className="mt-1 text-primary" />
                        <div>
                          <div className="font-semibold">วันที่อนุมัติ</div>
                          <div>{formatDateTime(leave.approvedAt)}</div>
                        </div>
                      </div>
                      
                      {leave.comment && (
                        <div className="flex items-start gap-2 md:col-span-2">
                          <FiMessageCircle size={20} className="mt-1 text-primary" />
                          <div>
                            <div className="font-semibold">ความเห็น</div>
                            <div className="whitespace-pre-wrap">{leave.comment}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* ข้อมูลการขอยกเลิก */}
                {leave.cancelStatus && (
                  <div className="mt-6 border-t border-gray-200 pt-4">
                    <h3 className="font-semibold text-lg mb-2">ข้อมูลการยกเลิก</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start gap-2">
                        <FiAlertTriangle size={20} className="mt-1 text-primary" />
                        <div>
                          <div className="font-semibold">สถานะการยกเลิก</div>
                          <div>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              leave.cancelStatus === 'อนุมัติ' ? 'bg-blue-100 text-blue-800' : 
                              leave.cancelStatus === 'ไม่อนุมัติ' ? 'bg-red-100 text-red-800' : 
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {leave.cancelStatus}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <FiCalendar size={20} className="mt-1 text-primary" />
                        <div>
                          <div className="font-semibold">วันที่ขอยกเลิก</div>
                          <div>{formatDateTime(leave.cancelRequestedAt)}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2 md:col-span-2">
                        <FiMessageCircle size={20} className="mt-1 text-primary" />
                        <div>
                          <div className="font-semibold">เหตุผลการยกเลิก</div>
                          <div className="whitespace-pre-wrap">{leave.cancelReason}</div>
                        </div>
                      </div>
                      
                      {leave.cancelStatus !== 'รออนุมัติ' && (
                        <>
                          {leave.cancelApprovedById && (
                            <div className="flex items-start gap-2">
                              <FiUser size={20} className="mt-1 text-primary" />
                              <div>
                                <div className="font-semibold">ผู้อนุมัติการยกเลิก</div>
                                <div>
                                  {leave.cancelApprovedBy ? 
                                    `${leave.cancelApprovedBy.firstName || ''} ${leave.cancelApprovedBy.lastName || ''}` : 
                                    'ไม่ระบุ'}
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {leave.cancelApprovedAt && (
                            <div className="flex items-start gap-2">
                              <FiCalendar size={20} className="mt-1 text-primary" />
                              <div>
                                <div className="font-semibold">วันที่อนุมัติการยกเลิก</div>
                                <div>{formatDateTime(leave.cancelApprovedAt)}</div>
                              </div>
                            </div>
                          )}
                          
                          {leave.cancelComment && (
                            <div className="flex items-start gap-2 md:col-span-2">
                              <FiMessageCircle size={20} className="mt-1 text-primary" />
                              <div>
                                <div className="font-semibold">ความเห็นเกี่ยวกับการยกเลิก</div>
                                <div className="whitespace-pre-wrap">{leave.cancelComment}</div>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
                
                {/* ปุ่มอนุมัติยกเลิก/ปฏิเสธยกเลิก */}
                {canApproveCancel() && (
                  <div className="mt-6 border-t border-gray-200 pt-4 flex gap-2">
                    <button
                      className="btn btn-info flex-1"
                      onClick={handleApproveCancel}
                      disabled={actionLoading}
                    >
                      <FiCheckCircle size={20} className="mr-2" /> อนุมัติการยกเลิก
                    </button>
                    <button
                      className="btn btn-error flex-1"
                      onClick={() => setShowCancelRejectModal(true)}
                      disabled={actionLoading}
                    >
                      <FiXCircle size={20} className="mr-2" /> ไม่อนุมัติการยกเลิก
                    </button>
                  </div>
                )}
                
                {/* ปุ่มอนุมัติ/ปฏิเสธ */}
                {canApprove() && (
                  <div className="mt-6 border-t border-gray-200 pt-4 flex gap-2">
                    <button
                      className="btn btn-success flex-1"
                      onClick={handleApprove}
                      disabled={actionLoading}
                    >
                      <FiCheckCircle size={20} className="mr-2" /> อนุมัติ
                    </button>
                    <button
                      className="btn btn-error flex-1"
                      onClick={openRejectModal}
                      disabled={actionLoading}
                    >
                      <FiXCircle size={20} className="mr-2" /> ไม่อนุมัติ
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* คอลัมน์ขวา: ข้อมูลพนักงาน */}
          <div>
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title text-xl mb-4">ข้อมูลพนักงาน</h2>
                
                {leave.employee && (
                  <div className="flex flex-col items-center mb-4">
                    <div className="mb-3">
                      <ProfileImage 
                        src={leave.employee.image}
                        alt={`${leave.employee.firstName} ${leave.employee.lastName}`}
                        size="lg"
                        fallbackText={`${leave.employee.firstName} ${leave.employee.lastName}`}
                      />
                    </div>
                    <h3 className="font-semibold text-lg text-center">
                      {leave.employee.firstName} {leave.employee.lastName}
                    </h3>
                    <p className="text-gray-500 text-center">
                      {leave.employee.position}
                      {leave.employee.positionLevel && ` (${leave.employee.positionLevel})`}
                    </p>
                  </div>
                )}
                
                <div className="space-y-3 mt-3">
                  {leave.employee?.email && (
                    <div className="flex items-start gap-2">
                      <FiMail size={20} className="mt-1 text-primary" />
                      <div>
                        <div className="font-semibold">อีเมล</div>
                        <div>{leave.employee.email}</div>
                      </div>
                    </div>
                  )}
                  
                  {leave.employee?.department && (
                    <div className="flex items-start gap-2">
                      <FiInfo size={20} className="mt-1 text-primary" />
                      <div>
                        <div className="font-semibold">แผนก</div>
                        <div>{leave.employee.department.name}</div>
                      </div>
                    </div>
                  )}
                  
                  {leave.employee?.teamData && (
                    <div className="flex items-start gap-2">
                      <FiUsers size={20} className="mt-1 text-primary" />
                      <div>
                        <div className="font-semibold">ทีม</div>
                        <div>{leave.employee.teamData.name}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* สรุปการลา */}
            <div className="card bg-base-100 shadow-xl mt-6">
              <div className="card-body">
                <h2 className="card-title text-xl mb-4">สรุปการลาใน {new Date().getFullYear()}</h2>
                
                <div className="overflow-x-auto">
                  <table className="table table-zebra w-full">
                    <thead>
                      <tr>
                        <th>ประเภทการลา</th>
                        <th className="text-right">จำนวน</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>ลาป่วย</td>
                        <td className="text-right">{leaveStats.sick} วัน</td>
                      </tr>
                      <tr>
                        <td>ลากิจ</td>
                        <td className="text-right">{leaveStats.personal} วัน</td>
                      </tr>
                      <tr>
                        <td>ลาพักร้อน</td>
                        <td className="text-right">{leaveStats.vacation} วัน</td>
                      </tr>
                      {leaveStats.other > 0 && (
                        <tr>
                          <td>อื่นๆ</td>
                          <td className="text-right">{leaveStats.other} วัน</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal สำหรับการขอยกเลิกการลา */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">ขอยกเลิกการลา</h3>
            
            <textarea
              className="textarea textarea-bordered w-full h-32"
              placeholder="ระบุเหตุผลในการขอยกเลิกการลา"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            ></textarea>
            
            <div className="flex justify-end mt-4 gap-2">
              <button
                className="btn btn-ghost"
                onClick={() => setShowCancelModal(false)}
                disabled={actionLoading}
              >
                ยกเลิก
              </button>
              <button
                className="btn btn-warning"
                onClick={handleRequestCancel}
                disabled={actionLoading}
              >
                ยืนยันการขอยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal สำหรับการไม่อนุมัติ */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">ระบุเหตุผลในการไม่อนุมัติ</h3>
            
            <textarea
              className="textarea textarea-bordered w-full h-32"
              placeholder="ระบุเหตุผลในการไม่อนุมัติการลา"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            ></textarea>
            
            <div className="flex justify-end mt-4 gap-2">
              <button
                className="btn btn-ghost"
                onClick={() => setShowRejectModal(false)}
                disabled={actionLoading}
              >
                ยกเลิก
              </button>
              <button
                className="btn btn-error"
                onClick={handleReject}
                disabled={actionLoading}
              >
                ไม่อนุมัติ
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal สำหรับการไม่อนุมัติการยกเลิก */}
      {showCancelRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">ระบุเหตุผลในการไม่อนุมัติการยกเลิก</h3>
            
            <textarea
              className="textarea textarea-bordered w-full h-32"
              placeholder="ระบุเหตุผลในการไม่อนุมัติการยกเลิกการลา"
              value={cancelRejectReason}
              onChange={(e) => setCancelRejectReason(e.target.value)}
            ></textarea>
            
            <div className="flex justify-end mt-4 gap-2">
              <button
                className="btn btn-ghost"
                onClick={() => setShowCancelRejectModal(false)}
                disabled={actionLoading}
              >
                ยกเลิก
              </button>
              <button
                className="btn btn-error"
                onClick={handleRejectCancel}
                disabled={actionLoading}
              >
                ไม่อนุมัติการยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* ส่วนแสดงข้อมูลสถานะทั้งหมดของการลา (Transaction Logs) */}
      {leave && leave.transactionLogs && leave.transactionLogs.length > 0 && (
        <div className="mt-8">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-xl mb-4">ประวัติการทำรายการ</h2>
              
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th>วันที่</th>
                      <th>ประเภทรายการ</th>
                      <th>ผู้ดำเนินการ</th>
                      <th>สถานะ</th>
                      <th>รายละเอียด</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leave.transactionLogs.map(log => (
                      <tr key={log.id}>
                        <td className="whitespace-nowrap">{formatDateTime(log.createdAt)}</td>
                        <td>
                          {log.type === 'approve' ? 'อนุมัติ' : 
                           log.type === 'reject' ? 'ไม่อนุมัติ' : 
                           log.type === 'request_cancel' ? 'ขอยกเลิก' : 
                           log.type === 'approve_cancel' ? 'อนุมัติการยกเลิก' : 
                           log.type === 'reject_cancel' ? 'ปฏิเสธการยกเลิก' : log.type}
                        </td>
                        <td className="whitespace-nowrap">
                          {log.employee ? 
                            `${log.employee.firstName || ''} ${log.employee.lastName || ''}` : 
                            'ไม่ระบุ'}
                        </td>
                        <td>
                          <div className={`badge ${
                            log.status === 'completed' ? 'badge-success' : 'badge-warning'
                          } badge-sm`}>
                            {log.status === 'completed' ? 'สำเร็จ' : 'รอดำเนินการ'}
                          </div>
                        </td>
                        <td>
                          {(log.reason || log.comment) && (
                            <div className="max-w-xs truncate">
                              {log.reason || log.comment}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
