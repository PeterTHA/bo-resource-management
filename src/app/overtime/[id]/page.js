'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FiClock, FiUser, FiCalendar, FiFileText, FiMessageCircle, 
        FiCheckCircle, FiXCircle, FiArrowLeft, FiInfo, FiEdit, FiTrash2, FiBarChart2 } from 'react-icons/fi';
import { LoadingPage } from '../../../components/ui/LoadingSpinner';
import ErrorMessage from '../../../components/ui/ErrorMessage';
import ProfileImage from '../../../components/ui/ProfileImage';

// เพิ่มฟังก์ชันตรวจสอบว่าเป็นรูปภาพจาก mock-images หรือไม่
const isMockImage = (src) => {
  return src && typeof src === 'string' && (src.startsWith('/mock-images/') || src.startsWith('./mock-images/'));
};

export default function OvertimeDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [overtime, setOvertime] = useState(null);
  const [monthlySummary, setMonthlySummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRejectCancelModal, setShowRejectCancelModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const fetchOvertimeDetails = async () => {
    if (!params?.id || !session) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/overtime/${params.id}`);
      const data = await res.json();

      if (data.success) {
        console.log('Overtime data:', data.data);
        setOvertime(data.data);
        
        // ดึงข้อมูลสรุปการทำงานล่วงเวลาตามเดือน
        if (data.data.employee?.id) {
          const currentYear = new Date().getFullYear();
          const startDate = new Date(currentYear, 0, 1); // มกราคม
          const endDate = new Date(); // วันปัจจุบัน
          
          const summaryRes = await fetch(`/api/overtime?employeeId=${data.data.employee.id}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&summary=true`);
          const summaryData = await summaryRes.json();
          
          if (summaryData.success) {
            setMonthlySummary(summaryData.data.monthlySummary || []);
          }
        }
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

  useEffect(() => {
    fetchOvertimeDetails();
  }, [params?.id, session]);

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
    if (!confirm('คุณต้องการอนุมัติการทำงานล่วงเวลานี้ใช่หรือไม่?')) {
      return;
    }
    
    try {
      setActionLoading(true);
      const res = await fetch(`/api/overtime/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'approve',
          comment: null
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setSuccess('อนุมัติการทำงานล่วงเวลาเรียบร้อยแล้ว');
        // รอสักครู่แล้วนำทางไปหน้ารายการการทำงานล่วงเวลา
        setTimeout(() => {
          router.push('/overtime');
        }, 1500);
      } else {
        setError(data.message || 'เกิดข้อผิดพลาดในการอัปเดตสถานะการทำงานล่วงเวลา');
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
      const res = await fetch(`/api/overtime/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'reject',
          comment: rejectReason
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setSuccess('ปฏิเสธการทำงานล่วงเวลาเรียบร้อยแล้ว');
        setShowRejectModal(false);
        // รอสักครู่แล้วนำทางไปหน้ารายการการทำงานล่วงเวลา
        setTimeout(() => {
          router.push('/overtime');
        }, 1500);
      } else {
        setError(data.message || 'เกิดข้อผิดพลาดในการอัปเดตสถานะการทำงานล่วงเวลา');
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('คุณต้องการลบรายการทำงานล่วงเวลานี้ใช่หรือไม่? การดำเนินการนี้ไม่สามารถยกเลิกได้')) {
      return;
    }
    
    try {
      setActionLoading(true);
      const res = await fetch(`/api/overtime/${params.id}`, {
        method: 'DELETE',
      });
      
      const data = await res.json();
      
      if (data.success) {
        setSuccess('ลบรายการทำงานล่วงเวลาเรียบร้อยแล้ว');
        // รอสักครู่แล้วนำทางไปหน้ารายการการทำงานล่วงเวลา
        setTimeout(() => {
          router.push('/overtime');
        }, 1500);
      } else {
        setError(data.message || 'เกิดข้อผิดพลาดในการลบรายการทำงานล่วงเวลา');
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const canApprove = () => {
    if (!session || !overtime) return false;
    
    // แอดมินอนุมัติได้ทุกรายการที่มีสถานะเป็น "รออนุมัติ"
    if (session.user.role === 'admin' && overtime.status === 'waiting_for_approve') {
      return true;
    }
    
    // หัวหน้างานอนุมัติได้ รวมถึงอนุมัติให้กับหัวหน้างานอื่นในทีมเดียวกัน และอนุมัติตัวเองด้วย
    if (session.user.role === 'supervisor' && overtime.status === 'waiting_for_approve') {
      // ถ้าเป็นแผนกเดียวกัน อนุมัติได้ ไม่ว่าจะเป็นหัวหน้าหรือพนักงานทั่วไป
      if (overtime.employee?.departmentId === session.user.departmentId) {
        return true;
      }
    }
    
    return false;
  };

  const canDelete = () => {
    if (!session || !overtime) return false;
    
    // สามารถลบได้ถ้าเป็นเจ้าของหรือแอดมิน และสถานะยังเป็น "รออนุมัติ"
    return (
      (session.user.id === overtime.employeeId || session.user.role === 'admin') && 
      overtime.status === 'waiting_for_approve' &&
      overtime.cancelStatus !== 'waiting_for_approve'
    );
  };

  const canEdit = () => {
    if (!session || !overtime) return false;
    
    // สามารถแก้ไขได้ถ้าเป็นเจ้าของหรือแอดมิน และสถานะยังเป็น "รออนุมัติ"
    return (
      (session.user.id === overtime.employeeId || session.user.role === 'admin') && 
      overtime.status === 'waiting_for_approve'
    );
  };

  const openCancelModal = () => {
    setCancelReason('');
    setShowCancelModal(true);
  };

  const handleCancelRequest = async () => {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/overtime/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'request_cancel',
          reason: cancelReason
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setSuccess('ส่งคำขอยกเลิกการทำงานล่วงเวลาเรียบร้อยแล้ว');
        setShowCancelModal(false);
        // รอสักครู่แล้วนำทางไปหน้ารายการการทำงานล่วงเวลา
        setTimeout(() => {
          router.push('/overtime');
        }, 1500);
      } else {
        setError(data.message || 'เกิดข้อผิดพลาดในการรอยกเลิกการทำงานล่วงเวลา');
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const canCancelRequest = () => {
    if (!session || !overtime) return false;
    
    // ตรวจสอบว่ามี approvals ข้อมูลและมีรูปแบบถูกต้อง
    if (!overtime.approvals || !Array.isArray(overtime.approvals)) return false;
    
    // เรียงลำดับตาม createdAt จากใหม่ไปเก่า
    const sortedApprovals = [...overtime.approvals].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    // หาการกระทำล่าสุดที่เกี่ยวข้องกับการขอยกเลิก (ถ้ามี)
    const cancelRelatedActions = sortedApprovals.filter(a => 
      ['request_cancel', 'approve_cancel', 'reject_cancel'].includes(a.type) && 
      a.status === 'completed'
    );
    
    // สถานะปัจจุบันต้องเป็น approved
    const isApproved = overtime.status === 'approved';
    
    // ถ้าไม่มีคำขอยกเลิกใดๆ และสถานะเป็น approved
    if (cancelRelatedActions.length === 0 && isApproved) {
      return session.user.id === overtime.employeeId;
    }
    
    // ถ้ามีคำขอยกเลิก
    if (cancelRelatedActions.length > 0) {
      // การกระทำล่าสุดต้องเป็นการปฏิเสธการยกเลิก (reject_cancel)
      const latestAction = cancelRelatedActions[0];
      if (latestAction.type === 'reject_cancel' && isApproved) {
        return session.user.id === overtime.employeeId;
      }
    }
    
    // กรณีอื่นๆ ไม่สามารถขอยกเลิกได้
    return false;
  };

  // ฟังก์ชันตรวจสอบว่าสามารถจัดการคำขอยกเลิกได้หรือไม่
  const canManageCancel = () => {
    if (!overtime || !session) return false;
    
    const isAdmin = session.user.role === 'admin';
    const isSupervisor = session.user.role === 'supervisor';
    
    // ถ้าไม่ใช่แอดมินหรือผู้จัดการ ไม่สามารถจัดการคำขอยกเลิกได้
    if (!isAdmin && !isSupervisor) return false;
    
    // ตรวจสอบว่ามี approvals ข้อมูลและมีรูปแบบถูกต้อง
    if (!overtime.approvals || !Array.isArray(overtime.approvals)) return false;
    
    // เรียงลำดับตาม createdAt จากใหม่ไปเก่า
    const sortedApprovals = [...overtime.approvals].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    // หาการกระทำล่าสุดที่เกี่ยวข้องกับการขอยกเลิก
    const cancelRelatedActions = sortedApprovals.filter(a => 
      ['request_cancel', 'approve_cancel', 'reject_cancel'].includes(a.type) && 
      a.status === 'completed'
    );
    
    // ถ้าไม่มีคำขอยกเลิกใดๆ
    if (cancelRelatedActions.length === 0) return false;
    
    // การกระทำล่าสุดต้องเป็นการขอยกเลิก (request_cancel)
    const latestAction = cancelRelatedActions[0];
    if (latestAction.type !== 'request_cancel') return false;
    
    // สถานะปัจจุบันต้องเป็น approved
    if (overtime.status !== 'approved') return false;
    
    // ถ้าเป็นหัวหน้างาน ตรวจสอบว่าพนักงานอยู่ในแผนกเดียวกัน
    if (isSupervisor) {
      return !overtime.employee?.departmentId || !session.user.departmentId || 
             overtime.employee?.departmentId === session.user.departmentId;
    }
    
    // แอดมินสามารถจัดการได้เสมอ
    return true;
  };

  // เพิ่มฟังก์ชันสำหรับการอนุมัติการยกเลิก
  const handleApproveCancel = async () => {
    if (!confirm('คุณต้องการอนุมัติการยกเลิกการทำงานล่วงเวลานี้ใช่หรือไม่?')) {
      return;
    }
    
    try {
      setActionLoading(true);
      const res = await fetch(`/api/overtime/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'approve_cancel',
          comment: null
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setSuccess('อนุมัติการยกเลิกการทำงานล่วงเวลาเรียบร้อยแล้ว');
        // รอสักครู่แล้วนำทางไปหน้ารายการการทำงานล่วงเวลา
        setTimeout(() => {
          router.push('/overtime');
        }, 1500);
      } else {
        setError(data.message || 'เกิดข้อผิดพลาดในการอนุมัติการยกเลิกการทำงานล่วงเวลา');
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  // เพิ่มฟังก์ชันสำหรับการไม่อนุมัติการยกเลิก
  const openRejectCancelModal = () => {
    setShowRejectCancelModal(true);
    setCancelReason('');
  };

  // ฟังก์ชันสำหรับการไม่อนุมัติการยกเลิก
  const handleRejectCancel = async () => {
    if (!cancelReason.trim()) return;
    
    try {
      setActionLoading(true);
      const res = await fetch(`/api/overtime/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'reject_cancel',
          comment: cancelReason.trim()
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setSuccess('ปฏิเสธการยกเลิกการทำงานล่วงเวลาเรียบร้อยแล้ว');
        setShowRejectCancelModal(false);
        setCancelReason('');
        
        // อัปเดตข้อมูลการทำงานล่วงเวลา
        fetchOvertimeDetails();
      } else {
        setError(data.message || 'เกิดข้อผิดพลาดในการปฏิเสธการยกเลิกการทำงานล่วงเวลา');
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const getTransactionTypeText = (type) => {
    switch (type) {
      case 'approve':
        return 'อนุมัติ';
      case 'reject':
        return 'ไม่อนุมัติ';
      case 'request_cancel':
        return 'ขอยกเลิก';
      case 'approve_cancel':
        return 'อนุมัติการยกเลิก';
      case 'reject_cancel':
        return 'ปฏิเสธการยกเลิก';
      default:
        return type;
    }
  };

  const getTransactionStatusText = (status, type) => {
    if (status === 'completed') {
      // สำหรับ reject_cancel ให้แสดงว่า "สำเร็จ" แทนที่จะเป็น "รอดำเนินการ"
      if (type === 'reject_cancel') {
        return 'สำเร็จ';
      }
      return 'สำเร็จ';
    }
    return 'รอดำเนินการ';
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
          <FiClock className="mr-2 text-primary" /> รายละเอียดการทำงานล่วงเวลา
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
      
      {overtime && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* คอลัมน์ซ้าย: ข้อมูลการทำงานล่วงเวลา */}
          <div className="lg:col-span-2">
            <div className="card bg-base-100 shadow-xl overflow-hidden">
              <div className="card-body p-6">
                <div className="flex flex-col md:flex-row justify-between mb-6">
                  <div className="flex-1 mb-4 md:mb-0">
                    <div className="flex items-center gap-2">
                      {/* แสดงสถานะหลัก */}
                      {(() => {
                        // ตรวจสอบสถานะการยกเลิกจาก approvals
                        if (overtime.isCancelled) {
                          return (
                            <div className="badge badge-info py-3 px-4 text-sm font-medium">
                              ยกเลิกแล้ว
                            </div>
                          );
                        }
                        
                        // ตรวจสอบว่ามีคำขอยกเลิกล่าสุดที่ยังไม่ได้ดำเนินการหรือไม่
                        if (overtime.approvals && Array.isArray(overtime.approvals)) {
                          const sortedApprovals = [...overtime.approvals].sort((a, b) => 
                            new Date(b.createdAt) - new Date(a.createdAt)
                          );
                          
                          const latestCancelAction = sortedApprovals.find(a => 
                            ['request_cancel', 'approve_cancel', 'reject_cancel'].includes(a.type) && 
                            a.status === 'completed'
                          );
                          
                          if (latestCancelAction && 
                              latestCancelAction.type === 'request_cancel' && 
                              overtime.status === 'approved') {
                            return (
                              <div className="badge badge-warning py-3 px-4 text-sm font-medium">
                                รออนุมัติการยกเลิก
                              </div>
                            );
                          }
                        }
                        
                        // ถ้าไม่มีการยกเลิก ให้แสดงสถานะปกติ
                        return (
                          <div className={`badge ${overtime.status === 'approved' ? 'badge-success' : 
                                                overtime.status === 'rejected' ? 'badge-error' : 
                                                overtime.status === 'waiting_for_cancel' ? 'badge-warning' :
                                                overtime.status === 'canceled' ? 'badge-ghost' : 
                                                'badge-warning'} py-3 px-4 text-sm font-medium`}>
                            {overtime.status === 'approved' ? 'อนุมัติ' : 
                            overtime.status === 'rejected' ? 'ไม่อนุมัติ' :
                            overtime.status === 'canceled' ? 'ยกเลิก' :
                            overtime.status === 'waiting_for_approve' ? 'รออนุมัติ' : overtime.status}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {canEdit() && (
                      <Link
                        href={`/overtime/${params.id}/edit`}
                        className="btn btn-sm btn-outline"
                      >
                        <FiEdit className="mr-1.5" />
                        <span>แก้ไข</span>
                      </Link>
                    )}
                    
                    {canDelete() && (
                      <button
                        onClick={handleDelete}
                        disabled={actionLoading}
                        className="btn btn-sm btn-error text-white"
                      >
                        <FiTrash2 className="mr-1.5" />
                        <span>ลบ</span>
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="divider my-1"></div>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-2">
                      <FiCalendar size={20} className="mt-1 text-primary" />
                      <div>
                        <div className="font-semibold">วันที่ทำงานล่วงเวลา</div>
                        <div>{formatDate(overtime.date)}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <FiClock size={20} className="mt-1 text-primary" />
                      <div>
                        <div className="font-semibold">เวลา</div>
                        <div>{overtime.startTime} - {overtime.endTime} น. ({overtime.totalHours} ชั่วโมง)</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <FiFileText size={20} className="mt-1 text-primary" />
                    <div>
                      <div className="font-semibold">เหตุผลการทำงานล่วงเวลา</div>
                      <div className="whitespace-pre-line">{overtime.reason}</div>
                    </div>
                  </div>
                  
                  {overtime.comment && (
                    <div className="flex items-start gap-2">
                      <FiMessageCircle size={20} className="mt-1 text-primary" />
                      <div>
                        <div className="font-semibold">ความเห็น</div>
                        <div className="whitespace-pre-line">{overtime.comment}</div>
                      </div>
                    </div>
                  )}
                  
                  {overtime.cancelReason && (
                    <div className="flex items-start gap-2">
                      <FiMessageCircle size={20} className="mt-1 text-error" />
                      <div>
                        <div className="font-semibold">เหตุผลการขอยกเลิก</div>
                        <div className="whitespace-pre-line">{overtime.cancelReason}</div>
                      </div>
                    </div>
                  )}
                  
                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="font-semibold text-lg mb-2">ข้อมูลสถานะ</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start gap-2">
                        <FiInfo size={20} className="mt-1 text-primary" />
                        <div>
                          <div className="font-semibold">สร้างเมื่อ</div>
                          <div>{formatDateTime(overtime.createdAt)}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <FiInfo size={20} className="mt-1 text-primary" />
                        <div>
                          <div className="font-semibold">อัปเดตล่าสุด</div>
                          <div>{formatDateTime(overtime.updatedAt)}</div>
                        </div>
                      </div>
                      
                      {overtime.approvedBy && (
                        <div className="flex items-start gap-2">
                          <FiUser size={20} className="mt-1 text-primary" />
                          <div>
                            <div className="font-semibold">อนุมัติ/ไม่อนุมัติโดย</div>
                            <div>
                              {overtime.approvedBy?.firstName} {overtime.approvedBy?.lastName}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {overtime.approvedAt && (
                        <div className="flex items-start gap-2">
                          <FiCalendar size={20} className="mt-1 text-primary" />
                          <div>
                            <div className="font-semibold">เวลาที่อนุมัติ/ไม่อนุมัติ</div>
                            <div>{formatDateTime(overtime.approvedAt)}</div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* ข้อมูลการขอยกเลิก */}
                    {overtime.cancelRequestBy && (
                      <div className="mt-6 border-t border-gray-200 pt-4">
                        <h3 className="font-semibold text-lg mb-2">ข้อมูลการยกเลิก</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-start gap-2">
                            <FiUser size={20} className="mt-1 text-primary" />
                            <div>
                              <div className="font-semibold">รอยกเลิกโดย</div>
                              <div>
                                {overtime.cancelRequestBy?.firstName} {overtime.cancelRequestBy?.lastName}
                              </div>
                            </div>
                          </div>
                          
                          {overtime.cancelRequestAt && (
                            <div className="flex items-start gap-2">
                              <FiCalendar size={20} className="mt-1 text-primary" />
                              <div>
                                <div className="font-semibold">วันที่รอยกเลิก</div>
                                <div>{formatDateTime(overtime.cancelRequestAt)}</div>
                              </div>
                            </div>
                          )}
                          
                          {overtime.cancelledBy && (
                            <div className="flex items-start gap-2">
                              <FiUser size={20} className="mt-1 text-primary" />
                              <div>
                                <div className="font-semibold">อนุมัติการยกเลิกโดย</div>
                                <div>
                                  {overtime.cancelledBy?.firstName} {overtime.cancelledBy?.lastName}
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {overtime.cancelledAt && (
                            <div className="flex items-start gap-2">
                              <FiCalendar size={20} className="mt-1 text-primary" />
                              <div>
                                <div className="font-semibold">วันที่อนุมัติการยกเลิก</div>
                                <div>{formatDateTime(overtime.cancelledAt)}</div>
                              </div>
                            </div>
                          )}
                          
                          {overtime.cancelResponseBy && overtime.cancelStatus === 'rejected' && (
                            <div className="flex items-start gap-2">
                              <FiUser size={20} className="mt-1 text-error" />
                              <div>
                                <div className="font-semibold">ไม่อนุมัติการยกเลิกโดย</div>
                                <div>
                                  {overtime.cancelResponseBy?.firstName} {overtime.cancelResponseBy?.lastName}
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {overtime.cancelResponseAt && overtime.cancelStatus === 'rejected' && (
                            <div className="flex items-start gap-2">
                              <FiCalendar size={20} className="mt-1 text-error" />
                              <div>
                                <div className="font-semibold">วันที่ไม่อนุมัติการยกเลิก</div>
                                <div>{formatDateTime(overtime.cancelResponseAt)}</div>
                              </div>
                            </div>
                          )}
                          
                          {overtime.cancelResponseComment && overtime.cancelStatus === 'rejected' && (
                            <div className="flex items-start gap-2 md:col-span-2">
                              <FiMessageCircle size={20} className="mt-1 text-error" />
                              <div>
                                <div className="font-semibold">เหตุผลการไม่อนุมัติการยกเลิก</div>
                                <div className="whitespace-pre-line">{overtime.cancelResponseComment}</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
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
                  
                  {/* ปุ่มอนุมัติ/ไม่อนุมัติการยกเลิก */}
                  {canManageCancel() && (
                    <div className="mt-6 border-t border-gray-200 pt-4 flex gap-2">
                      <button
                        className="btn btn-success flex-1"
                        onClick={handleApproveCancel}
                        disabled={actionLoading}
                      >
                        <FiCheckCircle size={20} className="mr-2" /> อนุมัติการยกเลิก
                      </button>
                      <button
                        className="btn btn-error flex-1"
                        onClick={openRejectCancelModal}
                        disabled={actionLoading}
                      >
                        <FiXCircle size={20} className="mr-2" /> ไม่อนุมัติการยกเลิก
                      </button>
                    </div>
                  )}
                  
                  {/* ปุ่มขอยกเลิก */}
                  {canCancelRequest() && (
                    <div className="mt-6 border-t border-gray-200 pt-4">
                      <button
                        className="btn btn-warning w-full"
                        onClick={openCancelModal}
                        disabled={actionLoading}
                      >
                        <FiXCircle size={20} className="mr-2" /> ขอยกเลิกการทำงานล่วงเวลา
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* คอลัมน์ขวา: ข้อมูลพนักงานและสรุป */}
          <div>
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title text-xl mb-4">ข้อมูลพนักงาน</h2>
                
                {overtime.employee && (
                  <div className="flex flex-col items-center mb-4">
                    <div className="mb-3">
                      <ProfileImage 
                        src={overtime.employee?.image}
                        alt={`${overtime.employee?.firstName} ${overtime.employee?.lastName}`}
                        size="lg"
                        fallbackText={`${overtime.employee?.firstName} ${overtime.employee?.lastName}`}
                      />
                    </div>
                    <h3 className="font-semibold text-lg text-center">
                      {overtime.employee?.firstName} {overtime.employee?.lastName}
                    </h3>
                    <p className="text-gray-500 text-center">
                      {overtime.employee?.position}
                      {overtime.employee?.department?.name && ` • ${overtime.employee.department.name}`}
                    </p>
                  </div>
                )}
                
                <div className="space-y-3 mt-3">
                  {overtime.employee?.email && (
                    <div className="flex items-start gap-2">
                      <FiMessageCircle size={20} className="mt-1 text-primary" />
                      <div>
                        <div className="font-semibold">อีเมล</div>
                        <div>{overtime.employee.email}</div>
                      </div>
                    </div>
                  )}
                  
                  {overtime.employee?.employeeId && (
                    <div className="flex items-start gap-2">
                      <FiInfo size={20} className="mt-1 text-primary" />
                      <div>
                        <div className="font-semibold">รหัสพนักงาน</div>
                        <div>{overtime.employee.employeeId}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* สรุปการทำงานล่วงเวลา */}
            {monthlySummary.length > 0 && (
              <div className="card bg-base-100 shadow-xl mt-6">
                <div className="card-body">
                  <h2 className="card-title text-xl mb-4">สรุปการทำงานล่วงเวลาใน {new Date().getFullYear()}</h2>
                  <div className="overflow-x-auto">
                    <table className="table table-zebra w-full bg-base-200 rounded-lg">
                      <thead>
                        <tr>
                          <th>เดือน</th>
                          <th>จำนวนครั้ง</th>
                          <th>ชั่วโมงรวม</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthlySummary.map((item, index) => (
                          <tr key={index}>
                            <td>{item.month}</td>
                            <td>{item.count} ครั้ง</td>
                            <td>{item.totalHours.toFixed(2)} ชม.</td>
                          </tr>
                        ))}
                        <tr className="font-medium bg-base-300">
                          <td>รวมทั้งหมด</td>
                          <td>
                            {monthlySummary.reduce((sum, item) => sum + item.count, 0)} ครั้ง
                          </td>
                          <td>
                            {monthlySummary.reduce((sum, item) => sum + item.totalHours, 0).toFixed(2)} ชม.
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Modal สำหรับการไม่อนุมัติการทำงานล่วงเวลา */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
          <div className="bg-base-100 rounded-lg shadow-xl max-w-md w-full p-5">
            <div className="flex items-center mb-4">
              <div className="bg-error bg-opacity-20 p-2 rounded-full mr-3">
                <FiXCircle className="text-error text-xl" />
              </div>
              <h3 className="text-lg font-bold">ไม่อนุมัติการทำงานล่วงเวลา</h3>
            </div>
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text text-base">กรุณาระบุเหตุผลที่ไม่อนุมัติ</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="textarea textarea-bordered w-full resize-none"
                rows="4"
                placeholder="ระบุเหตุผลที่ไม่อนุมัติ (ไม่บังคับ)"
              ></textarea>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setShowRejectModal(false)}
                className="btn btn-outline"
                disabled={actionLoading}
              >
                ยกเลิก
              </button>
              <button
                onClick={handleReject}
                className="btn btn-error text-white"
                disabled={actionLoading}
              >
                ยืนยันการไม่อนุมัติ
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal สำหรับการขอยกเลิกการทำงานล่วงเวลา */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
          <div className="bg-base-100 rounded-lg shadow-xl max-w-md w-full p-5">
            <div className="flex items-center mb-4">
              <div className="bg-warning bg-opacity-20 p-2 rounded-full mr-3">
                <FiXCircle className="text-warning text-xl" />
              </div>
              <h3 className="text-lg font-bold">รอยกเลิกการทำงานล่วงเวลา</h3>
            </div>
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text text-base">กรุณาระบุเหตุผลการรอยกเลิก</span>
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="textarea textarea-bordered w-full resize-none"
                rows="4"
                placeholder="กรุณาระบุเหตุผล"
              ></textarea>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setShowCancelModal(false)}
                className="btn btn-outline"
                disabled={actionLoading}
              >
                ยกเลิก
              </button>
              <button
                onClick={handleCancelRequest}
                className="btn btn-warning"
                disabled={actionLoading || !cancelReason.trim()}
              >
                ยืนยันการรอยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal สำหรับการไม่อนุมัติการยกเลิก */}
      {showRejectCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
          <div className="bg-base-100 rounded-lg shadow-xl max-w-md w-full p-5">
            <div className="flex items-center mb-4">
              <div className="bg-warning bg-opacity-20 p-2 rounded-full mr-3">
                <FiXCircle className="text-warning text-xl" />
              </div>
              <h3 className="text-lg font-bold">ไม่อนุมัติการยกเลิกการทำงานล่วงเวลา</h3>
            </div>
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text text-base">กรุณาระบุเหตุผลการยกเลิก</span>
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="textarea textarea-bordered w-full resize-none"
                rows="4"
                placeholder="กรุณาระบุเหตุผลการยกเลิก"
              ></textarea>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setShowRejectCancelModal(false)}
                className="btn btn-outline"
                disabled={actionLoading}
              >
                ยกเลิก
              </button>
              <button
                onClick={handleRejectCancel}
                className="btn btn-warning"
                disabled={actionLoading || !cancelReason.trim()}
              >
                ยืนยันการไม่อนุมัติการยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* เพิ่มส่วนแสดงตาราง Transaction log คล้ายกับหน้า leave */}
      {overtime.approvals && overtime.approvals.length > 0 && (
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
                    {overtime.approvals.map((approval, index) => (
                      <tr key={index}>
                        <td className="whitespace-nowrap">{formatDateTime(approval.createdAt)}</td>
                        <td>
                          {getTransactionTypeText(approval.type)}
                        </td>
                        <td className="whitespace-nowrap">
                          {approval.employee ? 
                            `${approval.employee.firstName || ''} ${approval.employee.lastName || ''}` : 
                            'ไม่ระบุ'}
                        </td>
                        <td>
                          <div className={`badge ${
                            approval.type === 'approve' || approval.type === 'approve_cancel' || approval.type === 'reject' || approval.type === 'reject_cancel' ? 'badge-success' : 'badge-warning'
                          } badge-sm`}>
                            {getTransactionStatusText(approval.status, approval.type)}
                          </div>
                        </td>
                        <td>
                          {(approval.reason || approval.comment) && (
                            <div className="max-w-xs truncate">
                              {approval.reason || approval.comment}
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