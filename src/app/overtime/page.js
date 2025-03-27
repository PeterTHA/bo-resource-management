'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

// เปลี่ยนจาก Heroicons เป็น react-icons
import { FiCheckCircle, FiXCircle, FiTrash2, FiPlus, FiFilter, FiClock, FiUser, 
         FiFileText, FiDownload, FiInfo, FiMessageCircle, FiEdit, FiCalendar } from 'react-icons/fi';
import { LoadingPage } from '../../components/ui/LoadingSpinner';
import ErrorMessage from '../../components/ui/ErrorMessage';

// เพิ่มฟังก์ชันตรวจสอบว่าเป็นรูปภาพจาก mock-images หรือไม่
const isMockImage = (src) => {
  return src && typeof src === 'string' && (src.startsWith('/mock-images/') || src.startsWith('./mock-images/'));
};

export default function OvertimePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [overtimes, setOvertimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected
  const [employeeFilter, setEmployeeFilter] = useState('all'); // 'all' หรือ employeeId
  const [employees, setEmployees] = useState([]);
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0,
    pendingCancel: 0
  });
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedOvertimeId, setSelectedOvertimeId] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRejectCancelModal, setShowRejectCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

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
          // กรองพนักงานตามบทบาทของผู้ใช้
          if (session.user.role === 'admin') {
            // แอดมินเห็นพนักงานทั้งหมด
            setEmployees(data.data);
          } else if (session.user.role === 'supervisor') {
            // หัวหน้างานเห็นพนักงานในทีมและตัวเอง
            const filteredEmployees = data.data.filter(emp => 
              emp.departmentId === session.user.departmentId || 
              emp.id === session.user.id
            );
            setEmployees(filteredEmployees);
          } else {
            // พนักงานทั่วไปเห็นแค่ตัวเอง
            const currentEmployee = data.data.find(emp => emp.id === session.user.id);
            setEmployees(currentEmployee ? [currentEmployee] : []);
          }
        }
      } catch (error) {
        console.error('Error fetching employees:', error);
      }
    };
    
    if (session) {
      fetchEmployees();
    }
  }, [session]);

  useEffect(() => {
    const fetchOvertimes = async () => {
      try {
        const res = await fetch('/api/overtime');
        const data = await res.json();
        
        if (data.success) {
          setOvertimes(data.data);
          
          // คำนวณจำนวนข้อมูลแต่ละสถานะ
          const counts = {
            all: data.data.length,
            pending: data.data.filter(overtime => overtime.status === 'รออนุมัติ').length,
            approved: data.data.filter(overtime => 
              overtime.status === 'อนุมัติ'
            ).length,
            rejected: data.data.filter(overtime => overtime.status === 'ไม่อนุมัติ').length,
            cancelled: data.data.filter(overtime => 
              overtime.status === 'ยกเลิก' || 
              overtime.isCancelled || 
              overtime.cancelledById !== null ||
              overtime.cancelStatus === 'อนุมัติ'
            ).length,
            pendingCancel: data.data.filter(overtime => 
              overtime.status === 'อนุมัติ' && overtime.cancelStatus === 'รออนุมัติ'
            ).length
          };
          setStatusCounts(counts);
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
    
    if (session) {
      fetchOvertimes();
    }
  }, [session]);

  const handleDelete = async (id) => {
    if (!confirm('คุณต้องการลบข้อมูลการทำงานล่วงเวลานี้ใช่หรือไม่?')) {
      return;
    }
    
    try {
      setActionLoading(true);
      const res = await fetch(`/api/overtime/${id}`, {
        method: 'DELETE',
      });
      
      const data = await res.json();
      
      if (data.success) {
        setOvertimes(overtimes.filter(overtime => overtime.id !== id));
        setSuccess('ลบข้อมูลการทำงานล่วงเวลาเรียบร้อยแล้ว');
        
        // อัปเดตสถิติ
        setStatusCounts(prev => {
          const deletedOvertime = overtimes.find(overtime => overtime.id === id);
          const status = deletedOvertime?.status === 'รออนุมัติ' ? 'pending' : 
                         deletedOvertime?.status === 'อนุมัติ' ? 'approved' : 'rejected';
          
          return {
            ...prev,
            all: prev.all - 1,
            [status]: prev[status] - 1
          };
        });
      } else {
        setError(data.message || 'เกิดข้อผิดพลาดในการลบข้อมูลการทำงานล่วงเวลา');
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!confirm('คุณต้องการอนุมัติการทำงานล่วงเวลานี้ใช่หรือไม่?')) {
      return;
    }
    
    try {
      setActionLoading(true);
      const res = await fetch(`/api/overtime/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: 'อนุมัติ',
          approvedById: session.user.id,
          approvedAt: new Date().toISOString()
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        // อัปเดตข้อมูลในรายการ
        setOvertimes(overtimes.map(overtime => 
          overtime.id === id ? { 
            ...overtime, 
            status: 'อนุมัติ',
            approvedById: session.user.id,
            approvedBy: {
              id: session.user.id,
              firstName: session.user.firstName || session.user.name?.split(' ')[0] || '',
              lastName: session.user.lastName || session.user.name?.split(' ')[1] || '',
            },
            approvedAt: new Date().toISOString()
          } : overtime
        ));
        
        setSuccess('อนุมัติการทำงานล่วงเวลาเรียบร้อยแล้ว');
        
        // อัปเดตสถิติ
        setStatusCounts(prev => ({
          ...prev,
          pending: prev.pending - 1,
          approved: prev.approved + 1
        }));
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

  const handleShowRejectModal = (id) => {
    setSelectedOvertimeId(id);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleShowCancelModal = (id) => {
    setSelectedOvertimeId(id);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const handleReject = async () => {
    if (!selectedOvertimeId) return;
    
    try {
      setActionLoading(true);
      const res = await fetch(`/api/overtime/${selectedOvertimeId}`, {
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
        // อัปเดตข้อมูลในรายการ
        setOvertimes(overtimes.map(overtime => 
          overtime.id === selectedOvertimeId ? { 
            ...overtime, 
            status: 'ไม่อนุมัติ',
            approvedBy: {
              id: session.user.id,
              firstName: session.user.firstName || session.user.name?.split(' ')[0] || '',
              lastName: session.user.lastName || session.user.name?.split(' ')[1] || '',
            },
            approvedAt: new Date().toISOString(),
            comment: rejectReason || null
          } : overtime
        ));
        
        setSuccess('ปฏิเสธการทำงานล่วงเวลาเรียบร้อยแล้ว');
        
        // อัปเดตสถิติ
        setStatusCounts(prev => ({
          ...prev,
          pending: prev.pending - 1,
          rejected: prev.rejected + 1
        }));
        
        // ปิด modal
        setShowRejectModal(false);
        setSelectedOvertimeId(null);
        setRejectReason('');
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

  const filteredOvertimes = useMemo(() => {
    let filtered = overtimes;
    
    // กรองตามสถานะ
    if (filter === 'pending') {
      filtered = overtimes.filter(overtime => overtime.status === 'รออนุมัติ');
    } else if (filter === 'approved') {
      filtered = overtimes.filter(overtime => 
        overtime.status === 'อนุมัติ'
      );
    } else if (filter === 'rejected') {
      filtered = overtimes.filter(overtime => overtime.status === 'ไม่อนุมัติ');
    } else if (filter === 'cancelled') {
      filtered = overtimes.filter(overtime => 
        overtime.status === 'ยกเลิก' || 
        overtime.isCancelled || 
        overtime.cancelledById !== null ||
        overtime.cancelStatus === 'อนุมัติ'
      );
    } else if (filter === 'pendingCancel') {
      filtered = overtimes.filter(overtime => 
        overtime.status === 'อนุมัติ' && overtime.cancelStatus === 'รออนุมัติ'
      );
    }
    
    // กรองตามพนักงาน
    if (employeeFilter !== 'all') {
      filtered = filtered.filter(overtime => overtime.employeeId === employeeFilter);
    }
    
    return filtered;
  }, [overtimes, filter, employeeFilter]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // เช็คว่าเป็นหัวหน้างานหรือแอดมินหรือไม่
  const isManager = session?.user?.role === 'supervisor' || session?.user?.role === 'admin';
  
  // เพิ่มฟังก์ชันสำหรับนำทางไปหน้ารายละเอียดการทำงานล่วงเวลา
  const navigateToOvertimeDetail = (overtimeId) => {
    if (!overtimeId) {
      console.error("Invalid overtime ID:", overtimeId);
      return;
    }
    router.push(`/overtime/${overtimeId}`);
  };

  // ตรวจสอบว่าผู้ใช้มีสิทธิ์อนุมัติหรือไม่
  const canApprove = (overtime) => {
    if (!session || !overtime) return false;
    
    // แอดมินอนุมัติได้ทุกรายการที่มีสถานะเป็น "รออนุมัติ"
    if (session.user.role === 'admin' && overtime.status === 'รออนุมัติ') {
      return true;
    }
    
    // หัวหน้างานอนุมัติได้ รวมถึงอนุมัติให้กับหัวหน้างานอื่นในทีมเดียวกัน และอนุมัติตัวเองด้วย
    if (session.user.role === 'supervisor' && overtime.status === 'รออนุมัติ') {
      // หากไม่มีข้อมูล departmentId ของพนักงาน จะอนุโลมให้หัวหน้างานอนุมัติได้
      if (!overtime.employee?.departmentId || !session.user.departmentId) {
        return true;
      }
      
      // ถ้าเป็นแผนกเดียวกัน อนุมัติได้
      if (overtime.employee?.departmentId === session.user.departmentId) {
        return true;
      }
    }
    
    return false;
  };

  // ตรวจสอบว่าสามารถลบได้หรือไม่
  const canDelete = (overtime) => {
    if (!session || !overtime) return false;
    
    // พนักงานลบของตัวเองได้เฉพาะเมื่อสถานะเป็น 'รออนุมัติ' เท่านั้น
    if ((session.user.id === overtime.employeeId) && 
        overtime.status === 'รออนุมัติ' && 
        overtime.cancelStatus !== 'รออนุมัติ') {
      return true;
    }
    
    // แอดมินก็ลบได้เฉพาะเมื่อสถานะเป็น 'รออนุมัติ' เท่านั้น
    if (session.user.role === 'admin' && 
        overtime.status === 'รออนุมัติ' && 
        overtime.cancelStatus !== 'รออนุมัติ') {
      return true;
    }
    
    return false;
  };

  // ตรวจสอบว่าสามารถแก้ไขได้หรือไม่
  const canEdit = (overtime) => {
    if (!session || !overtime) return false;
    
    // พนักงานแก้ไขข้อมูลของตัวเองได้ถ้ายังไม่อนุมัติ
    if ((session.user.id === overtime.employeeId) && overtime.status === 'รออนุมัติ') {
      return true;
    }
    
    // แอดมินแก้ไขได้ทุกรายการที่ยังไม่อนุมัติ
    if (session.user.role === 'admin' && overtime.status === 'รออนุมัติ') {
      return true;
    }
    
    return false;
  };

  // ตรวจสอบว่าสามารถขอยกเลิกได้หรือไม่
  const canCancelRequest = (overtime) => {
    if (!session || !overtime) return false;
    
    // สามารถขอยกเลิกได้ถ้าเป็นเจ้าของ หรือเป็นแอดมิน และสถานะเป็น "อนุมัติ" และ 
    // ยังไม่มีการขอยกเลิก หรือ การขอยกเลิกถูกปฏิเสธไปแล้ว
    return (
      (session.user.id === overtime.employeeId || session.user.role === 'admin') && 
      overtime.status === 'อนุมัติ' &&
      (!overtime.cancelStatus || overtime.cancelStatus === 'ไม่อนุมัติ')
    );
  };

  // ฟังก์ชันสำหรับการขอยกเลิกการทำงานล่วงเวลา
  const handleCancelRequest = async () => {
    if (!selectedOvertimeId || !cancelReason.trim()) return;
    
    try {
      setActionLoading(true);
      const res = await fetch(`/api/overtime/${selectedOvertimeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          cancelStatus: 'รออนุมัติ',
          cancelRequestById: session.user.id,
          cancelRequestAt: new Date().toISOString(),
          cancelReason: cancelReason.trim() || null
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        // อัปเดตข้อมูลในรายการ
        setOvertimes(overtimes.map(overtime => 
          overtime.id === selectedOvertimeId ? { 
            ...overtime, 
            cancelStatus: 'รออนุมัติ',
            cancelReason: cancelReason.trim() || null,
            cancelRequestAt: new Date().toISOString(),
            cancelRequestBy: {
              id: session.user.id,
              firstName: session.user.firstName || session.user.name?.split(' ')[0] || '',
              lastName: session.user.lastName || session.user.name?.split(' ')[1] || '',
            }
          } : overtime
        ));
        
        setSuccess('ส่งคำขอยกเลิกการทำงานล่วงเวลาเรียบร้อยแล้ว');
        
        // อัปเดตสถิติ
        setStatusCounts(prev => ({
          ...prev,
          approved: prev.approved - 1,
          pendingCancel: prev.pendingCancel + 1
        }));
        
        // ปิด modal
        setShowCancelModal(false);
        setSelectedOvertimeId(null);
        setCancelReason('');
      } else {
        setError(data.message || 'เกิดข้อผิดพลาดในการส่งคำขอยกเลิกการทำงานล่วงเวลา');
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  // ฟังก์ชันสำหรับการอนุมัติการยกเลิก
  const handleApproveCancel = async (id) => {
    if (!confirm('คุณต้องการอนุมัติการยกเลิกการทำงานล่วงเวลานี้ใช่หรือไม่?')) {
      return;
    }
    
    try {
      setActionLoading(true);
      const res = await fetch(`/api/overtime/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          cancelStatus: 'อนุมัติ',
          isCancelled: true,
          cancelledById: session.user.id,
          cancelledAt: new Date().toISOString()
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        // อัปเดตข้อมูลในรายการ
        setOvertimes(overtimes.map(overtime => 
          overtime.id === id ? { 
            ...overtime, 
            cancelStatus: 'อนุมัติ',
            isCancelled: true,
            cancelledAt: new Date().toISOString(),
            cancelledBy: {
              id: session.user.id,
              firstName: session.user.firstName || session.user.name?.split(' ')[0] || '',
              lastName: session.user.lastName || session.user.name?.split(' ')[1] || '',
            }
          } : overtime
        ));
        
        setSuccess('อนุมัติการยกเลิกการทำงานล่วงเวลาเรียบร้อยแล้ว');
        
        // อัปเดตสถิติ
        setStatusCounts(prev => ({
          ...prev,
          pendingCancel: prev.pendingCancel - 1,
          cancelled: prev.cancelled + 1
        }));
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

  // เพิ่มฟังก์ชันสำหรับเปิด Modal ไม่อนุมัติการยกเลิก
  const openRejectCancelModal = (id) => {
    setSelectedOvertimeId(id);
    setShowRejectCancelModal(true);
    setCancelReason('');
  };

  // ฟังก์ชันสำหรับการไม่อนุมัติการยกเลิก
  const handleRejectCancel = async () => {
    if (!selectedOvertimeId || !cancelReason.trim()) return;
    
    try {
      setActionLoading(true);
      const res = await fetch(`/api/overtime/${selectedOvertimeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          cancelStatus: 'ไม่อนุมัติ',
          cancelResponseById: session.user.id,
          cancelResponseAt: new Date().toISOString(),
          cancelResponseComment: cancelReason.trim() || null
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        // อัปเดตข้อมูลในรายการ
        setOvertimes(overtimes.map(overtime => 
          overtime.id === selectedOvertimeId ? { 
            ...overtime, 
            cancelStatus: 'ไม่อนุมัติ',
            cancelResponseAt: new Date().toISOString(),
            cancelResponseComment: cancelReason.trim() || null,
            cancelResponseBy: {
              id: session.user.id,
              firstName: session.user.firstName || session.user.name?.split(' ')[0] || '',
              lastName: session.user.lastName || session.user.name?.split(' ')[1] || '',
            }
          } : overtime
        ));
        
        setSuccess('ปฏิเสธการยกเลิกการทำงานล่วงเวลาเรียบร้อยแล้ว');
        
        // อัปเดตสถิติ
        setStatusCounts(prev => ({
          ...prev,
          pendingCancel: prev.pendingCancel - 1,
          approved: prev.approved + 1 // กลับไปเป็นอนุมัติเหมือนเดิม
        }));

        // ปิด modal
        setShowRejectCancelModal(false);
        setSelectedOvertimeId(null);
        setCancelReason('');
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

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingPage message="กำลังโหลดข้อมูลการทำงานล่วงเวลา..." />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
          <FiClock className="mr-2 text-primary" /> รายการทำงานล่วงเวลา
        </h1>
        <Link
          href="/overtime/add"
          className="btn btn-primary inline-flex items-center justify-center text-white shadow-md hover:shadow-lg"
        >
          <FiPlus className="mr-1.5 h-4 w-4" /> <span>ขอทำงานล่วงเวลา</span>
        </Link>
      </div>
      
      {error && <ErrorMessage message={error} type="error" />}
      {success && <ErrorMessage message={success} type="success" />}
      
      {/* Dashboard สรุปสถิติการทำงานล่วงเวลา */}
      <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-6 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border-l-4 border-blue-500 dark:border-blue-400 transition-all duration-200 hover:shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">ทั้งหมด</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{statusCounts.all}</p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
              <FiClock className="h-5 w-5 text-blue-500 dark:text-blue-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border-l-4 border-yellow-500 dark:border-yellow-400 transition-all duration-200 hover:shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">รออนุมัติ</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{statusCounts.pending}</p>
            </div>
            <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-full">
              <FiClock className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border-l-4 border-green-500 dark:border-green-400 transition-all duration-200 hover:shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">อนุมัติแล้ว</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{statusCounts.approved}</p>
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
              <FiCheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border-l-4 border-red-500 dark:border-red-400 transition-all duration-200 hover:shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">ไม่อนุมัติ</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{statusCounts.rejected}</p>
            </div>
            <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full">
              <FiXCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border-l-4 border-purple-500 dark:border-purple-400 transition-all duration-200 hover:shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">ยกเลิกแล้ว</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{statusCounts.cancelled}</p>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full">
              <FiXCircle className="h-5 w-5 text-purple-500 dark:text-purple-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border-l-4 border-orange-500 dark:border-orange-400 transition-all duration-200 hover:shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">รอยกเลิก</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{statusCounts.pendingCancel}</p>
            </div>
            <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-full">
              <FiXCircle className="h-5 w-5 text-orange-500 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>
      
      {/* ตัวกรองข้อมูล */}
      <div className="mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md transition-colors duration-300">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center">
            <FiFilter className="mr-2" /> กรองข้อมูล
          </h2>
          
          {/* กรองตามสถานะ */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                filter === 'all'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              ทั้งหมด ({statusCounts.all})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                filter === 'pending'
                  ? 'bg-yellow-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              รออนุมัติ ({statusCounts.pending})
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                filter === 'approved'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              อนุมัติแล้ว ({statusCounts.approved})
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                filter === 'rejected'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              ไม่อนุมัติ ({statusCounts.rejected})
            </button>
            <button
              onClick={() => setFilter('cancelled')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                filter === 'cancelled'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              ยกเลิกแล้ว ({statusCounts.cancelled})
            </button>
            <button
              onClick={() => setFilter('pendingCancel')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                filter === 'pendingCancel'
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              รอยกเลิก ({statusCounts.pendingCancel})
            </button>
          </div>
          
          {/* กรองตามพนักงาน */}
          <div className="mt-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
              กรองตามพนักงาน
            </label>
            <select 
              className="select select-bordered w-full max-w-xs"
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
            >
              <option value="all">ทั้งหมด</option>
              {employees.map(employee => (
                <option key={employee.id} value={employee.id}>
                  {employee.firstName} {employee.lastName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* แสดงรายการการทำงานล่วงเวลาแบบการ์ด */}
      {filteredOvertimes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOvertimes.map((overtime) => (
            <div key={overtime.id} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow duration-300 cursor-pointer" onClick={() => navigateToOvertimeDetail(overtime.id)}>
              <div className="card-body">
                <div className="flex justify-between items-start">
                  <h2 className="card-title">ทำงานล่วงเวลา</h2>
                  <div className="flex flex-col gap-1 items-end">
                    <div className={`badge ${
                      overtime.status === 'อนุมัติ' ? 'badge-success' : 
                      overtime.status === 'ไม่อนุมัติ' ? 'badge-error' : 
                      'badge-warning'
                    } badge-lg`}>
                      {overtime.status}
                    </div>
                    
                    {/* แสดงสถานะการยกเลิก */}
                    {overtime.cancelStatus && (
                      <div className={`badge ${
                        overtime.cancelStatus === 'อนุมัติ' ? 'badge-info' : 
                        overtime.cancelStatus === 'ไม่อนุมัติ' ? 'badge-error' : 
                        'badge-warning'
                      } badge-sm`}>
                        {overtime.cancelStatus === 'อนุมัติ' ? 'ยกเลิกแล้ว' : 
                         overtime.cancelStatus === 'ไม่อนุมัติ' ? 'ปฏิเสธการยกเลิก' : 
                         'รอยกเลิก'}
                      </div>
                    )}

                    {/* แสดงข้อความยกเลิกแล้วเมื่อ isCancelled เป็น true */}
                    {(overtime.isCancelled || overtime.cancelStatus === 'อนุมัติ') && !overtime.cancelStatus && (
                      <div className="badge badge-info badge-sm">
                        ยกเลิกแล้ว
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-2 space-y-3">
                  <div className="flex gap-2 items-start">
                    <FiCalendar size={18} className="mt-1 text-primary" />
                    <div>
                      <div className="font-semibold">วันที่ทำงานล่วงเวลา</div>
                      <div>{formatDate(overtime.date)}</div>
                    </div>
                  </div>

                  <div className="flex gap-2 items-start">
                    <FiClock size={18} className="mt-1 text-primary" />
                    <div>
                      <div className="font-semibold">เวลาทำงาน</div>
                      <div>{overtime.startTime} - {overtime.endTime} น. ({overtime.totalHours} ชั่วโมง)</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 items-start">
                    <FiUser size={18} className="mt-1 text-primary" />
                    <div>
                      <div className="font-semibold">พนักงาน</div>
                      <div className="flex items-center gap-2">
                        {overtime.employee?.image ? (
                          <div className="avatar">
                            <div className="w-8 h-8 rounded-full">
                              <Image
                                src={overtime.employee.image}
                                alt={overtime.employee.firstName}
                                width={32}
                                height={32}
                                className="rounded-full"
                                unoptimized={isMockImage(overtime.employee.image)}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="avatar placeholder">
                            <div className="bg-primary text-primary-content w-8 h-8 rounded-full">
                              <span>{overtime.employee?.firstName?.[0] || ''}{overtime.employee?.lastName?.[0] || ''}</span>
                            </div>
                          </div>
                        )}
                        <span>
                          {overtime.employee?.firstName || ''} {overtime.employee?.lastName || ''}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end mt-4 gap-2 flex-wrap">
                  {/* ปุ่มแก้ไข */}
                  {canEdit(overtime) && (
                    <button 
                      className="btn btn-info btn-sm"
                      onClick={(e) => {
                        e.stopPropagation(); // ป้องกันการนำทางเมื่อคลิกปุ่ม
                        router.push(`/overtime/${overtime.id}/edit`);
                      }}
                      disabled={actionLoading}
                    >
                      <FiEdit size={16} className="mr-1" /> แก้ไข
                    </button>
                  )}
                  
                  {/* ปุ่มอนุมัติ */}
                  {canApprove(overtime) && (
                    <button 
                      className="btn btn-success btn-sm"
                      onClick={(e) => {
                        e.stopPropagation(); // ป้องกันการนำทางเมื่อคลิกปุ่ม
                        handleApprove(overtime.id);
                      }}
                      disabled={actionLoading}
                    >
                      <FiCheckCircle size={16} className="mr-1" /> อนุมัติ
                    </button>
                  )}
                  
                  {/* ปุ่มไม่อนุมัติ */}
                  {canApprove(overtime) && (
                    <button 
                      className="btn btn-error btn-sm"
                      onClick={(e) => {
                        e.stopPropagation(); // ป้องกันการนำทางเมื่อคลิกปุ่ม
                        handleShowRejectModal(overtime.id);
                      }}
                      disabled={actionLoading}
                    >
                      <FiXCircle size={16} className="mr-1" /> ไม่อนุมัติ
                    </button>
                  )}
                  
                  {/* ปุ่มลบ */}
                  {canDelete(overtime) && (
                    <button 
                      className="btn btn-outline btn-error btn-sm"
                      onClick={(e) => {
                        e.stopPropagation(); // ป้องกันการนำทางเมื่อคลิกปุ่ม
                        handleDelete(overtime.id);
                      }}
                      disabled={actionLoading}
                    >
                      <FiTrash2 size={16} />
                    </button>
                  )}

                  {/* ปุ่มขอยกเลิกการทำงานล่วงเวลา */}
                  {canCancelRequest(overtime) && (
                    <button 
                      className="btn btn-warning btn-sm"
                      onClick={(e) => {
                        e.stopPropagation(); // ป้องกันการนำทางเมื่อคลิกปุ่ม
                        handleShowCancelModal(overtime.id);
                      }}
                      disabled={actionLoading}
                    >
                      <FiXCircle size={16} className="mr-1" /> ขอยกเลิก
                    </button>
                  )}
                  
                  {/* ปุ่มอนุมัติการยกเลิก */}
                  {overtime.cancelStatus === 'รออนุมัติ' && 
                   (session?.user?.role === 'admin' || 
                    (session?.user?.role === 'supervisor' && 
                     (!overtime.employee?.departmentId || !session.user.departmentId || 
                      overtime.employee?.departmentId === session?.user?.departmentId))) && (
                    <button 
                      className="btn btn-success btn-sm"
                      onClick={(e) => {
                        e.stopPropagation(); // ป้องกันการนำทางเมื่อคลิกปุ่ม
                        handleApproveCancel(overtime.id);
                      }}
                      disabled={actionLoading}
                    >
                      <FiCheckCircle size={16} className="mr-1" /> อนุมัติยกเลิก
                    </button>
                  )}

                  {/* ปุ่มไม่อนุมัติการยกเลิก */}
                  {overtime.cancelStatus === 'รออนุมัติ' && 
                   (session?.user?.role === 'admin' || 
                    (session?.user?.role === 'supervisor' && 
                     (!overtime.employee?.departmentId || !session.user.departmentId || 
                      overtime.employee?.departmentId === session?.user?.departmentId))) && (
                    <button 
                      className="btn btn-error btn-sm"
                      onClick={(e) => {
                        e.stopPropagation(); // ป้องกันการนำทางเมื่อคลิกปุ่ม
                        openRejectCancelModal(overtime.id);
                      }}
                      disabled={actionLoading}
                    >
                      <FiXCircle size={16} className="mr-1" /> ไม่อนุมัติยกเลิก
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <FiClock className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
          <p className="text-lg text-gray-600 dark:text-gray-300">ไม่พบข้อมูลการทำงานล่วงเวลา</p>
        </div>
      )}

      {/* Modal สำหรับไม่อนุมัติการทำงานล่วงเวลา */}
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

      {/* Modal สำหรับไม่อนุมัติการยกเลิกการทำงานล่วงเวลา */}
      {showRejectCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
          <div className="bg-base-100 rounded-lg shadow-xl max-w-md w-full p-5">
            <div className="flex items-center mb-4">
              <div className="bg-error bg-opacity-20 p-2 rounded-full mr-3">
                <FiXCircle className="text-error text-xl" />
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
                className="btn btn-error text-white"
                disabled={actionLoading || !cancelReason.trim()}
              >
                ยืนยันการไม่อนุมัติการยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 