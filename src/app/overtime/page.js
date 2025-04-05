'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

// เปลี่ยนจาก Heroicons เป็น react-icons
import { FiCheckCircle, FiXCircle, FiTrash2, FiPlus, FiFilter, FiClock, FiUser, FiCalendar,
         FiFileText, FiDownload, FiInfo, FiMessageCircle, FiEdit, FiEye, FiChevronUp, FiChevronDown, FiXSquare, FiAlertTriangle, FiPlusCircle } from 'react-icons/fi';
import { LoadingPage, LoadingButton, LoadingSpinner } from '../../components/ui/LoadingSpinner';
import ErrorMessage from '../../components/ui/ErrorMessage';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
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
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

// เพิ่มฟังก์ชันตรวจสอบว่าเป็นรูปภาพจาก mock-images หรือไม่
const isMockImage = (src) => {
  return src && typeof src === 'string' && (src.startsWith('/mock-images/') || src.startsWith('./mock-images/'));
};

export default function OvertimePage() {
  const router = useRouter();
  const { toast } = useToast();
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
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRejectCancelModal, setShowRejectCancelModal] = useState(false);
  const [showApproveCancelModal, setShowApproveCancelModal] = useState(false);
  const [selectedOvertimeId, setSelectedOvertimeId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [approveComment, setApproveComment] = useState('');
  const [cancelApprovalComment, setCancelApprovalComment] = useState('');
  const [cancelRejectionReason, setCancelRejectionReason] = useState('');
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
  
  // เพิ่ม state สำหรับการแบ่งหน้าและการจัดเรียง
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // เพิ่ม state สำหรับ overtime detail sheet
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
  const [selectedOvertimeDetail, setSelectedOvertimeDetail] = useState(null);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [selectedDeleteOvertimeId, setSelectedDeleteOvertimeId] = useState(null);

  // เพิ่ม state สำหรับ Add Overtime sheet
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [addFormData, setAddFormData] = useState({
    overtimeDate: new Date(),
    startTime: '',
    endTime: '',
    reason: '',
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  // เพิ่ม state สำหรับหน้า Edit Overtime
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    overtimeId: '',
    overtimeDate: new Date(),
    startTime: '',
    endTime: '',
    reason: '',
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // เพิ่มฟังก์ชันสำหรับจัดรูปแบบวันที่และเวลา
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

  // ฟังก์ชันดึงข้อมูลการทำงานล่วงเวลา - ย้ายออกจาก useEffect
  const fetchOvertimes = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/overtime');
      const data = await res.json();
      
      if (data.success) {
        // ตรวจสอบสถานะการขอยกเลิกของแต่ละรายการ
        const overtimesWithStatus = data.data.map(overtime => {
          // ตรวจสอบว่ามีคำขอยกเลิกที่ยังรออนุมัติหรือไม่
          const hasPendingCancelRequest = overtime.approvals?.some(a => 
            a.type === 'request_cancel' && 
            a.status === 'completed' && 
            !overtime.approvals.some(b => 
              (b.type === 'approve_cancel' || b.type === 'reject_cancel') && 
              b.status === 'completed' && 
              b.createdAt > a.createdAt
            )
          );
          
          // เพิ่ม flag เพื่อใช้ในการแสดงผล
          return {
            ...overtime,
            isDuringCancel: hasPendingCancelRequest
          };
        });
        
        setOvertimes(overtimesWithStatus);
        
        // คำนวณจำนวนข้อมูลแต่ละสถานะ
        const counts = {
          all: overtimesWithStatus.length,
          pending: overtimesWithStatus.filter(overtime => overtime.status === 'waiting_for_approve').length,
          approved: overtimesWithStatus.filter(overtime => 
            overtime.status === 'approved' && 
            !overtime.isDuringCancel
          ).length,
          rejected: overtimesWithStatus.filter(overtime => overtime.status === 'rejected').length,
          cancelled: overtimesWithStatus.filter(overtime => 
            overtime.status === 'canceled' || 
            overtime.isCancelled === true ||
            overtime.approvals?.some(a => a.type === 'approve_cancel' && a.status === 'completed')
          ).length,
          pendingCancel: overtimesWithStatus.filter(overtime => overtime.isDuringCancel).length
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
    try {
      setActionLoading(true);
      const res = await fetch(`/api/overtime/${id}`, {
        method: 'DELETE',
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast({
          title: "ลบข้อมูลสำเร็จ",
          description: "ลบข้อมูลการทำงานล่วงเวลาเรียบร้อยแล้ว",
          variant: "success",
        });
        // รีเฟรชข้อมูลการทำงานล่วงเวลา
        fetchOvertimes();
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: data.message || "เกิดข้อผิดพลาดในการลบข้อมูลการทำงานล่วงเวลา",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์",
        variant: "destructive",
      });
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
        toast({
          title: "อนุมัติสำเร็จ",
          description: "อนุมัติการทำงานล่วงเวลาเรียบร้อยแล้ว",
          variant: "success",
        });
        // รีเฟรชข้อมูลการทำงานล่วงเวลา
        fetchOvertimes();
        setShowApproveModal(false);
        setApproveComment('');
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: result.message || "เกิดข้อผิดพลาดในการอนุมัติการทำงานล่วงเวลา",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "เกิดข้อผิดพลาดในการอนุมัติการทำงานล่วงเวลา",
        variant: "destructive",
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
  
  // ฟังก์ชันสำหรับเปิด Modal ไม่อนุมัติการยกเลิก
  const openRejectCancelModal = (id) => {
    setSelectedOvertimeId(id);
    setShowRejectCancelModal(true);
    setCancelRejectionReason('');
  };
  
  // ฟังก์ชันสำหรับเปิด Modal อนุมัติการยกเลิก
  const handleShowApproveCancelModal = (id) => {
    setSelectedOvertimeId(id);
    setShowApproveCancelModal(true);
    setCancelApprovalComment('');
  };

  /**
   * แปลงสถานะเป็นข้อความภาษาไทยสำหรับแสดงผล
   */
  const getStatusText = (status) => {
    switch (status) {
      case 'waiting_for_approve': return 'รออนุมัติ';
      case 'approved': return 'อนุมัติแล้ว';
      case 'rejected': return 'ไม่อนุมัติ';
      case 'canceled': return 'ยกเลิก';
      default: return 'ไม่มีข้อมูล';
    }
  };

  /**
   * แปลงสถานะการยกเลิกเป็นข้อความภาษาไทยสำหรับแสดงผล
   */
  const getCancelStatusText = (status) => {
    switch (status) {
      case 'waiting_for_approve': return 'รออนุมัติการยกเลิก';
      case 'approved': return 'อนุมัติการยกเลิก';
      case 'rejected': return 'ไม่อนุมัติการยกเลิก';
      default: return 'ไม่มีข้อมูล';
    }
  };

  /**
   * คืนสีของ badge ตามสถานะ
   */
  const getStatusBadgeClass = (status) => {
    if (status === 'waiting_for_approve' || status === 'รออนุมัติ') return 'badge-warning';
    if (status === 'approved' || status === 'อนุมัติ') return 'badge-success';
    if (status === 'rejected' || status === 'ไม่อนุมัติ') return 'badge-error';
    if (status === 'canceled' || status === 'ยกเลิกแล้ว') return 'badge-info';
    return 'badge-neutral'; // คืนค่าเริ่มต้นถ้าไม่ตรงกับเงื่อนไข
  };

  /**
   * คืนสีของ badge ตามสถานะการยกเลิก
   */
  const getCancelStatusBadgeClass = (status) => {
    if (status === 'waiting_for_approve') return 'badge-warning';
    if (status === 'approved') return 'badge-info';
    if (status === 'rejected') return 'badge-error';
    return 'badge-neutral';
  };

  // กรองข้อมูลตามเงื่อนไข
  // ฟังก์ชันสำหรับแปลงรูปแบบวันที่
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const filteredOvertimes = useMemo(() => {
    let result = [...overtimes];
    
    // กรองตามสถานะ
    if (filter === 'pending') {
      result = result.filter(overtime => overtime.status === 'waiting_for_approve');
    } else if (filter === 'approved') {
      result = result.filter(overtime => 
        overtime.status === 'approved' && 
        !overtime.isDuringCancel
      );
    } else if (filter === 'rejected') {
      result = result.filter(overtime => overtime.status === 'rejected');
    } else if (filter === 'cancelled') {
      result = result.filter(overtime => 
        overtime.status === 'canceled' || 
        overtime.isCancelled === true ||
        overtime.approvals?.some(a => a.type === 'approve_cancel' && a.status === 'completed')
      );
    } else if (filter === 'pendingCancel') {
      result = result.filter(overtime => overtime.isDuringCancel);
    }
    
    // ค้นหาตามข้อความ (เฉพาะชื่อพนักงาน)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(overtime => 
        overtime.employee?.firstName?.toLowerCase().includes(query) ||
        overtime.employee?.lastName?.toLowerCase().includes(query)
      );
    }
    
    // เรียงลำดับข้อมูล
    result.sort((a, b) => {
      let valueA = a[sortField];
      let valueB = b[sortField];
      
      // แปลงเป็นวันที่ถ้าเป็น field ที่เกี่ยวกับวันที่
      if (['createdAt', 'overtimeDate', 'startTime', 'endTime'].includes(sortField)) {
        valueA = new Date(valueA);
        valueB = new Date(valueB);
      }
      
      if (valueA === valueB) return 0;
      
      const result = valueA > valueB ? 1 : -1;
      return sortDirection === 'asc' ? result : -result;
    });
    
    return result;
  }, [overtimes, filter, searchQuery, sortField, sortDirection]);
  
  // คำนวณจำนวนหน้าทั้งหมด
  const totalPages = Math.ceil(filteredOvertimes.length / pageSize);
  
  // แบ่งข้อมูลตามหน้า
  const paginatedOvertimes = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredOvertimes.slice(startIndex, startIndex + pageSize);
  }, [filteredOvertimes, currentPage, pageSize]);


  // เพิ่มฟังก์ชันสำหรับจัดรูปแบบเวลา
  const formatTime = (timeString) => {
    if (!timeString) return '';
    
    // กรณีเป็น ISO string ที่มีเวลาด้วย
    if (timeString.includes('T')) {
      const date = new Date(timeString);
      return date.toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    // กรณีเป็นเวลาในรูปแบบ HH:MM
    return timeString;
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
        !overtime.isDuringCancel) {
      return true;
    }
    
    // แอดมินก็ลบได้เฉพาะเมื่อสถานะเป็น 'รออนุมัติ' เท่านั้น
    if (session.user.role === 'admin' && 
        overtime.status === 'waiting_for_approve' && 
        !overtime.isDuringCancel) {
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

  // ตรวจสอบว่าสามารถอนุมัติหรือปฏิเสธการยกเลิกได้หรือไม่
  const canManageCancelRequest = (overtime) => {
    if (!session || !overtime) return false;
    
    // ตรวจสอบว่ามีบทบาทที่เหมาะสม
    const isAdmin = session.user.role === 'admin';
    const isSupervisor = session.user.role === 'supervisor';
    
    // ถ้าไม่ใช่แอดมินหรือหัวหน้างาน ไม่สามารถจัดการคำขอยกเลิกได้
    if (!isAdmin && !isSupervisor) return false;
    
    // ตรวจสอบว่ามี approvals ข้อมูลและมีรูปแบบถูกต้อง
    if (!overtime.approvals || !Array.isArray(overtime.approvals)) return false;
    
    // เรียงลำดับตาม createdAt จากใหม่ไปเก่า
    const sortedApprovals = [...overtime.approvals].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    // หาการกระทำล่าสุดที่เกี่ยวข้องกับการขอยกเลิก
    const latestCancelAction = sortedApprovals.find(a => 
      ['request_cancel', 'approve_cancel', 'reject_cancel'].includes(a.type) && 
      a.status === 'completed'
    );
    
    // ถ้ามีคำขอยกเลิกล่าสุดที่รอพิจารณา
    if (latestCancelAction && latestCancelAction.type === 'request_cancel') {
      // หัวหน้างานต้องอยู่แผนกเดียวกับพนักงาน
      if (isSupervisor) {
        return !overtime.employee?.departmentId || !session.user.departmentId || 
               overtime.employee?.departmentId === session?.user?.departmentId;
      }
      return true; // แอดมินสามารถจัดการได้เสมอ
    }
    
    return false; // ไม่มีคำขอยกเลิกล่าสุดที่รอพิจารณา
  };

  // ฟังก์ชันสำหรับการขอยกเลิกการทำงานล่วงเวลา
  const handleCancelRequest = async () => {
    if (!cancelReason.trim()) {
      toast({
        title: "กรุณาระบุเหตุผล",
        description: "กรุณาระบุเหตุผลในการขอยกเลิกการทำงานล่วงเวลา",
        variant: "destructive",
      });
      return;
    }
    
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
        toast({
          title: "ส่งคำขอยกเลิกสำเร็จ",
          description: "ส่งคำขอยกเลิกการทำงานล่วงเวลาเรียบร้อยแล้ว",
          variant: "success",
        });
        // รีเฟรชข้อมูลการทำงานล่วงเวลา
        fetchOvertimes();
        // ปิด modal
        setShowCancelModal(false);
        setSelectedOvertimeId(null);
        setCancelReason('');
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: data.message || "เกิดข้อผิดพลาดในการส่งคำขอยกเลิกการทำงานล่วงเวลา",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  // ฟังก์ชันสำหรับการอนุมัติการยกเลิกเมื่อกดปุ่มยืนยันใน dialog
  const handleApproveCancel = async () => {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/overtime/${selectedOvertimeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'approve_cancel',
          comment: cancelApprovalComment || null
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast({
          title: "อนุมัติการยกเลิกสำเร็จ",
          description: "อนุมัติการยกเลิกการทำงานล่วงเวลาเรียบร้อยแล้ว",
          variant: "success",
        });
        // รีเฟรชข้อมูลการทำงานล่วงเวลา
        fetchOvertimes();
        // ปิด modal
        setShowApproveCancelModal(false);
        setSelectedOvertimeId(null);
        setCancelApprovalComment('');
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: data.message || "เกิดข้อผิดพลาดในการอนุมัติการยกเลิกการทำงานล่วงเวลา",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  // ฟังก์ชันสำหรับการไม่อนุมัติการยกเลิก
  const handleRejectCancel = async () => {
    if (!cancelRejectionReason || !cancelRejectionReason.trim()) {
      toast({
        title: "กรุณาระบุเหตุผล",
        description: "กรุณาระบุเหตุผลในการไม่อนุมัติการยกเลิก",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setActionLoading(true);
      const res = await fetch(`/api/overtime/${selectedOvertimeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'reject_cancel',
          reason: cancelRejectionReason.trim()
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast({
          title: "ไม่อนุมัติการยกเลิกสำเร็จ",
          description: "ไม่อนุมัติการยกเลิกการทำงานล่วงเวลาเรียบร้อยแล้ว",
          variant: "success",
        });
        // รีเฟรชข้อมูลการทำงานล่วงเวลา
        fetchOvertimes();
        // ปิด modal
        setShowRejectCancelModal(false);
        setSelectedOvertimeId(null);
        setCancelRejectionReason('');
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: data.message || "เกิดข้อผิดพลาดในการไม่อนุมัติการยกเลิกการทำงานล่วงเวลา",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // ฟังก์ชันแสดงไอคอนการเรียงลำดับ
  const renderSortIcon = (field) => {
    if (field !== sortField) {
      return null;
    }
    
    return (
      <span className="ml-1">
        {sortDirection === 'asc' ? (
          <FiChevronUp className="h-4 w-4" />
        ) : (
          <FiChevronDown className="h-4 w-4" />
        )}
      </span>
    );
  };

  // ฟังก์ชันเปิด Sheet แสดงรายละเอียด overtime
  const openOvertimeDetailSheet = async (overtime) => {
    setSelectedOvertimeDetail(overtime);
    setIsDetailSheetOpen(true);
  };

  // ฟังก์ชันยืนยันการลบด้วย AlertDialog
  const confirmDelete = (id) => {
    setSelectedDeleteOvertimeId(id);
    setAlertDialogOpen(true);
  };

  // Handler สำหรับการเปลี่ยนแปลงข้อมูลในฟอร์ม
  const handleAddFormChange = (e) => {
    const { name, value } = e.target;
    setAddFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handler สำหรับการจัดรูปแบบและตรวจสอบเวลา
  const handleTimeInputChange = (e) => {
    const { name, value } = e.target;
    
    // ลบทุกอักขระที่ไม่ใช่ตัวเลข
    let digitsOnly = value.replace(/[^\d]/g, '');
    
    // จำกัดความยาวไม่เกิน 4 หลัก
    digitsOnly = digitsOnly.substring(0, 4);
    
    let formattedValue;
    
    // ถ้ามีตัวเลข 3-4 หลัก ให้เพิ่ม ':' ระหว่างชั่วโมงและนาที
    if (digitsOnly.length >= 3) {
      const hours = digitsOnly.substring(0, 2);
      const minutes = digitsOnly.substring(2);
      
      // ตรวจสอบค่าชั่วโมงและนาที
      const hoursNum = parseInt(hours, 10);
      const minsNum = parseInt(minutes, 10);
      
      // ปรับค่าชั่วโมงและนาทีให้อยู่ในช่วงที่ถูกต้อง
      const validHours = Math.min(hoursNum, 23);
      const validMins = Math.min(minsNum, 59);
      
      // แปลงกลับเป็นสตริงพร้อมเติม 0 ข้างหน้าถ้าจำเป็น
      const formattedHours = validHours.toString().padStart(2, '0');
      const formattedMins = validMins.toString().padStart(2, '0');
      
      formattedValue = `${formattedHours}:${formattedMins}`;
    } else if (digitsOnly.length === 2) {
      // ถ้ามี 2 หลัก ให้เพิ่ม ':' และรอการป้อนนาที
      formattedValue = `${digitsOnly}:`;
    } else {
      // น้อยกว่า 2 หลัก แสดงตามที่ป้อน
      formattedValue = digitsOnly;
    }
    
    // อัปเดต state
    setAddFormData(prev => ({
      ...prev,
      [name]: formattedValue
    }));
  };

  // Handler สำหรับการเปลี่ยนแปลงวันที่
  const handleDateChange = (date) => {
    setAddFormData(prev => ({
      ...prev,
      overtimeDate: date
    }));
  };

  // Handler สำหรับการส่งฟอร์ม
  const handleAddFormSubmit = async (e) => {
    e.preventDefault();
    
    if (!addFormData.overtimeDate || !addFormData.startTime || !addFormData.endTime || !addFormData.reason) {
      setAddError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    
    try {
      setAddLoading(true);
      setAddError('');
      
      // แปลงวันที่เป็น ISO string
      const overtimeDate = addFormData.overtimeDate instanceof Date 
        ? addFormData.overtimeDate.toISOString() 
        : new Date(addFormData.overtimeDate).toISOString();
      
      // คำนวณชั่วโมงทำงานล่วงเวลา
      const parseTimeToMinutes = (timeString) => {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
      };
      
      const startMinutes = parseTimeToMinutes(addFormData.startTime);
      const endMinutes = parseTimeToMinutes(addFormData.endTime);
      
      // กรณีข้ามวัน
      let diffMinutes = endMinutes - startMinutes;
      if (diffMinutes < 0) {
        diffMinutes += 24 * 60; // บวกเวลา 1 วัน
      }
      
      // คำนวณชั่วโมงเป็นทศนิยม (เช่น 1.5 ชั่วโมง)
      const totalHours = parseFloat((diffMinutes / 60).toFixed(2));
      
      // ตรวจสอบให้แน่ใจว่ามี employeeId (ใช้ ID ของผู้ใช้ปัจจุบัน)
      const employeeId = session?.user?.id;
      
      if (!employeeId) {
        setAddError('ไม่พบข้อมูลพนักงาน กรุณาเข้าสู่ระบบใหม่อีกครั้ง');
        return;
      }
      
      const res = await fetch('/api/overtime', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: overtimeDate,
          startTime: addFormData.startTime,
          endTime: addFormData.endTime,
          reason: addFormData.reason,
          totalHours: totalHours,
          employeeId: employeeId
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast({
          title: "สำเร็จ",
          description: "บันทึกข้อมูลการทำงานล่วงเวลาเรียบร้อยแล้ว",
        });
        
        // รีเซ็ตฟอร์มและปิด Sheet
        setAddFormData({
          overtimeDate: new Date(),
          startTime: '',
          endTime: '',
          reason: '',
        });
        setIsAddSheetOpen(false);
        
        // ดึงข้อมูลใหม่
        fetchOvertimes();
      } else {
        setAddError(data.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    } catch (error) {
      setAddError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
      console.error(error);
    } finally {
      setAddLoading(false);
    }
  };

  // เพิ่มฟังก์ชันคำนวณจำนวนชั่วโมง
  const calculateHours = (startTime, endTime) => {
    if (!startTime || !endTime) return '';

    const parseTimeToMinutes = (timeString) => {
      // กรณีเป็น ISO string
      if (timeString.includes('T')) {
        const date = new Date(timeString);
        return date.getHours() * 60 + date.getMinutes();
      }
      
      // กรณีเป็นรูปแบบ HH:MM
      const [hours, minutes] = timeString.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const startMinutes = parseTimeToMinutes(startTime);
    const endMinutes = parseTimeToMinutes(endTime);
    
    // กรณีข้ามวัน
    let diffMinutes = endMinutes - startMinutes;
    if (diffMinutes < 0) {
      diffMinutes += 24 * 60; // บวกเวลา 1 วัน
    }
    
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    
    return `${hours} ชั่วโมง ${minutes} นาที`;
  };

  // เพิ่มฟังก์ชันสำหรับการเปิด Sheet แก้ไข
  const openEditSheet = (overtime) => {
    setEditFormData({
      overtimeId: overtime.id,
      overtimeDate: new Date(overtime.date),
      startTime: overtime.startTime,
      endTime: overtime.endTime,
      reason: overtime.reason || '',
    });
    setEditError('');
    setIsEditSheetOpen(true);
  };

  // เพิ่มฟังก์ชันสำหรับการแก้ไขและอัปเดตข้อมูล
  const handleEditFormSubmit = async (e) => {
    e.preventDefault();
    
    if (!editFormData.overtimeDate || !editFormData.startTime || !editFormData.endTime || !editFormData.reason) {
      setEditError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    
    try {
      setEditLoading(true);
      setEditError('');
      
      // แปลงวันที่เป็น ISO string
      const overtimeDate = editFormData.overtimeDate instanceof Date 
        ? editFormData.overtimeDate.toISOString() 
        : new Date(editFormData.overtimeDate).toISOString();
      
      // คำนวณชั่วโมงทำงานล่วงเวลา
      const parseTimeToMinutes = (timeString) => {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
      };
      
      const startMinutes = parseTimeToMinutes(editFormData.startTime);
      const endMinutes = parseTimeToMinutes(editFormData.endTime);
      
      // กรณีข้ามวัน
      let diffMinutes = endMinutes - startMinutes;
      if (diffMinutes < 0) {
        diffMinutes += 24 * 60; // บวกเวลา 1 วัน
      }
      
      // คำนวณชั่วโมงเป็นทศนิยม (เช่น 1.5 ชั่วโมง)
      const totalHours = parseFloat((diffMinutes / 60).toFixed(2));
      
      // ตรวจสอบให้แน่ใจว่ามี employeeId
      const employeeId = session?.user?.id;
      
      if (!employeeId) {
        setEditError('ไม่พบข้อมูลพนักงาน กรุณาเข้าสู่ระบบใหม่อีกครั้ง');
        return;
      }
      
      const res = await fetch(`/api/overtime/${editFormData.overtimeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: overtimeDate,
          startTime: editFormData.startTime,
          endTime: editFormData.endTime,
          reason: editFormData.reason,
          totalHours: totalHours,
          employeeId: employeeId
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast({
          title: "สำเร็จ",
          description: "แก้ไขข้อมูลการทำงานล่วงเวลาเรียบร้อยแล้ว",
        });
        
        // ปิด Sheet
        setIsEditSheetOpen(false);
        
        // ดึงข้อมูลใหม่
        fetchOvertimes();
      } else {
        setEditError(data.message || 'เกิดข้อผิดพลาดในการแก้ไขข้อมูล');
      }
    } catch (error) {
      setEditError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
      console.error(error);
    } finally {
      setEditLoading(false);
    }
  };

  // ฟังก์ชันสำหรับจัดการการเปลี่ยนแปลงข้อมูลในฟอร์มแก้ไข
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // ฟังก์ชันสำหรับการเปลี่ยนแปลงวันที่ในฟอร์มแก้ไข
  const handleEditDateChange = (date) => {
    setEditFormData(prev => ({
      ...prev,
      overtimeDate: date
    }));
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
    <div className="py-4 space-y-4">
      <Toaster />
      <h1 className="text-2xl font-bold flex items-center">
        <FiClock className="mr-2" /> รายการทำงานล่วงเวลา
      </h1>
      
      <div className="flex items-center justify-end">
        <Button 
          variant="default" 
          className="gap-1.5"
          onClick={() => setIsAddSheetOpen(true)}
        >
          <FiPlusCircle className="h-4 w-4" />
          ขอทำงานล่วงเวลา
        </Button>
      </div>
      
      {/* ตัวกรองข้อมูล */}
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
              onClick={() => setFilter('pending')}
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 px-3 py-1.5 ${
                filter === 'pending'
                  ? 'bg-yellow-500 text-white shadow hover:bg-yellow-600'
                  : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              รออนุมัติ ({statusCounts.pending})
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
              onClick={() => setFilter('cancelled')}
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 px-3 py-1.5 ${
                filter === 'cancelled'
                  ? 'bg-purple-600 text-white shadow hover:bg-purple-700'
                  : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              ยกเลิกแล้ว ({statusCounts.cancelled})
            </button>
            <button
              onClick={() => setFilter('pendingCancel')}
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 px-3 py-1.5 ${
                filter === 'pendingCancel'
                  ? 'bg-orange-600 text-white shadow hover:bg-orange-700'
                  : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              รอยกเลิก ({statusCounts.pendingCancel})
            </button>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            {/* ช่องค้นหา */}
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
                ค้นหาจากชื่อพนักงาน
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
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1); // รีเซ็ตกลับไปหน้าแรกเมื่อเปลี่ยนคำค้นหา
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* แสดงรายการการทำงานล่วงเวลาแบบตาราง */}
      {filteredOvertimes.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-gray-200 shadow-md dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white text-left text-sm text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th 
                    className="px-6 py-3 cursor-pointer select-none" 
                    onClick={() => handleSort('overtimeType')}
                  >
                    <div className="flex items-center">
                      ประเภท OT
                      {renderSortIcon('overtimeType')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 cursor-pointer select-none" 
                    onClick={() => handleSort('employeeId')}
                  >
                    <div className="flex items-center">
                      พนักงาน
                      {renderSortIcon('employeeId')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 cursor-pointer select-none" 
                    onClick={() => handleSort('overtimeDate')}
                  >
                    <div className="flex items-center">
                      วันที่ OT
                      {renderSortIcon('overtimeDate')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 cursor-pointer select-none" 
                    onClick={() => handleSort('startTime')}
                  >
                    <div className="flex items-center">
                      เวลาเริ่ม
                      {renderSortIcon('startTime')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 cursor-pointer select-none" 
                    onClick={() => handleSort('endTime')}
                  >
                    <div className="flex items-center">
                      เวลาสิ้นสุด
                      {renderSortIcon('endTime')}
                    </div>
                  </th>
                  <th className="px-6 py-3">
                    <div className="flex items-center">
                      จำนวนชั่วโมง
                    </div>
                  </th>
                  <th className="px-6 py-3">
                    <div className="flex items-center">
                      สถานะ
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 cursor-pointer select-none" 
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center">
                      วันที่สร้าง
                      {renderSortIcon('createdAt')}
                    </div>
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
                        <FiClock className="h-4 w-4 text-primary mr-2" />
                        <span>ทำงานล่วงเวลา</span>
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
                        {formatDate(overtime.date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-200">
                        {formatTime(overtime.startTime)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-200">
                        {formatTime(overtime.endTime)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-200">
                        {calculateHours(overtime.startTime, overtime.endTime)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        {overtime.isCancelled ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
                            ยกเลิก
                          </span>
                        ) : overtime.isDuringCancel ? (
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400`}>
                              ขอยกเลิก
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">(รออนุมัติการยกเลิก)</span>
                          </div>
                        ) : (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            overtime.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 
                            overtime.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 
                            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}>
                            {getStatusText(overtime.status)}
                          </span>
                        )}
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
                          className="p-1 rounded-md text-primary hover:text-primary/80 dark:text-primary-foreground dark:hover:text-primary-foreground/80 hover:bg-primary/10 dark:hover:bg-primary/20 focus:outline-none"
                          onClick={() => openOvertimeDetailSheet(overtime)}
                          title="ดูรายละเอียด"
                        >
                          <FiEye className="h-4 w-4" />
                        </button>
                        
                        {/* ปุ่มแก้ไข */}
                        {canEdit(overtime) && (
                          <button 
                            className="p-1 rounded-md text-amber-600 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 focus:outline-none"
                            onClick={() => openEditSheet(overtime)}
                            title="แก้ไข"
                          >
                            <FiEdit className="h-4 w-4" />
                          </button>
                        )}
                        
                        {/* ปุ่มอนุมัติ */}
                        {canApprove(overtime) && (
                          <button 
                            className="p-1 rounded-md text-green-600 hover:text-green-700 dark:text-green-500 dark:hover:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 focus:outline-none"
                            onClick={() => handleShowApproveModal(overtime.id)}
                            title="อนุมัติ"
                          >
                            <FiCheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        
                        {/* ปุ่มไม่อนุมัติ */}
                        {canApprove(overtime) && (
                          <button 
                            className="p-1 rounded-md text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 focus:outline-none"
                            onClick={() => handleShowRejectModal(overtime.id)}
                            title="ไม่อนุมัติ"
                          >
                            <FiXCircle className="h-4 w-4" />
                          </button>
                        )}
                        
                        {/* ปุ่มขอยกเลิกการทำงานล่วงเวลา */}
                        {canCancelRequest(overtime) && (
                          <button 
                            className="p-1 rounded-md text-orange-600 hover:text-orange-700 dark:text-orange-500 dark:hover:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30 focus:outline-none"
                            onClick={() => handleShowCancelModal(overtime.id)}
                            title="ขอยกเลิก"
                          >
                            <FiXSquare className="h-4 w-4" />
                          </button>
                        )}
                        
                        {/* ปุ่มอนุมัติการยกเลิก */}
                        {canManageCancelRequest(overtime) && (
                          <button 
                            className="p-1 rounded-md text-green-600 hover:text-green-700 dark:text-green-500 dark:hover:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 focus:outline-none"
                            onClick={() => handleShowApproveCancelModal(overtime.id)}
                            title="อนุมัติการยกเลิก"
                          >
                            <FiCheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        
                        {/* ปุ่มไม่อนุมัติการยกเลิก */}
                        {canManageCancelRequest(overtime) && (
                          <button 
                            className="p-1 rounded-md text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 focus:outline-none"
                            onClick={() => openRejectCancelModal(overtime.id)}
                            title="ปฏิเสธการยกเลิก"
                          >
                            <FiXCircle className="h-4 w-4" />
                          </button>
                        )}
                        
                        {/* ปุ่มลบ */}
                        {canDelete(overtime) && (
                          <button 
                            className="p-1 rounded-md text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 focus:outline-none"
                            onClick={() => confirmDelete(overtime.id)}
                            title="ลบ"
                          >
                            <FiTrash2 className="h-4 w-4" />
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
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <FiClock className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
          <p className="text-lg text-gray-600 dark:text-gray-300">ไม่พบข้อมูลการทำงานล่วงเวลา</p>
        </div>
      )}

      {/* Pagination */}
      {filteredOvertimes.length > 0 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            แสดง {((currentPage - 1) * pageSize) + 1} ถึง {Math.min(currentPage * pageSize, filteredOvertimes.length)} จากทั้งหมด {filteredOvertimes.length} รายการ
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0"
              aria-label="Go to first page"
              title="หน้าแรก"
            >
              <span className="sr-only">หน้าแรก</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="m11 17-5-5 5-5"></path>
                <path d="m18 17-5-5 5-5"></path>
              </svg>
            </button>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0"
              aria-label="Go to previous page"
              title="หน้าก่อนหน้า"
            >
              <span className="sr-only">หน้าก่อนหน้า</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="m15 18-6-6 6-6"></path>
              </svg>
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // สร้างปุ่มหน้าแบบมีขีดจำกัด 5 หน้า
                let pageNum;
                
                if (totalPages <= 5) {
                  // กรณีมีหน้าไม่เกิน 5 หน้า แสดงทุกหน้า
                  pageNum = i + 1;
                } else {
                  // กรณีมีหน้ามากกว่า 5 หน้า
                  if (currentPage <= 3) {
                    // ถ้าอยู่ในหน้าต้นๆ แสดงหน้า 1-5
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    // ถ้าอยู่ในหน้าท้ายๆ แสดง 5 หน้าสุดท้าย
                    pageNum = totalPages - 4 + i;
                  } else {
                    // อยู่หน้ากลางๆ แสดงหน้าปัจจุบันและหน้าข้างเคียง
                    pageNum = currentPage - 2 + i;
                  }
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    aria-label={`Page ${pageNum}`}
                    aria-current={currentPage === pageNum ? "page" : undefined}
                    className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-8 w-8 ${
                      currentPage === pageNum
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <>
                  <span className="text-gray-500 dark:text-gray-400">...</span>
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    aria-label={`Page ${totalPages}`}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 w-8"
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0"
              aria-label="Go to next page"
              title="หน้าถัดไป"
            >
              <span className="sr-only">หน้าถัดไป</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="m9 18 6-6-6-6"></path>
              </svg>
            </button>
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0"
              aria-label="Go to last page"
              title="หน้าสุดท้าย"
            >
              <span className="sr-only">หน้าสุดท้าย</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="m13 17 5-5-5-5"></path>
                <path d="m6 17 5-5-5-5"></path>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* AlertDialog แสดงรายละเอียด Overtime แทน Sheet */}
      <AlertDialog open={isDetailSheetOpen} onOpenChange={setIsDetailSheetOpen}>
        <AlertDialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold flex items-center">
              <FiClock className="mr-2 text-primary" />
              รายละเอียดการทำงานล่วงเวลา
            </AlertDialogTitle>
          </AlertDialogHeader>
          
          {selectedOvertimeDetail && (
            <div className="mt-4 space-y-6">
              {/* ข้อมูลพนักงาน */}
              <div className="space-y-4">
                <h3 className="font-semibold border-b pb-2">ข้อมูลพนักงาน</h3>
                <div className="flex items-center gap-3">
                  {selectedOvertimeDetail.employee?.image ? (
                    <div className="h-12 w-12 rounded-full overflow-hidden">
                      <Image
                        src={selectedOvertimeDetail.employee.image}
                        alt={selectedOvertimeDetail.employee?.firstName || ''}
                        width={48}
                        height={48}
                        className="rounded-full object-cover"
                        unoptimized={isMockImage(selectedOvertimeDetail.employee.image)}
                      />
                    </div>
                  ) : (
                    <div className="flex h-12 w-12 rounded-full bg-primary text-primary-foreground items-center justify-center">
                      <span className="text-lg font-medium">
                        {selectedOvertimeDetail.employee?.firstName?.[0] || ''}{selectedOvertimeDetail.employee?.lastName?.[0] || ''}
                      </span>
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-lg">
                      {selectedOvertimeDetail.employee?.firstName || ''} {selectedOvertimeDetail.employee?.lastName || ''}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedOvertimeDetail.employee?.position || ''} • {selectedOvertimeDetail.employee?.department?.name || ''}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* ข้อมูลการทำงานล่วงเวลา */}
              <div className="space-y-4">
                <h3 className="font-semibold border-b pb-2">ข้อมูลการทำงานล่วงเวลา</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-2">
                    <FiCalendar className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">วันที่ทำงานล่วงเวลา</div>
                      <div>{formatDate(selectedOvertimeDetail.date)}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <FiClock className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">เวลาทำงาน</div>
                      <div>
                        {formatTime(selectedOvertimeDetail.startTime)} - {formatTime(selectedOvertimeDetail.endTime)}
                        {selectedOvertimeDetail.totalHours && ` (${selectedOvertimeDetail.totalHours} ชั่วโมง)`}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2 md:col-span-2">
                    <FiMessageCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">เหตุผลในการทำงานล่วงเวลา</div>
                      <div className="whitespace-pre-wrap">{selectedOvertimeDetail.reason || '-'}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <FiInfo className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">สถานะ</div>
                      <div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          selectedOvertimeDetail.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 
                          selectedOvertimeDetail.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                          {getStatusText(selectedOvertimeDetail.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <FiCalendar className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">วันที่สร้าง</div>
                      <div>{formatDateTime(selectedOvertimeDetail.createdAt)}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* ข้อมูลการอนุมัติ (ถ้ามี) */}
              {selectedOvertimeDetail.status !== 'waiting_for_approve' && selectedOvertimeDetail.approvedBy && (
                <div className="space-y-4">
                  <h3 className="font-semibold border-b pb-2">ข้อมูลการอนุมัติ</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-2">
                      <FiUser className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium text-sm">ผู้อนุมัติ</div>
                        <div>
                          {selectedOvertimeDetail.approvedBy.firstName || ''} {selectedOvertimeDetail.approvedBy.lastName || ''}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <FiCalendar className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium text-sm">วันที่อนุมัติ</div>
                        <div>{formatDateTime(selectedOvertimeDetail.approvedAt)}</div>
                      </div>
                    </div>
                    
                    {selectedOvertimeDetail.comment && (
                      <div className="flex items-start gap-2 md:col-span-2">
                        <FiMessageCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-medium text-sm">ความเห็น</div>
                          <div className="whitespace-pre-wrap">{selectedOvertimeDetail.comment}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* ข้อมูลการขอยกเลิก (ถ้ามี) */}
              {selectedOvertimeDetail.cancelRequestInfo && (
                <div className="space-y-4">
                  <h3 className="font-semibold border-b pb-2">ข้อมูลการขอยกเลิก</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-2">
                      <FiUser className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium text-sm">ผู้ขอยกเลิก</div>
                        <div>{selectedOvertimeDetail.cancelRequestInfo.requesterName || 'ไม่ระบุ'}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <FiCalendar className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium text-sm">วันที่ขอยกเลิก</div>
                        <div>{formatDateTime(selectedOvertimeDetail.cancelRequestInfo.requestDate) || 'ไม่ระบุ'}</div>
                      </div>
                    </div>
                    
                    {selectedOvertimeDetail.cancelRequestInfo.reason && (
                      <div className="flex items-start gap-2 md:col-span-2">
                        <FiMessageCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-medium text-sm">เหตุผลในการขอยกเลิก</div>
                          <div className="whitespace-pre-wrap">{selectedOvertimeDetail.cancelRequestInfo.reason}</div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-start gap-2">
                      <FiInfo className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium text-sm">สถานะการยกเลิก</div>
                        <div>
                          {selectedOvertimeDetail.isDuringCancel ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              รออนุมัติการยกเลิก
                            </span>
                          ) : selectedOvertimeDetail.approvals?.some(a => a.type === 'approve_cancel' && a.status === 'completed') ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              อนุมัติการยกเลิก
                            </span>
                          ) : selectedOvertimeDetail.approvals?.some(a => a.type === 'reject_cancel' && a.status === 'completed') ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              ไม่อนุมัติการยกเลิก
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              ไม่มีข้อมูล
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <AlertDialogFooter className="flex justify-end gap-2 pt-4 border-t mt-6">
            <AlertDialogCancel>ปิด</AlertDialogCancel>
            
            {selectedOvertimeDetail && canEdit(selectedOvertimeDetail) && (
              <Button 
                onClick={() => {
                  setIsDetailSheetOpen(false);
                  router.push(`/overtime/${selectedOvertimeDetail.id}/edit`);
                }}
                variant="outline"
                className="gap-1"
              >
                <FiEdit className="h-4 w-4" /> แก้ไข
              </Button>
            )}
            
            {selectedOvertimeDetail && canApprove(selectedOvertimeDetail) && (
              <Button 
                onClick={() => {
                  setIsDetailSheetOpen(false);
                  handleShowApproveModal(selectedOvertimeDetail.id);
                }}
                className="bg-green-600 hover:bg-green-700 text-white gap-1"
              >
                <FiCheckCircle className="h-4 w-4" /> อนุมัติ
              </Button>
            )}
            
            {selectedOvertimeDetail && canApprove(selectedOvertimeDetail) && (
              <Button 
                onClick={() => {
                  setIsDetailSheetOpen(false);
                  handleShowRejectModal(selectedOvertimeDetail.id);
                }}
                variant="destructive"
                className="gap-1"
              >
                <FiXCircle className="h-4 w-4" /> ไม่อนุมัติ
              </Button>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog สำหรับยืนยันการลบ */}
      <AlertDialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-start">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <FiTrash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="ml-4">
                <AlertDialogTitle>ยืนยันการลบข้อมูล</AlertDialogTitle>
                <AlertDialogDescription>
                  คุณต้องการลบรายการทำงานล่วงเวลานี้ใช่หรือไม่? การดำเนินการนี้ไม่สามารถยกเลิกได้
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                handleDelete(selectedDeleteOvertimeId);
                setAlertDialogOpen(false);
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  <span>กำลังดำเนินการ</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <FiTrash2 className="mr-1.5 h-4 w-4" />
                  <span>ลบข้อมูล</span>
                </div>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* AlertDialog สำหรับอนุมัติการทำงานล่วงเวลา */}
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
                  กรุณาระบุความคิดเห็นหรือบันทึกเพิ่มเติม (ไม่บังคับ)
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <div className="mt-3">
            <label htmlFor="approve-comment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              ความคิดเห็น (ไม่บังคับ)
            </label>
            <textarea
              id="approve-comment"
              name="approve-comment"
              rows="3"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={approveComment}
              onChange={(e) => setApproveComment(e.target.value)}
              placeholder="ระบุความคิดเห็นหรือรายละเอียดเพิ่มเติม"
            ></textarea>
          </div>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel
              disabled={isSubmitting}
            >
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleApprove(selectedOvertimeId, approveComment)}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  <span>กำลังดำเนินการ</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <FiCheckCircle className="mr-1.5 h-4 w-4" />
                  <span>อนุมัติ</span>
                </div>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* AlertDialog สำหรับไม่อนุมัติการทำงานล่วงเวลา */}
      <AlertDialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-start">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <FiAlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="ml-4">
                <AlertDialogTitle>ไม่อนุมัติการทำงานล่วงเวลา</AlertDialogTitle>
                <AlertDialogDescription>
                  กรุณาระบุเหตุผลที่ไม่อนุมัติ เพื่อแจ้งให้พนักงานทราบ
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <div className="mt-3">
            <label htmlFor="reject-reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              เหตุผลที่ไม่อนุมัติ
            </label>
            <textarea
              id="reject-reason"
              name="reject-reason"
              rows="3"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="ระบุเหตุผลที่ไม่อนุมัติ"
            ></textarea>
          </div>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel
              disabled={isSubmitting}
            >
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-10 px-4 py-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  <span>กำลังดำเนินการ</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <FiXCircle className="mr-1.5 h-4 w-4" />
                  <span>ไม่อนุมัติ</span>
                </div>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* AlertDialog สำหรับขอยกเลิกการทำงานล่วงเวลา */}
      <AlertDialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-start">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                <FiXSquare className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-4">
                <AlertDialogTitle>ขอยกเลิกการทำงานล่วงเวลา</AlertDialogTitle>
                <AlertDialogDescription>
                  กรุณาระบุเหตุผลในการขอยกเลิกการทำงานล่วงเวลา
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <div className="mt-3">
            <label htmlFor="cancel-reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              เหตุผลในการขอยกเลิก
            </label>
            <textarea
              id="cancel-reason"
              name="cancel-reason"
              rows="3"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="ระบุเหตุผลที่ต้องการยกเลิกการทำงานล่วงเวลา"
            ></textarea>
          </div>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel disabled={isSubmitting}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelRequest}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-orange-600 text-white hover:bg-orange-700 h-10 px-4 py-2"
              disabled={isSubmitting || !cancelReason.trim()}
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  <span>กำลังดำเนินการ</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <FiXSquare className="mr-1.5 h-4 w-4" />
                  <span>ขอยกเลิก</span>
                </div>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* AlertDialog สำหรับอนุมัติการยกเลิกการทำงานล่วงเวลา */}
      <AlertDialog open={showApproveCancelModal} onOpenChange={setShowApproveCancelModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-start">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <FiCheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <AlertDialogTitle>ยืนยันการอนุมัติยกเลิกการทำงานล่วงเวลา</AlertDialogTitle>
                <AlertDialogDescription>
                  คุณต้องการอนุมัติการขอยกเลิกการทำงานล่วงเวลานี้ใช่หรือไม่?
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <div className="mt-3">
            <label htmlFor="approve-cancel-comment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              ความคิดเห็น (ไม่บังคับ)
            </label>
            <textarea
              id="approve-cancel-comment"
              name="approve-cancel-comment"
              rows="3"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={cancelApprovalComment}
              onChange={(e) => setCancelApprovalComment(e.target.value)}
              placeholder="ระบุความคิดเห็นเพิ่มเติม (ถ้ามี)"
            ></textarea>
          </div>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel disabled={isSubmitting}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApproveCancel}
              className="bg-primary hover:bg-primary/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  <span>กำลังดำเนินการ</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <FiCheckCircle className="mr-1.5 h-4 w-4" />
                  <span>อนุมัติการยกเลิก</span>
                </div>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog สำหรับไม่อนุมัติการยกเลิกการทำงานล่วงเวลา */}
      <AlertDialog open={showRejectCancelModal} onOpenChange={setShowRejectCancelModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-start">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <FiAlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="ml-4">
                <AlertDialogTitle>ยืนยันการไม่อนุมัติยกเลิกการทำงานล่วงเวลา</AlertDialogTitle>
                <AlertDialogDescription>
                  กรุณาระบุเหตุผลที่ไม่อนุมัติการขอยกเลิก
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <div className="mt-3">
            <label htmlFor="reject-cancel-reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              เหตุผลในการไม่อนุมัติ
            </label>
            <textarea
              id="reject-cancel-reason"
              name="reject-cancel-reason"
              rows="3"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={cancelRejectionReason}
              onChange={(e) => setCancelRejectionReason(e.target.value)}
              placeholder="ระบุเหตุผลในการไม่อนุมัติ"
            ></textarea>
          </div>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel disabled={isSubmitting}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRejectCancel}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  <span>กำลังดำเนินการ</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <FiXCircle className="mr-1.5 h-4 w-4" />
                  <span>ไม่อนุมัติการยกเลิก</span>
                </div>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Sheet สำหรับเพิ่มข้อมูลการทำงานล่วงเวลา */}
      <Sheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-xl font-semibold flex items-center">
              <FiPlus className="mr-2 text-primary" />
              ขอทำงานล่วงเวลา
            </SheetTitle>
            <SheetDescription>
              กรอกข้อมูลการทำงานล่วงเวลาที่ต้องการ
            </SheetDescription>
          </SheetHeader>
          
          <form onSubmit={handleAddFormSubmit} className="mt-6 space-y-6">
            {addError && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 p-3 rounded-md text-sm">
                {addError}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="overtimeDate">วันที่ทำงานล่วงเวลา <span className="text-red-500">*</span></Label>
              <Input
                type="date"
                id="overtimeDate"
                name="overtimeDate"
                value={addFormData.overtimeDate instanceof Date ? addFormData.overtimeDate.toISOString().substring(0, 10) : addFormData.overtimeDate}
                onChange={(e) => {
                  const date = new Date(e.target.value);
                  handleDateChange(date);
                }}
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">เวลาเริ่มต้น <span className="text-red-500">*</span></Label>
                <Input
                  type="time"
                  id="startTime"
                  name="startTime"
                  value={addFormData.startTime}
                  onChange={handleAddFormChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endTime">เวลาสิ้นสุด <span className="text-red-500">*</span></Label>
                <Input
                  type="time"
                  id="endTime"
                  name="endTime"
                  value={addFormData.endTime}
                  onChange={handleAddFormChange}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reason">เหตุผลในการทำงานล่วงเวลา <span className="text-red-500">*</span></Label>
              <textarea
                id="reason"
                name="reason"
                rows="4"
                className="w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                placeholder="ระบุเหตุผลในการทำงานล่วงเวลา"
                value={addFormData.reason}
                onChange={handleAddFormChange}
                required
              ></textarea>
            </div>
            
            <SheetFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsAddSheetOpen(false)}
                disabled={addLoading}
              >
                ยกเลิก
              </Button>
              <Button 
                type="submit"
                disabled={addLoading}
              >
                {addLoading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* เพิ่ม Sheet สำหรับแก้ไขข้อมูลการทำงานล่วงเวลา */}
      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-xl font-semibold flex items-center">
              <FiEdit className="mr-2 text-amber-600" />
              แก้ไขข้อมูลการทำงานล่วงเวลา
            </SheetTitle>
            <SheetDescription>
              แก้ไขข้อมูลการทำงานล่วงเวลาตามที่ต้องการ
            </SheetDescription>
          </SheetHeader>
          
          <form onSubmit={handleEditFormSubmit} className="mt-6 space-y-6">
            {editError && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 p-3 rounded-md text-sm">
                {editError}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="overtimeDate">วันที่ทำงานล่วงเวลา <span className="text-red-500">*</span></Label>
              <Input
                type="date"
                id="overtimeDate"
                name="overtimeDate"
                value={editFormData.overtimeDate instanceof Date ? editFormData.overtimeDate.toISOString().substring(0, 10) : editFormData.overtimeDate}
                onChange={(e) => {
                  const date = new Date(e.target.value);
                  handleEditDateChange(date);
                }}
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">เวลาเริ่มต้น <span className="text-red-500">*</span></Label>
                <Input
                  type="time"
                  id="startTime"
                  name="startTime"
                  value={editFormData.startTime}
                  onChange={handleEditFormChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endTime">เวลาสิ้นสุด <span className="text-red-500">*</span></Label>
                <Input
                  type="time"
                  id="endTime"
                  name="endTime"
                  value={editFormData.endTime}
                  onChange={handleEditFormChange}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reason">เหตุผลในการทำงานล่วงเวลา <span className="text-red-500">*</span></Label>
              <textarea
                id="reason"
                name="reason"
                rows="4"
                className="w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                placeholder="ระบุเหตุผลในการทำงานล่วงเวลา"
                value={editFormData.reason}
                onChange={handleEditFormChange}
                required
              ></textarea>
            </div>
            
            <SheetFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditSheetOpen(false)}
                type="button"
                disabled={editLoading}
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={editLoading}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                {editLoading ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
} 