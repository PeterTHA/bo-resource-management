'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

// เปลี่ยนจาก Heroicons เป็น react-icons
import { FiCheckCircle, FiXCircle, FiTrash2, FiPlus, FiFilter, FiClock, FiUser, 
         FiFileText, FiDownload, FiInfo, FiEdit, FiCalendar, FiSearch, FiChevronUp, FiChevronDown } from 'react-icons/fi';
import { FiSave } from 'react-icons/fi';
import { LoadingPage } from '../../components/ui/LoadingSpinner';
import ErrorMessage from '../../components/ui/ErrorMessage';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// เพิ่ม import Sheet component
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";

import { useToast } from '@/components/ui/use-toast';

// เพิ่มฟังก์ชันตรวจสอบว่าเป็นรูปภาพจาก mock-images หรือไม่
const isMockImage = (src) => {
  return src && typeof src === 'string' && (src.startsWith('/mock-images/') || src.startsWith('./mock-images/'));
};

export default function OvertimePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { toast } = useToast();

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
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showApproveCancelConfirmModal, setShowApproveCancelConfirmModal] = useState(false);
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
    waiting_for_approve: 0,
    approved: 0,
    rejected: 0,
    canceled: 0,
    pending_cancel: 0
  });
  // เพิ่ม state สำหรับการจัดเรียงและแบ่งหน้า
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [selectedOvertimeForEdit, setSelectedOvertimeForEdit] = useState(null);
  const [editFormData, setEditFormData] = useState({
    employee: '',
    date: '',
    startTime: '',
    endTime: '',
    reason: '',
  });
  const [editTotalHours, setEditTotalHours] = useState(0);
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  // เพิ่ม state สำหรับ Sheet การสร้างรายการใหม่
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    employee: '',
    date: '',
    startTime: '',
    endTime: '',
    reason: '',
  });
  const [createTotalHours, setCreateTotalHours] = useState(0);
  const [createSubmitting, setCreateSubmitting] = useState(false);

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
    if (!window.confirm('คุณต้องการลบข้อมูลการทำงานล่วงเวลานี้ใช่หรือไม่?')) return;
    
    try {
      setLoading(true);
      
      const response = await fetch(`/api/overtime/${id}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSuccess('ลบข้อมูลการทำงานล่วงเวลาเรียบร้อยแล้ว');
        toast({
          title: "ลบข้อมูลสำเร็จ",
          description: 'ลบข้อมูลการทำงานล่วงเวลาเรียบร้อยแล้ว',
          duration: 10000,
        });
        // รีเฟรชข้อมูลการทำงานล่วงเวลา
        fetchOvertimes();
      } else {
        setError(result.message || 'ลบข้อมูลไม่สำเร็จ');
        toast({
          variant: "destructive",
          title: "เกิดข้อผิดพลาด",
          description: result.message || 'ลบข้อมูลไม่สำเร็จ',
          duration: 10000,
        });
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
      toast({
        variant: "destructive",
        title: "เกิดข้อผิดพลาด",
        description: 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์',
        duration: 10000,
      });
      console.error(error);
    } finally {
      setLoading(false);
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

      const response = await fetch(`/api/overtime/${overtimeId || selectedOvertimeId}`, {
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
        toast({
          title: "อนุมัติสำเร็จ",
          description: 'อนุมัติการทำงานล่วงเวลาเรียบร้อยแล้ว',
          duration: 10000,
        });
        // รีเฟรชข้อมูลการทำงานล่วงเวลา
        fetchOvertimes();
        setShowApproveModal(false);
        setApproveComment('');
      } else {
        setError(result.message || 'เกิดข้อผิดพลาดในการอนุมัติการทำงานล่วงเวลา');
        toast({
          variant: "destructive",
          title: "เกิดข้อผิดพลาด",
          description: result.message || 'เกิดข้อผิดพลาดในการอนุมัติการทำงานล่วงเวลา',
          duration: 10000,
        });
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการอนุมัติการทำงานล่วงเวลา');
      toast({
        variant: "destructive",
        title: "เกิดข้อผิดพลาด",
        description: 'เกิดข้อผิดพลาดในการอนุมัติการทำงานล่วงเวลา',
        duration: 10000,
      });
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
        toast({
          title: "ไม่อนุมัติสำเร็จ",
          description: 'ไม่อนุมัติการทำงานล่วงเวลาเรียบร้อยแล้ว',
          duration: 10000,
        });
        // รีเฟรชข้อมูลการทำงานล่วงเวลา
        fetchOvertimes();
        setShowRejectModal(false);
        setRejectReason('');
      } else {
        setError(result.message || 'เกิดข้อผิดพลาดในการไม่อนุมัติการทำงานล่วงเวลา');
        toast({
          variant: "destructive",
          title: "เกิดข้อผิดพลาด",
          description: result.message || 'เกิดข้อผิดพลาดในการไม่อนุมัติการทำงานล่วงเวลา',
          duration: 10000,
        });
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการไม่อนุมัติการทำงานล่วงเวลา');
      toast({
        variant: "destructive",
        title: "เกิดข้อผิดพลาด",
        description: 'เกิดข้อผิดพลาดในการไม่อนุมัติการทำงานล่วงเวลา',
        duration: 10000,
      });
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
        toast({
          title: "ปฏิเสธการยกเลิกสำเร็จ",
          description: 'ปฏิเสธการยกเลิกการทำงานล่วงเวลาเรียบร้อยแล้ว',
          duration: 10000,
        });
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
        toast({
          variant: "destructive",
          title: "เกิดข้อผิดพลาด",
          description: data.message || 'เกิดข้อผิดพลาดในการปฏิเสธการยกเลิกการทำงานล่วงเวลา',
          duration: 10000,
        });
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
      toast({
        variant: "destructive",
        title: "เกิดข้อผิดพลาด",
        description: 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์',
        duration: 10000,
      });
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
    
    // ค้นหาเฉพาะชื่อพนักงานเท่านั้น
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(overtime => 
        overtime.employee?.firstName?.toLowerCase().includes(query) ||
        overtime.employee?.lastName?.toLowerCase().includes(query)
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
        toast({
          title: "ส่งคำขอสำเร็จ",
          description: 'ส่งคำขอยกเลิกการทำงานล่วงเวลาเรียบร้อยแล้ว',
          duration: 10000,
        });
        // รีเฟรชข้อมูลการทำงานล่วงเวลา
        fetchOvertimes();
        // ปิด modal
        setShowCancelModal(false);
        setSelectedOvertimeId(null);
        setCancelReason('');
      } else {
        setError(data.message || 'เกิดข้อผิดพลาดในการส่งคำขอยกเลิกการทำงานล่วงเวลา');
        toast({
          variant: "destructive",
          title: "เกิดข้อผิดพลาด",
          description: data.message || 'เกิดข้อผิดพลาดในการส่งคำขอยกเลิกการทำงานล่วงเวลา',
          duration: 10000,
        });
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
      toast({
        variant: "destructive",
        title: "เกิดข้อผิดพลาด",
        description: 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์',
        duration: 10000,
      });
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  // ฟังก์ชันสำหรับเปิด dialog การอนุมัติการยกเลิก
  const handleApproveCancel = (id) => {
    setSelectedOvertimeId(id);
    setShowApproveCancelConfirmModal(true);
  };
  
  // ฟังก์ชันใหม่สำหรับยืนยันการอนุมัติการยกเลิก
  const confirmApproveCancel = async () => {
    if (!selectedOvertimeId) return;
    
    try {
      setActionLoading(true);
      const res = await fetch(`/api/overtime/${selectedOvertimeId}`, {
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
        toast({
          title: "อนุมัติการยกเลิกสำเร็จ",
          description: 'อนุมัติการยกเลิกการทำงานล่วงเวลาเรียบร้อยแล้ว',
          duration: 10000,
        });
        // รีเฟรชข้อมูลการทำงานล่วงเวลา
        fetchOvertimes();
        // ปิด dialog
        setShowApproveCancelConfirmModal(false);
      } else {
        setError(data.message || 'เกิดข้อผิดพลาดในการอนุมัติการยกเลิกการทำงานล่วงเวลา');
        toast({
          variant: "destructive",
          title: "เกิดข้อผิดพลาด",
          description: data.message || 'เกิดข้อผิดพลาดในการอนุมัติการยกเลิกการทำงานล่วงเวลา',
          duration: 10000,
        });
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
      toast({
        variant: "destructive",
        title: "เกิดข้อผิดพลาด",
        description: 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์',
        duration: 10000,
      });
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

  // เพิ่มฟังก์ชันสำหรับการเปิด Sheet แก้ไข
  const openEditSheet = async (overtimeId) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/overtime/${overtimeId}`);
      const data = await res.json();

      if (data.success) {
        const overtimeData = data.data;
        setSelectedOvertimeForEdit(overtimeData);
        
        // กำหนดค่าเริ่มต้นให้ฟอร์ม
        setEditFormData({
          employee: overtimeData.employeeId,
          date: new Date(overtimeData.date).toISOString().split('T')[0],
          startTime: overtimeData.startTime,
          endTime: overtimeData.endTime,
          reason: overtimeData.reason,
        });
        
        // คำนวณจำนวนชั่วโมงทำงานล่วงเวลา
        setEditTotalHours(overtimeData.totalHours);
        setShowEditSheet(true);
      } else {
        setError(data.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลการทำงานล่วงเวลา');
        toast({
          variant: "destructive",
          title: "เกิดข้อผิดพลาด",
          description: data.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลการทำงานล่วงเวลา',
          duration: 10000,
        });
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
      toast({
        variant: "destructive",
        title: "เกิดข้อผิดพลาด",
        description: 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์',
        duration: 10000,
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // เพิ่มฟังก์ชันสำหรับคำนวณจำนวนชั่วโมงทำงานล่วงเวลา
  const calculateTotalHours = (startTimeValue, endTimeValue) => {
    // ใช้ค่าที่ส่งเข้ามาถ้ามี มิฉะนั้นใช้ค่าจาก state
    const startTime = startTimeValue || editFormData.startTime;
    const endTime = endTimeValue || editFormData.endTime;
    
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
      console.log('=== ข้อมูลการคำนวณเวลาทำงานล่วงเวลา ===');
      console.log('ค่าที่ใช้คำนวณ - เวลาเริ่มต้น:', startTime);
      console.log('ค่าที่ใช้คำนวณ - เวลาสิ้นสุด:', endTime);
      console.log('ค่าใน state - เวลาเริ่มต้น:', editFormData.startTime);
      console.log('ค่าใน state - เวลาสิ้นสุด:', editFormData.endTime);
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

  // เพิ่มฟังก์ชันเมื่อข้อมูลใน form เปลี่ยนแปลง
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    
    // ถ้าเปลี่ยนเวลาเริ่มหรือเวลาสิ้นสุด ให้คำนวณจำนวนชั่วโมงใหม่
    if (name === 'startTime' || name === 'endTime') {
      // สร้าง object ชั่วคราวเพื่อเก็บค่าที่อัปเดต
      const updatedFormData = { ...editFormData, [name]: value };
      
      // คำนวณชั่วโมงทำงานทันทีด้วยค่าจริงจาก input fields
      const hours = calculateTotalHours(
        name === 'startTime' ? value : editFormData.startTime,
        name === 'endTime' ? value : editFormData.endTime
      );
      
      setEditTotalHours(hours);
      
      // ตรวจสอบความถูกต้องของข้อมูล
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
    setEditFormData({ ...editFormData, [name]: value });
  };

  // ฟังก์ชันสำหรับบันทึกข้อมูลที่แก้ไข
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedOvertimeForEdit) return;
    
    try {
      setEditSubmitting(true);
      setError('');
      
      // ตรวจสอบข้อมูลที่จำเป็น
      if (!editFormData.date || !editFormData.startTime || !editFormData.endTime || !editFormData.reason) {
        setError('กรุณากรอกข้อมูลให้ครบถ้วน');
        toast({
          variant: "destructive",
          title: "เกิดข้อผิดพลาด",
          description: 'กรุณากรอกข้อมูลให้ครบถ้วน',
          duration: 10000,
        });
        return;
      }
      
      // ตรวจสอบเวลา - ใช้ค่าปัจจุบันจาก state เพื่อคำนวณเวลาสุดท้าย
      const totalHours = calculateTotalHours();
      
      if (totalHours <= 0) {
        setError('เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น');
        toast({
          variant: "destructive",
          title: "เกิดข้อผิดพลาด",
          description: 'เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น',
          duration: 10000,
        });
        return;
      }
      
      // ส่งข้อมูลไปบันทึก
      const response = await fetch(`/api/overtime/${selectedOvertimeForEdit.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: editFormData.employee,
          date: editFormData.date,
          startTime: editFormData.startTime,
          endTime: editFormData.endTime,
          reason: editFormData.reason,
          totalHours: totalHours,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSuccess('บันทึกข้อมูลการทำงานล่วงเวลาเรียบร้อยแล้ว');
        toast({
          title: "บันทึกสำเร็จ",
          description: 'บันทึกข้อมูลการทำงานล่วงเวลาเรียบร้อยแล้ว',
          duration: 10000,
        });
        // รีเฟรชข้อมูลการทำงานล่วงเวลา
        fetchOvertimes();
        // ปิด Sheet
        setShowEditSheet(false);
      } else {
        setError(result.message || 'บันทึกข้อมูลไม่สำเร็จ');
        toast({
          variant: "destructive",
          title: "เกิดข้อผิดพลาด",
          description: result.message || 'บันทึกข้อมูลไม่สำเร็จ',
          duration: 10000,
        });
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
      toast({
        variant: "destructive",
        title: "เกิดข้อผิดพลาด",
        description: 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์',
        duration: 10000,
      });
      console.error(error);
    } finally {
      setEditSubmitting(false);
    }
  };

  // ฟังก์ชันสำหรับอนุมัติ/ปฏิเสธการทำงานล่วงเวลา
  const handleUpdateStatus = async (id, newStatus) => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/overtime/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSuccess(`อัปเดตสถานะเป็น "${newStatus}" เรียบร้อยแล้ว`);
        toast({
          title: "อัปเดตสถานะสำเร็จ",
          description: `อัปเดตสถานะเป็น "${newStatus}" เรียบร้อยแล้ว`,
          duration: 10000,
        });
        // รีเฟรชข้อมูลการทำงานล่วงเวลา
        fetchOvertimes();
      } else {
        setError(result.message || 'อัปเดตสถานะไม่สำเร็จ');
        toast({
          variant: "destructive",
          title: "เกิดข้อผิดพลาด",
          description: result.message || 'อัปเดตสถานะไม่สำเร็จ',
          duration: 10000,
        });
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
      toast({
        variant: "destructive",
        title: "เกิดข้อผิดพลาด",
        description: 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์',
        duration: 10000,
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // เพิ่มฟังก์ชันสำหรับเปิด Sheet การสร้างรายการใหม่
  const openCreateSheet = () => {
    // ตั้งค่าเริ่มต้นให้เป็นของตัวเองเสมอ
    setCreateFormData({
      employee: session.user.id, // ใช้ ID ของผู้ใช้ปัจจุบันเสมอ
      date: new Date().toISOString().split('T')[0],
      startTime: '',
      endTime: '',
      reason: '',
    });
    setCreateTotalHours(0);
    setShowCreateSheet(true);
  };

  // เพิ่มฟังก์ชันสำหรับการจัดการเมื่อข้อมูลใน form สร้างใหม่เปลี่ยนแปลง
  const handleCreateInputChange = (e) => {
    const { name, value } = e.target;
    
    // ถ้าเปลี่ยนเวลาเริ่มหรือเวลาสิ้นสุด ให้คำนวณจำนวนชั่วโมงใหม่
    if (name === 'startTime' || name === 'endTime') {
      // สร้าง object ชั่วคราวเพื่อเก็บค่าที่อัปเดต
      const updatedFormData = { ...createFormData, [name]: value };
      
      // คำนวณชั่วโมงทำงานทันทีด้วยค่าจริงจาก input fields
      const hours = calculateCreateTotalHours(
        name === 'startTime' ? value : createFormData.startTime,
        name === 'endTime' ? value : createFormData.endTime
      );
      
      setCreateTotalHours(hours);
    }
    
    // อัปเดต state
    setCreateFormData({ ...createFormData, [name]: value });
  };

  // เพิ่มฟังก์ชันสำหรับคำนวณจำนวนชั่วโมงทำงานล่วงเวลาสำหรับการสร้างใหม่
  const calculateCreateTotalHours = (startTimeValue, endTimeValue) => {
    // ใช้ค่าที่ส่งเข้ามาถ้ามี มิฉะนั้นใช้ค่าจาก state
    const startTime = startTimeValue || createFormData.startTime;
    const endTime = endTimeValue || createFormData.endTime;
    
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
      
      // คำนวณความแตกต่างเป็นชั่วโมง
      const diffMinutes = Math.abs(endMinutes - startMinutes);
      const totalHours = diffMinutes / 60;
      
      // แปลงให้เป็นทศนิยม 2 ตำแหน่ง
      return Number(totalHours.toFixed(2));
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการคำนวณชั่วโมงทำงาน:", error);
      return 0;
    }
  };

  // เพิ่มฟังก์ชันสำหรับบันทึกข้อมูลการสร้างรายการใหม่
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setCreateSubmitting(true);
      setError('');
      
      // ตรวจสอบข้อมูลที่จำเป็น
      if (!createFormData.employee || !createFormData.date || !createFormData.startTime || !createFormData.endTime || !createFormData.reason) {
        toast({
          variant: "destructive",
          title: "เกิดข้อผิดพลาด",
          description: 'กรุณากรอกข้อมูลให้ครบถ้วน',
          duration: 10000,
        });
        return;
      }
      
      // ตรวจสอบเวลา
      const totalHours = calculateCreateTotalHours();
      
      if (totalHours <= 0) {
        toast({
          variant: "destructive",
          title: "เกิดข้อผิดพลาด",
          description: 'เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น',
          duration: 10000,
        });
        return;
      }
      
      // ส่งข้อมูลไปบันทึก
      const response = await fetch('/api/overtime', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: createFormData.employee,
          date: createFormData.date,
          startTime: createFormData.startTime,
          endTime: createFormData.endTime,
          reason: createFormData.reason,
          totalHours: totalHours,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "บันทึกสำเร็จ",
          description: 'บันทึกข้อมูลการทำงานล่วงเวลาเรียบร้อยแล้ว',
          duration: 10000,
        });
        // รีเฟรชข้อมูลการทำงานล่วงเวลา
        fetchOvertimes();
        // ปิด Sheet
        setShowCreateSheet(false);
      } else {
        toast({
          variant: "destructive",
          title: "เกิดข้อผิดพลาด",
          description: result.message || 'บันทึกข้อมูลไม่สำเร็จ',
          duration: 10000,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "เกิดข้อผิดพลาด",
        description: 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์',
        duration: 10000,
      });
      console.error(error);
    } finally {
      setCreateSubmitting(false);
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
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-bold mb-4 sm:mb-0">
          การทำงานล่วงเวลา
        </h1>
        
        <div className="flex space-x-2">
          {(session?.user?.role === 'employee' || session?.user?.role === 'supervisor') && (
            <button 
              onClick={openCreateSheet}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 px-4 py-2 bg-primary text-primary-foreground shadow hover:bg-primary/90"
            >
              <FiPlus className="mr-1" />
              ขอทำงานล่วงเวลา
            </button>
          )}
        </div>
      </div>
      
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
                  placeholder="ค้นหาจากชื่อพนักงาน..."
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
                        onClick={() => handleSort('employee')} 
                        className="flex items-center cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                      >
                        พนักงาน {renderSortIcon('employee')}
                      </button>
                    </th>
                    <th className="px-6 py-3">
                      <button 
                        onClick={() => handleSort('date')} 
                        className="flex items-center cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                      >
                        วันที่ทำงานล่วงเวลา {renderSortIcon('date')}
                      </button>
                    </th>
                    <th className="px-6 py-3">
                      <div className="flex items-center">
                        เวลาทำงาน
                      </div>
                    </th>
                    <th className="px-6 py-3">
                      <button 
                        onClick={() => handleSort('totalHours')} 
                        className="flex items-center cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                      >
                        จำนวนชั่วโมง {renderSortIcon('totalHours')}
                      </button>
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
                        <div className="flex items-center">
                          <FiCalendar className="h-4 w-4 text-primary mr-2" />
                          <span>{formatDate(overtime.date)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-200">
                          {overtime.startTime} - {overtime.endTime} น.
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-200 font-medium">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                            {overtime.totalHours === 1 ? "1 ชั่วโมง" : `${overtime.totalHours} ชั่วโมง`}
                          </span>
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
                                openEditSheet(overtime.id);
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
        <AlertDialog open={showApproveModal} onOpenChange={setShowApproveModal}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-start">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <FiCheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <AlertDialogTitle>อนุมัติการทำงานล่วงเวลา</AlertDialogTitle>
                  <AlertDialogDescription>
                    คุณต้องการอนุมัติการทำงานล่วงเวลานี้ใช่หรือไม่?
                  </AlertDialogDescription>
                </div>
              </div>
            </AlertDialogHeader>
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                ความคิดเห็น (ไม่บังคับ)
              </label>
              <textarea
                rows="3"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="ระบุบันทึกเพิ่มเติม"
                value={approveComment}
                onChange={(e) => setApproveComment(e.target.value)}
              ></textarea>
            </div>
            <AlertDialogFooter className="mt-4">
              <AlertDialogCancel disabled={actionLoading}>ยกเลิก</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => handleApprove(selectedOvertimeId, approveComment)}
                disabled={actionLoading}
                className="bg-green-600 text-white hover:bg-green-700 inline-flex items-center"
              >
                {actionLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-opacity-20 border-t-white rounded-full"></div>
                    <span>กำลังดำเนินการ</span>
                  </div>
                ) : (
                  <>
                    <FiCheckCircle className="mr-1.5 h-4 w-4" />
                    <span>อนุมัติ</span>
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <AlertDialog open={showRejectModal} onOpenChange={setShowRejectModal}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-start">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                  <FiXCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="ml-4">
                  <AlertDialogTitle>ไม่อนุมัติการทำงานล่วงเวลา</AlertDialogTitle>
                  <AlertDialogDescription>
                    กรุณาระบุเหตุผลที่ไม่อนุมัติการทำงานล่วงเวลานี้
                  </AlertDialogDescription>
                </div>
              </div>
            </AlertDialogHeader>
            <div className="mt-3">
              <textarea
                rows="3"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="ระบุเหตุผลที่ไม่อนุมัติ (ไม่บังคับ)"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              ></textarea>
            </div>
            <AlertDialogFooter className="mt-4">
              <AlertDialogCancel disabled={isSubmitting}>ยกเลิก</AlertDialogCancel>
              <AlertDialogAction 
                onClick={(e) => handleReject(e)}
                disabled={isSubmitting}
                className="bg-red-600 text-white hover:bg-red-700 inline-flex items-center"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-opacity-20 border-t-white rounded-full"></div>
                    <span>กำลังดำเนินการ</span>
                  </div>
                ) : (
                  <>
                    <FiXCircle className="mr-1.5 h-4 w-4" />
                    <span>ไม่อนุมัติ</span>
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <AlertDialog open={showCancelModal} onOpenChange={setShowCancelModal}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-start">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                  <FiXCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="ml-4">
                  <AlertDialogTitle>ขอยกเลิกการทำงานล่วงเวลา</AlertDialogTitle>
                  <AlertDialogDescription>
                    กรุณาระบุเหตุผลในการขอยกเลิกการทำงานล่วงเวลานี้
                  </AlertDialogDescription>
                </div>
              </div>
            </AlertDialogHeader>
            <div className="mt-3">
              <textarea
                rows="3"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="ระบุเหตุผลในการขอยกเลิก"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              ></textarea>
            </div>
            <AlertDialogFooter className="mt-4">
              <AlertDialogCancel disabled={actionLoading}>ยกเลิก</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleCancelRequest}
                disabled={actionLoading || !cancelReason.trim()}
                className="bg-orange-600 text-white hover:bg-orange-700 inline-flex items-center"
              >
                {actionLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-opacity-20 border-t-white rounded-full"></div>
                    <span>กำลังดำเนินการ</span>
                  </div>
                ) : (
                  <>
                    <FiXCircle className="mr-1.5 h-4 w-4" />
                    <span>ยืนยันการขอยกเลิก</span>
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Reject Cancel Modal */}
      {showRejectCancelModal && (
        <AlertDialog open={showRejectCancelModal} onOpenChange={setShowRejectCancelModal}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-start">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                  <FiXCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="ml-4">
                  <AlertDialogTitle>ไม่อนุมัติการยกเลิกการทำงานล่วงเวลา</AlertDialogTitle>
                  <AlertDialogDescription>
                    กรุณาระบุเหตุผลการไม่อนุมัติการยกเลิก
                  </AlertDialogDescription>
                </div>
              </div>
            </AlertDialogHeader>
            <div className="mt-3">
              <textarea
                rows="3"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="ระบุเหตุผล"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              ></textarea>
            </div>
            <AlertDialogFooter className="mt-4">
              <AlertDialogCancel disabled={actionLoading}>ยกเลิก</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleRejectCancel}
                disabled={actionLoading || !cancelReason.trim()}
                className="bg-red-600 text-white hover:bg-red-700 inline-flex items-center"
              >
                {actionLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-opacity-20 border-t-white rounded-full"></div>
                    <span>กำลังดำเนินการ</span>
                  </div>
                ) : (
                  <>
                    <FiXCircle className="mr-1.5 h-4 w-4" />
                    <span>ไม่อนุมัติการยกเลิก</span>
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && (
        <AlertDialog open={showDeleteConfirmModal} onOpenChange={setShowDeleteConfirmModal}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-start">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                  <FiTrash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="ml-4">
                  <AlertDialogTitle>ยืนยันการลบข้อมูล</AlertDialogTitle>
                  <AlertDialogDescription>
                    คุณต้องการลบข้อมูลการทำงานล่วงเวลานี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้
                  </AlertDialogDescription>
                </div>
              </div>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-4">
              <AlertDialogCancel disabled={actionLoading}>ยกเลิก</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDelete}
                disabled={actionLoading}
                className="bg-red-600 text-white hover:bg-red-700 inline-flex items-center"
              >
                {actionLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-opacity-20 border-t-white rounded-full"></div>
                    <span>กำลังดำเนินการ</span>
                  </div>
                ) : (
                  <>
                    <FiTrash2 className="mr-1.5 h-4 w-4" />
                    <span>ลบข้อมูล</span>
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Approve Cancel Confirmation Modal */}
      {showApproveCancelConfirmModal && (
        <AlertDialog open={showApproveCancelConfirmModal} onOpenChange={setShowApproveCancelConfirmModal}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-start">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <FiCheckCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <AlertDialogTitle>อนุมัติการยกเลิกการทำงานล่วงเวลา</AlertDialogTitle>
                  <AlertDialogDescription>
                    คุณต้องการอนุมัติการยกเลิกการทำงานล่วงเวลานี้ใช่หรือไม่?
                  </AlertDialogDescription>
                </div>
              </div>
            </AlertDialogHeader>
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                ความคิดเห็น (ไม่บังคับ)
              </label>
              <textarea
                rows="3"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="ระบุความคิดเห็นเพิ่มเติม"
                value={approveComment}
                onChange={(e) => setApproveComment(e.target.value)}
              ></textarea>
            </div>
            <AlertDialogFooter className="mt-4">
              <AlertDialogCancel disabled={actionLoading}>ยกเลิก</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmApproveCancel}
                disabled={actionLoading}
                className="bg-blue-600 text-white hover:bg-blue-700 inline-flex items-center"
              >
                {actionLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-opacity-20 border-t-white rounded-full"></div>
                    <span>กำลังดำเนินการ</span>
                  </div>
                ) : (
                  <>
                    <FiCheckCircle className="mr-1.5 h-4 w-4" />
                    <span>อนุมัติการยกเลิก</span>
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Sheet สำหรับแก้ไขข้อมูลการทำงานล่วงเวลา */}
      <Sheet open={showEditSheet} onOpenChange={setShowEditSheet}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>แก้ไขการทำงานล่วงเวลา</SheetTitle>
            <SheetDescription>
              แก้ไขข้อมูลการทำงานล่วงเวลา กรุณากรอกข้อมูลให้ครบถ้วน
            </SheetDescription>
          </SheetHeader>
          
          {error && <div className="bg-red-50 dark:bg-red-900/30 p-3 rounded-md mt-4 text-red-800 dark:text-red-200 text-sm">
            <div className="flex items-start">
              <FiXCircle className="mt-0.5 mr-2 h-4 w-4 text-red-500" />
              <span>{error}</span>
              <button 
                className="ml-auto text-red-700 dark:text-red-400 hover:text-red-900 dark:hover:text-red-200"
                onClick={() => setError('')}
              >
                <FiXCircle className="h-4 w-4" />
              </button>
            </div>
          </div>}
          
          <form onSubmit={handleEditSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  วันที่ทำงานล่วงเวลา <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <FiCalendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    value={editFormData.date}
                    onChange={handleEditInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    เวลาเริ่มต้น <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <FiClock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="time"
                      id="startTime"
                      name="startTime"
                      className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      value={editFormData.startTime}
                      onChange={handleEditInputChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    เวลาสิ้นสุด <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <FiClock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="time"
                      id="endTime"
                      name="endTime"
                      className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      value={editFormData.endTime}
                      onChange={handleEditInputChange}
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  จำนวนชั่วโมงทำงานล่วงเวลา
                </label>
                <div className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-md">
                  <span className="font-medium">
                    {editTotalHours === 1 ? '1' : editTotalHours}
                  </span> 
                  {editTotalHours === 1 ? 'ชั่วโมง' : 'ชั่วโมง'}
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  เหตุผลในการทำงานล่วงเวลา <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-0 pl-3 pointer-events-none">
                    <FiFileText className="h-5 w-5 text-gray-400" />
                  </div>
                  <textarea
                    id="reason"
                    name="reason"
                    rows="3"
                    className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    placeholder="ระบุเหตุผลในการทำงานล่วงเวลา"
                    value={editFormData.reason}
                    onChange={handleEditInputChange}
                    required
                  ></textarea>
                </div>
              </div>
            </div>
            
            <SheetFooter className="sm:justify-between">
              <SheetClose asChild>
                <button
                  type="button"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                  disabled={editSubmitting}
                >
                  ยกเลิก
                </button>
              </SheetClose>
              <button
                type="submit"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                disabled={editSubmitting}
              >
                {editSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-opacity-20 border-t-white rounded-full"></div>
                    <span>กำลังบันทึก...</span>
                  </div>
                ) : (
                  <>
                    <FiSave className="mr-2 h-4 w-4" />
                    <span>บันทึก</span>
                  </>
                )}
              </button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
      
      {/* Create Sheet */}
      <Sheet open={showCreateSheet} onOpenChange={setShowCreateSheet}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>ขอทำงานล่วงเวลา</SheetTitle>
            <SheetDescription>
              กรอกข้อมูลการทำงานล่วงเวลาเพื่อขออนุมัติ
            </SheetDescription>
          </SheetHeader>
          
          <form onSubmit={handleCreateSubmit} className="space-y-6 py-6">
            <div className="space-y-4">
              {/* ไม่แสดงส่วนของการเลือกพนักงาน เนื่องจากกำหนดให้เป็นตัวเองเสมอ */}
              
              <div className="space-y-2">
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  วันที่ทำงานล่วงเวลา <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <FiCalendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    value={createFormData.date}
                    onChange={handleCreateInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    เวลาเริ่มต้น <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <FiClock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="time"
                      id="startTime"
                      name="startTime"
                      className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      value={createFormData.startTime}
                      onChange={handleCreateInputChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    เวลาสิ้นสุด <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <FiClock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="time"
                      id="endTime"
                      name="endTime"
                      className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      value={createFormData.endTime}
                      onChange={handleCreateInputChange}
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  จำนวนชั่วโมงทำงานล่วงเวลา
                </label>
                <div className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-md">
                  <span className="font-medium">
                    {createTotalHours === 1 ? '1' : createTotalHours}
                  </span> 
                  {createTotalHours === 1 ? 'ชั่วโมง' : 'ชั่วโมง'}
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="create-reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  เหตุผลในการทำงานล่วงเวลา <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-0 pl-3 pointer-events-none">
                    <FiFileText className="h-5 w-5 text-gray-400" />
                  </div>
                  <textarea
                    id="create-reason"
                    name="reason"
                    rows="3"
                    className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    placeholder="ระบุเหตุผลในการทำงานล่วงเวลา"
                    value={createFormData.reason}
                    onChange={handleCreateInputChange}
                    required
                  ></textarea>
                </div>
              </div>
            </div>
            
            <SheetFooter className="sm:justify-between">
              <SheetClose asChild>
                <button
                  type="button"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                  disabled={createSubmitting}
                >
                  ยกเลิก
                </button>
              </SheetClose>
              <button
                type="submit"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                disabled={createSubmitting}
              >
                {createSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-opacity-20 border-t-white rounded-full"></div>
                    <span>กำลังบันทึก...</span>
                  </div>
                ) : (
                  <>
                    <FiSave className="mr-2 h-4 w-4" />
                    <span>บันทึก</span>
                  </>
                )}
              </button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
} 