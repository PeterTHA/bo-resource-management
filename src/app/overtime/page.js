'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

// เปลี่ยนจาก Heroicons เป็น react-icons
import { FiCheckCircle, FiXCircle, FiTrash2, FiPlus, FiFilter, FiClock, FiUser, 
         FiFileText, FiDownload, FiInfo, FiEdit, FiCalendar, FiSearch, FiChevronUp, FiChevronDown } from 'react-icons/fi';
import { LoadingPage } from '../../components/ui/LoadingSpinner';
import ErrorMessage from '../../components/ui/ErrorMessage';

// เพิ่มฟังก์ชันตรวจสอบว่าเป็นรูปภาพจาก mock-images หรือไม่
const isMockImage = (src) => {
  return src && typeof src === 'string' && (src.startsWith('/mock-images/') || src.startsWith('./mock-images/'));
};

export default function OvertimePage() {
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/login');
    },
  });

  const [overtimes, setOvertimes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRejectCancelModal, setShowRejectCancelModal] = useState(false);
  const [selectedOvertimeId, setSelectedOvertimeId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [approveComment, setApproveComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0,
    pendingCancel: 0
  });
  // เพิ่ม state สำหรับการจัดเรียงและแบ่งหน้า
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');

  // ฟังก์ชันดึงข้อมูลการทำงานล่วงเวลา - ย้ายออกจาก useEffect
  const fetchOvertimes = async () => {
    try {
      const res = await fetch('/api/overtime');
      const data = await res.json();
      
      if (data.success) {
        setOvertimes(data.data);
        
        // คำนวณจำนวนข้อมูลแต่ละสถานะ
        const counts = {
          all: data.data.length,
          waiting_for_approve: data.data.filter(overtime => overtime.status === 'waiting_for_approve').length,
          approved: data.data.filter(overtime => 
            overtime.status === 'approved' && 
            (!overtime.cancelStatus || overtime.cancelStatus !== 'waiting_for_approve')
          ).length,
          rejected: data.data.filter(overtime => overtime.status === 'rejected').length,
          canceled: data.data.filter(overtime => 
            overtime.status === 'canceled' || 
            overtime.isCancelled === true
          ).length,
          pending_cancel: data.data.filter(overtime => 
            overtime.status === 'approved' && overtime.cancelStatus === 'waiting_for_approve'
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

  // ดึงข้อมูลพนักงาน
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

  // ดึงข้อมูลการทำงานล่วงเวลา
  useEffect(() => {
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
        setSuccess('ลบข้อมูลการทำงานล่วงเวลาเรียบร้อยแล้ว');
        // รีเฟรชข้อมูลการทำงานล่วงเวลา
        fetchOvertimes();
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

  const handleApprove = async (overtimeId, comment = '') => {
    try {
      if (!showApproveModal) {
        setSelectedOvertimeId(overtimeId);
        setShowApproveModal(true);
        return;
      }

      setIsSubmitting(true);
      setError('');
      setSuccess('');

      const response = await fetch(`/api/overtime/${overtimeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          comment: approveComment
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('อนุมัติการทำงานล่วงเวลาเรียบร้อยแล้ว');
        // รีเฟรชข้อมูลการทำงานล่วงเวลา
        fetchOvertimes();
        setShowApproveModal(false);
        setApproveComment('');
      } else {
        setError(result.message || 'เกิดข้อผิดพลาดในการอนุมัติการทำงานล่วงเวลา');
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการอนุมัติการทำงานล่วงเวลา');
      console.error('Error approving overtime:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      setError('');
      setSuccess('');
      
      const response = await fetch(`/api/overtime/${selectedOvertimeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          comment: rejectReason
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSuccess('ไม่อนุมัติการทำงานล่วงเวลาเรียบร้อยแล้ว');
        // รีเฟรชข้อมูลการทำงานล่วงเวลา
        fetchOvertimes();
        setShowRejectModal(false);
        setRejectReason('');
      } else {
        setError(result.message || 'เกิดข้อผิดพลาดในการไม่อนุมัติการทำงานล่วงเวลา');
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการไม่อนุมัติการทำงานล่วงเวลา');
      console.error('Error rejecting overtime:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShowApproveModal = (id) => {
    setSelectedOvertimeId(id);
    setApproveComment('');
    setShowApproveModal(true);
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
          action: 'reject_cancel',
          comment: cancelReason.trim() || null
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setSuccess('ปฏิเสธการยกเลิกการทำงานล่วงเวลาเรียบร้อยแล้ว');
        // รีเฟรชข้อมูลการทำงานล่วงเวลา
        // ปิด modal
        setShowRejectCancelModal(false);
        setSelectedOvertimeId(null);
        setCancelReason('');
        
        // เนื่องจากเปลี่ยนแปลงข้อมูล ให้รีโหลดหน้า
        setTimeout(() => {
          window.location.reload();
        }, 1500);
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

  /**
   * แปลงสถานะเป็นข้อความภาษาไทยสำหรับแสดงผล
   */
  const getStatusText = (status) => {
    switch (status) {
      case 'waiting_for_approve':
        return 'รออนุมัติ';
      case 'approved':
        return 'อนุมัติ';
      case 'rejected':
        return 'ไม่อนุมัติ';
      case 'canceled':
        return 'ยกเลิกแล้ว';
      default:
        return status;
    }
  };

  /**
   * แปลงสถานะการยกเลิกเป็นข้อความภาษาไทยสำหรับแสดงผล
   */
  const getCancelStatusText = (status) => {
    switch (status) {
      case 'waiting_for_approve':
        return 'รออนุมัติการยกเลิก';
      case 'approved':
        return 'อนุมัติการยกเลิก';
      case 'rejected':
        return 'ไม่อนุมัติการยกเลิก';
      default:
        return '';
    }
  };

  /**
   * คืนสีของ badge ตามสถานะ
   */
  const getStatusBadgeClass = (status) => {
    if (status === 'waiting_for_approve' || status === 'รออนุมัติ') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    if (status === 'approved' || status === 'อนุมัติ') return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    if (status === 'rejected' || status === 'ไม่อนุมัติ') return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    if (status === 'canceled' || status === 'ยกเลิกแล้ว') return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  };

  /**
   * คืนสีของ badge ตามสถานะการยกเลิก
   */
  const getCancelStatusBadgeClass = (status) => {
    if (status === 'waiting_for_approve') return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
    if (status === 'approved') return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    if (status === 'rejected') return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  };

  const filteredOvertimes = useMemo(() => {
    let filtered = overtimes;
    
    // กรองตามสถานะ
    if (filter === 'waiting_for_approve') {
      filtered = overtimes.filter(overtime => overtime.status === 'waiting_for_approve');
    } else if (filter === 'approved') {
      filtered = overtimes.filter(overtime => 
        overtime.status === 'approved' && 
        (!overtime.cancelStatus || overtime.cancelStatus !== 'waiting_for_approve')
      );
    } else if (filter === 'rejected') {
      filtered = overtimes.filter(overtime => overtime.status === 'rejected');
    } else if (filter === 'canceled') {
      filtered = overtimes.filter(overtime => 
        overtime.status === 'canceled' || 
        overtime.isCancelled === true
      );
    } else if (filter === 'pending_cancel') {
      filtered = overtimes.filter(overtime => 
        overtime.status === 'approved' && overtime.cancelStatus === 'waiting_for_approve'
      );
    }
    
    // ค้นหาตามข้อความ
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(overtime => 
        overtime.employee?.firstName?.toLowerCase().includes(query) ||
        overtime.employee?.lastName?.toLowerCase().includes(query) ||
        overtime.reason?.toLowerCase().includes(query)
      );
    }
    
    // จัดเรียงข้อมูล
    const sortedData = [...filtered].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // จัดการกับข้อมูลที่เป็น nested properties
      if (sortField === 'employee') {
        aValue = `${a.employee?.firstName || ''} ${a.employee?.lastName || ''}`;
        bValue = `${b.employee?.firstName || ''} ${b.employee?.lastName || ''}`;
      }
      
      // จัดการกับค่า null หรือ undefined
      if (aValue === undefined || aValue === null) aValue = '';
      if (bValue === undefined || bValue === null) bValue = '';
      
      // จัดเรียงตามประเภทข้อมูล
      if (typeof aValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === 'asc' ? comparison : -comparison;
      } else if (sortField === 'date' || sortField === 'createdAt') {
        const aDate = aValue ? new Date(aValue) : new Date(0);
        const bDate = bValue ? new Date(bValue) : new Date(0);
        return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
      } else {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
    });
    
    return sortedData;
  }, [overtimes, filter, searchQuery, sortField, sortDirection]);

  // คำนวณการแบ่งหน้า
  const totalPages = Math.ceil(filteredOvertimes.length / pageSize);
  const paginatedOvertimes = filteredOvertimes.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // ฟังก์ชันสำหรับเปลี่ยนหน้า
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // ฟังก์ชันสำหรับเปลี่ยนการจัดเรียง
  const handleSort = (field) => {
    if (sortField === field) {
      // ถ้าคลิกฟิลด์เดิม ให้สลับทิศทางการเรียง
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // ถ้าคลิกฟิลด์ใหม่ ให้เรียงจากมากไปน้อย (desc) เป็นค่าเริ่มต้น
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // ฟังก์ชันสำหรับแสดงไอคอนการจัดเรียง
  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return <span className="text-gray-400">↕</span>;
    }
    return sortDirection === 'asc' ? <FiChevronUp className="inline-block ml-1" /> : <FiChevronDown className="inline-block ml-1" />;
  };

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
    if (session.user.role === 'admin' && (overtime.status === 'waiting_for_approve' || overtime.status === 'รออนุมัติ')) {
      return true;
    }
    
    // หัวหน้างานอนุมัติได้ รวมถึงอนุมัติให้กับหัวหน้างานอื่นในทีมเดียวกัน และอนุมัติตัวเองด้วย
    if (session.user.role === 'supervisor' && (overtime.status === 'waiting_for_approve' || overtime.status === 'รออนุมัติ')) {
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
        overtime.status === 'waiting_for_approve' && 
        overtime.cancelStatus !== 'waiting_for_approve') {
      return true;
    }
    
    // แอดมินก็ลบได้เฉพาะเมื่อสถานะเป็น 'รออนุมัติ' เท่านั้น
    if (session.user.role === 'admin' && 
        overtime.status === 'waiting_for_approve' && 
        overtime.cancelStatus !== 'waiting_for_approve') {
      return true;
    }
    
    return false;
  };

  // ตรวจสอบว่าสามารถแก้ไขได้หรือไม่
  const canEdit = (overtime) => {
    if (!session || !overtime) return false;
    
    // พนักงานแก้ไขข้อมูลของตัวเองได้ถ้ายังไม่อนุมัติ
    if ((session.user.id === overtime.employeeId) && overtime.status === 'waiting_for_approve') {
      return true;
    }
    
    // แอดมินแก้ไขได้ทุกรายการที่ยังไม่อนุมัติ
    if (session.user.role === 'admin' && overtime.status === 'waiting_for_approve') {
      return true;
    }
    
    return false;
  };

  // ตรวจสอบว่าสามารถขอยกเลิกได้หรือไม่
  const canCancelRequest = (overtime) => {
    if (!session || !overtime) return false;
    
    // ตรวจสอบว่ามี approvals ข้อมูลและมีรูปแบบถูกต้อง
    if (!overtime.approvals || !Array.isArray(overtime.approvals)) return false;
    
    // เรียงลำดับตาม createdAt จากใหม่ไปเก่า
    const sortedApprovals = [...overtime.approvals].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    // หาการกระทำล่าสุดที่เกี่ยวข้องกับการขอยกเลิก (ถ้ามี)
    const latestCancelAction = sortedApprovals.find(a => 
      ['request_cancel', 'approve_cancel', 'reject_cancel'].includes(a.type) && 
      a.status === 'completed'
    );
    
    // ถ้ามีคำขอยกเลิกล่าสุดที่รอพิจารณา ไม่แสดงปุ่มขอยกเลิก
    if (latestCancelAction && latestCancelAction.type === 'request_cancel') {
      return false;
    }
    
    // สามารถขอยกเลิกได้ถ้า
    // 1. เป็นเจ้าของหรือเป็นแอดมิน และ
    // 2. สถานะเป็น "อนุมัติ" และ 
    // 3. ไม่ได้ถูกยกเลิกไปแล้ว และ
    // 4. ไม่มีการขอยกเลิก หรือ มีการปฏิเสธการยกเลิกแล้ว (latestCancelAction.type === 'reject_cancel')
    return (
      (session.user.id === overtime.employeeId || session.user.role === 'admin') && 
      overtime.status === 'approved' &&
      !overtime.isCancelled &&
      (!latestCancelAction || latestCancelAction.type === 'reject_cancel')
    );
  };

  // เพิ่มฟังก์ชันใหม่สำหรับตรวจสอบว่าเป็นการทำงานล่วงเวลาที่กำลังรอการยกเลิกหรือไม่
  const isDuringCancel = (overtime) => {
    if (!overtime) return false;
    
    // ตรวจสอบจาก cancelStatus โดยตรง
    if (overtime.status === 'approved' && overtime.cancelStatus === 'waiting_for_approve') {
      return true;
    }
    
    // ตรวจสอบกรณีที่อาจมีใน approvals
    if (overtime.approvals && Array.isArray(overtime.approvals)) {
      // เรียงลำดับการดำเนินการจากใหม่ไปเก่า
      const sortedApprovals = [...overtime.approvals].sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      
      // หาคำขอยกเลิกล่าสุด
      const lastCancelRequest = sortedApprovals.find(a => 
        a.type === 'request_cancel' && a.status === 'completed'
      );
      
      if (lastCancelRequest) {
        // ตรวจสอบว่ามีการตอบกลับหลังจากคำขอยกเลิกล่าสุดหรือไม่
        const hasResponseAfterRequest = sortedApprovals.some(a => 
          (a.type === 'approve_cancel' || a.type === 'reject_cancel') && 
          a.status === 'completed' && 
          new Date(a.createdAt) > new Date(lastCancelRequest.createdAt)
        );
        
        // ถ้าไม่มีการตอบกลับหลังจากคำขอยกเลิกล่าสุด แสดงว่ากำลังรอการยกเลิก
        if (!hasResponseAfterRequest) {
          return true;
        }
      }
    }
    
    return false;
  };

  // แก้ไขส่วนของการตรวจสอบ canManageCancelRequest โดยใช้ฟังก์ชัน isDuringCancel
  const canManageCancelRequest = (overtime) => {
    if (!session || !overtime) return false;
    
    // ตรวจสอบว่ามีบทบาทที่เหมาะสม
    const isAdmin = session.user.role === 'admin';
    const isSupervisor = session.user.role === 'supervisor';
    
    // ถ้าไม่ใช่แอดมินหรือหัวหน้างาน ไม่สามารถจัดการคำขอยกเลิกได้
    if (!isAdmin && !isSupervisor) return false;
    
    // ตรวจสอบว่ากำลังอยู่ในสถานะรอยกเลิกหรือไม่
    if (isDuringCancel(overtime)) {
      // หัวหน้างานต้องอยู่แผนกเดียวกับพนักงาน
      if (isSupervisor) {
        return !overtime.employee?.departmentId || !session.user.departmentId || 
               overtime.employee?.departmentId === session?.user?.departmentId;
      }
      return true; // แอดมินสามารถจัดการได้เสมอ
    }
    
    return false; // ไม่ได้อยู่ในสถานะรอการยกเลิก
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
          action: 'request_cancel',
          reason: cancelReason.trim() || null
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setSuccess('ส่งคำขอยกเลิกการทำงานล่วงเวลาเรียบร้อยแล้ว');
        // รีเฟรชข้อมูลการทำงานล่วงเวลา
        fetchOvertimes();
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
          action: 'approve_cancel',
          comment: null
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setSuccess('อนุมัติการยกเลิกการทำงานล่วงเวลาเรียบร้อยแล้ว');
        // รีเฟรชข้อมูลการทำงานล่วงเวลา
        fetchOvertimes();
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
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-bold mb-4 sm:mb-0">
          การทำงานล่วงเวลา
        </h1>
        
        <div className="flex space-x-2">
          {(session?.user?.role === 'employee' || session?.user?.role === 'supervisor') && (
            <Link href="/overtime/create">
              <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 px-4 py-2 bg-primary text-primary-foreground shadow hover:bg-primary/90">
                <FiPlus className="mr-1" />
                ขอทำงานล่วงเวลา
              </button>
            </Link>
          )}
        </div>
      </div>
      
      {error && <ErrorMessage message={error} onClose={() => setError('')} />}
      {success && (
        <div className="alert alert-success mb-4 flex justify-between items-center">
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="btn btn-sm btn-ghost">
            <FiXCircle />
          </button>
        </div>
      )}
      
      <div className="mb-6">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border shadow-sm">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
            <FiFilter className="mr-2" /> กรองข้อมูล
          </h2>
          
          {/* กรองตามสถานะ */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setFilter('all')}
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 px-3 py-1.5 ${
                filter === 'all'
                  ? 'bg-primary text-primary-foreground shadow hover:bg-primary/90'
                  : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              ทั้งหมด ({statusCounts.all})
            </button>
            <button
              onClick={() => setFilter('waiting_for_approve')}
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 px-3 py-1.5 ${
                filter === 'waiting_for_approve'
                  ? 'bg-yellow-500 text-white shadow hover:bg-yellow-600'
                  : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              รออนุมัติ ({statusCounts.waiting_for_approve})
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 px-3 py-1.5 ${
                filter === 'approved'
                  ? 'bg-green-600 text-white shadow hover:bg-green-700'
                  : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              อนุมัติแล้ว ({statusCounts.approved})
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 px-3 py-1.5 ${
                filter === 'rejected'
                  ? 'bg-red-600 text-white shadow hover:bg-red-700'
                  : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              ไม่อนุมัติ ({statusCounts.rejected})
            </button>
            <button
              onClick={() => setFilter('canceled')}
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 px-3 py-1.5 ${
                filter === 'canceled'
                  ? 'bg-purple-600 text-white shadow hover:bg-purple-700'
                  : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              ยกเลิกแล้ว ({statusCounts.canceled})
            </button>
            <button
              onClick={() => setFilter('pending_cancel')}
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 px-3 py-1.5 ${
                filter === 'pending_cancel'
                  ? 'bg-orange-600 text-white shadow hover:bg-orange-700'
                  : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              รอยกเลิก ({statusCounts.pending_cancel})
            </button>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            {/* ช่องค้นหา */}
            <div className="flex-1 w-1/2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
                ค้นหา
              </label>
              <div className="relative">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  type="search"
                  placeholder="ค้นหาจากชื่อพนักงาน, ประเภทเวลา..."
                  className="flex h-9 w-full rounded-md border border-input bg-transparent pl-9 pr-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* แสดงรายการการทำงานล่วงเวลาแบบตาราง */}
      {filteredOvertimes.length > 0 ? (
        <div className="space-y-4">
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b">
                  <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <th className="px-6 py-3">
                      <button 
                        onClick={() => handleSort('date')} 
                        className="flex items-center cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                      >
                        วันที่ทำงานล่วงเวลา {renderSortIcon('date')}
                      </button>
                    </th>
                    <th className="px-6 py-3">
                      <button 
                        onClick={() => handleSort('employee')} 
                        className="flex items-center cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                      >
                        พนักงาน {renderSortIcon('employee')}
                      </button>
                    </th>
                    <th className="px-6 py-3">
                      <div className="flex items-center">
                        เวลาทำงาน
                      </div>
                    </th>
                    <th className="px-6 py-3">
                      <button 
                        onClick={() => handleSort('status')} 
                        className="flex items-center cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                      >
                        สถานะ {renderSortIcon('status')}
                      </button>
                    </th>
                    <th className="px-6 py-3">
                      <button 
                        onClick={() => handleSort('createdAt')} 
                        className="flex items-center cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                      >
                        วันที่สร้าง {renderSortIcon('createdAt')}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                  {paginatedOvertimes.map((overtime) => (
                    <tr 
                      key={overtime.id} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FiCalendar className="h-4 w-4 text-primary mr-2" />
                          <span>{formatDate(overtime.date)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {overtime.employee?.image ? (
                            <div className="h-8 w-8 rounded-full overflow-hidden">
                              <Image
                                src={overtime.employee.image}
                                alt={overtime.employee.firstName}
                                width={32}
                                height={32}
                                className="rounded-full"
                                unoptimized={isMockImage(overtime.employee.image)}
                              />
                            </div>
                          ) : (
                            <div className="flex h-8 w-8 rounded-full bg-primary text-primary-content items-center justify-center">
                              <span className="text-xs font-medium">
                                {overtime.employee?.firstName?.[0] || ''}{overtime.employee?.lastName?.[0] || ''}
                              </span>
                            </div>
                          )}
                          <div className="ml-1">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-200">
                              {overtime.employee?.firstName || ''} {overtime.employee?.lastName || ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-200">
                          {overtime.startTime} - {overtime.endTime} น.
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          ({overtime.totalHours} ชั่วโมง)
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          {(() => {
                            // ตรวจสอบสถานะการยกเลิก
                            if (overtime.isCancelled || overtime.status === 'canceled' || overtime.cancelStatus === 'approved') {
                              return (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
                                  ยกเลิกแล้ว
                                </span>
                              );
                            }
                            
                            // ตรวจสอบสถานะรอยกเลิก
                            if (isDuringCancel(overtime)) {
                              return (
                                <div className="flex flex-col gap-1">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                                    ขอยกเลิก
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">(รออนุมัติการยกเลิก)</span>
                                </div>
                              );
                            }
                            
                            // แสดงสถานะปกติ
                            const bgClass = getStatusBadgeClass(overtime.status);
                            return (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgClass}`}>
                                {getStatusText(overtime.status)}
                              </span>
                            );
                          })()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(overtime.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex justify-center items-center space-x-2">
                          {/* ปุ่มดูรายละเอียด */}
                          <button 
                            onClick={() => navigateToOvertimeDetail(overtime.id)}
                            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400"
                            title="ดูรายละเอียด"
                          >
                            <FiInfo className="h-4 w-4" />
                          </button>
                          
                          {/* ปุ่มแก้ไข */}
                          {canEdit(overtime) && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/overtime/${overtime.id}/edit`);
                              }}
                              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400"
                              title="แก้ไข"
                              disabled={actionLoading}
                            >
                              <FiEdit className="h-4 w-4" />
                            </button>
                          )}
                          
                          {/* ปุ่มอนุมัติ */}
                          {canApprove(overtime) && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApprove(overtime.id);
                              }}
                              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-green-600 dark:text-green-400"
                              title="อนุมัติ"
                              disabled={actionLoading}
                            >
                              <FiCheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          
                          {/* ปุ่มไม่อนุมัติ */}
                          {canApprove(overtime) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShowRejectModal(overtime.id);
                              }}
                              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 dark:text-red-400"
                              title="ไม่อนุมัติ"
                              disabled={actionLoading}
                            >
                              <FiXCircle className="h-4 w-4" />
                            </button>
                          )}
                          
                          {/* ปุ่มลบ */}
                          {canDelete(overtime) && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(overtime.id);
                              }}
                              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 dark:text-red-400"
                              title="ลบ"
                              disabled={actionLoading}
                            >
                              <FiTrash2 className="h-4 w-4" />
                            </button>
                          )}

                          {/* ปุ่มขอยกเลิกการทำงานล่วงเวลา */}
                          {canCancelRequest(overtime) && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShowCancelModal(overtime.id);
                              }}
                              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-orange-600 dark:text-orange-400"
                              title="ขอยกเลิก"
                              disabled={actionLoading}
                            >
                              <FiXCircle className="h-4 w-4" />
                            </button>
                          )}
                          
                          {/* ปุ่มอนุมัติการยกเลิก */}
                          {canManageCancelRequest(overtime) && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApproveCancel(overtime.id);
                              }}
                              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-green-600 dark:text-green-400"
                              title="อนุมัติยกเลิก"
                              disabled={actionLoading}
                            >
                              <FiCheckCircle className="h-4 w-4" />
                            </button>
                          )}

                          {/* ปุ่มไม่อนุมัติการยกเลิก */}
                          {canManageCancelRequest(overtime) && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                openRejectCancelModal(overtime.id);
                              }}
                              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 dark:text-red-400"
                              title="ไม่อนุมัติยกเลิก"
                              disabled={actionLoading}
                            >
                              <FiXCircle className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-4">
              <div className="join">
                <button
                  className="join-item btn btn-sm"
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                >
                  «
                </button>
                <button
                  className="join-item btn btn-sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  ‹
                </button>
                
                {[...Array(totalPages)].map((_, index) => {
                  const pageNumber = index + 1;
                  // แสดงเฉพาะหน้าปัจจุบัน หน้าก่อนหน้า และหน้าถัดไป
                  if (
                    pageNumber === 1 ||
                    pageNumber === totalPages ||
                    Math.abs(pageNumber - currentPage) <= 1
                  ) {
                    return (
                      <button
                        key={pageNumber}
                        className={`join-item btn btn-sm ${currentPage === pageNumber ? 'btn-active' : ''}`}
                        onClick={() => handlePageChange(pageNumber)}
                      >
                        {pageNumber}
                      </button>
                    );
                  } else if (
                    (pageNumber === 2 && currentPage > 3) ||
                    (pageNumber === totalPages - 1 && currentPage < totalPages - 2)
                  ) {
                    // แสดงจุดไข่ปลาเมื่อมีหน้าที่ไม่ได้แสดง
                    return <span key={pageNumber} className="join-item btn btn-sm btn-disabled">...</span>;
                  }
                  return null;
                })}
                
                <button
                  className="join-item btn btn-sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  ›
                </button>
                <button
                  className="join-item btn btn-sm"
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  »
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <FiClock className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
          <p className="text-lg text-gray-600 dark:text-gray-300">ไม่พบข้อมูลการทำงานล่วงเวลา</p>
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 sm:mx-0 sm:h-10 sm:w-10">
                    <FiCheckCircle className="h-6 w-6 text-green-600 dark:text-green-300" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100" id="modal-title">
                      อนุมัติการทำงานล่วงเวลา
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        คุณต้องการอนุมัติการทำงานล่วงเวลานี้ใช่หรือไม่
                      </p>
                      <div className="mt-4">
                        <label htmlFor="approve-comment" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          ความคิดเห็น (ไม่บังคับ)
                        </label>
                        <textarea
                          id="approve-comment"
                          name="approve-comment"
                          rows="3"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          value={approveComment}
                          onChange={(e) => setApproveComment(e.target.value)}
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={(e) => handleApprove(selectedOvertimeId, approveComment)}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'กำลังดำเนินการ...' : 'อนุมัติ'}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                  onClick={() => setShowApproveModal(false)}
                  disabled={actionLoading}
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
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
                onClick={(e) => handleReject(e)}
                className="btn btn-error text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'กำลังดำเนินการ...' : 'ไม่อนุมัติ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
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

      {/* Reject Cancel Modal */}
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