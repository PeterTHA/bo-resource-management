'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';

// เปลี่ยนจาก Heroicons เป็น react-icons
import { FiCheckCircle, FiXCircle, FiTrash2, FiPlus, FiFilter, FiCalendar, FiUser, FiClock, 
         FiFileText, FiDownload, FiInfo, FiAlertTriangle, FiMessageCircle, FiEdit, FiEye, FiChevronUp, FiChevronDown, FiXSquare, FiX, FiCheck, FiPaperclip, FiImage, FiArchive, FiUploadCloud, FiUpload, FiFile, FiSave, FiSlash, FiAlertCircle } from 'react-icons/fi';
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
import { Calendar } from "@/components/ui/calendar";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

// เพิ่มฟังก์ชันตรวจสอบว่าเป็นรูปภาพจาก mock-images หรือไม่
const isMockImage = (src) => {
  return src && typeof src === 'string' && (src.startsWith('/mock-images/') || src.startsWith('./mock-images/'));
};

export default function LeavesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0,
    pendingCancel: 0
  });
  
  // Modal states
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showApproveCancelModal, setShowApproveCancelModal] = useState(false);
  const [showRejectCancelModal, setShowRejectCancelModal] = useState(false);
  const [selectedLeaveId, setSelectedLeaveId] = useState(null);
  const [selectedDeleteLeaveId, setSelectedDeleteLeaveId] = useState(null);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  
  // Form data states
  const [approveReason, setApproveReason] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [cancelApprovalComment, setCancelApprovalComment] = useState('');
  const [cancelModalTitle, setCancelModalTitle] = useState('ขอยกเลิกการลา');
  const [cancelModalDescription, setCancelModalDescription] = useState('กรุณาระบุเหตุผลในการขอยกเลิกการลา');
  
  // Edit Leave sheet states
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [editingLeave, setEditingLeave] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [filesToUpload, setFilesToUpload] = useState([]);
  const [editFormData, setEditFormData] = useState({
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: '',
    leaveFormat: 'เต็มวัน',
    attachments: []
  });
  
  // Add Leave sheet states
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [addFormData, setAddFormData] = useState({
    leaveType: 'ลาป่วย',
    startDate: '',
    endDate: '',
    leaveFormat: 'เต็มวัน',
    reason: '',
  });
  const [addFilesToUpload, setAddFilesToUpload] = useState([]);
  const [addTotalDays, setAddTotalDays] = useState(0);
  const [addLoading, setAddLoading] = useState(false);
  const [addUploading, setAddUploading] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  
  // ดึงข้อมูล session
  const { data: session } = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/auth/login');
    }
  });

  // เพิ่ม state สำหรับ popup รายละเอียดการลา
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
  const [selectedLeaveDetail, setSelectedLeaveDetail] = useState(null);

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
    const fetchLeaves = async () => {
      try {
        const res = await fetch('/api/leaves');
        const data = await res.json();
        
        if (data.success) {
          // ใช้ข้อมูลที่ได้จาก API โดยตรง ไม่ต้องแปลงข้อมูลอีก
          // เพราะข้อมูลถูกแปลงเป็น camelCase มาแล้วจาก API
          const leavesWithStatus = data.data;
          
          setLeaves(leavesWithStatus);
          
          // คำนวณจำนวนข้อมูลแต่ละสถานะ
          const counts = {
            all: leavesWithStatus.length,
            pending: leavesWithStatus.filter(leave => 
              leave.status === 'waiting_for_approve'
            ).length,
            approved: leavesWithStatus.filter(leave => 
              leave.status === 'approved' && 
              !leave.isDuringCancel
            ).length,
            rejected: leavesWithStatus.filter(leave => leave.status === 'rejected').length,
            cancelled: leavesWithStatus.filter(leave => 
              leave.status === 'canceled' ||
              leave.approvals?.some(a => a.type === 'approve_cancel' && a.status === 'completed')
            ).length,
            pendingCancel: leavesWithStatus.filter(leave => leave.isDuringCancel).length
          };
          setStatusCounts(counts);
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
    
    if (session) {
      fetchLeaves();
    }
  }, [session]);

  const handleDelete = async (id) => {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/leaves/${id}`, {
        method: 'DELETE',
      });
      
      const data = await res.json();
      
      if (data.success) {
        setLeaves(leaves.filter(leave => leave.id !== id));
        toast({
          title: "ดำเนินการสำเร็จ",
          description: "ลบข้อมูลการลาเรียบร้อยแล้ว",
          duration: 10000,
        });
        
        // อัปเดตสถิติ
        setStatusCounts(prev => {
          const deletedLeave = leaves.find(leave => leave.id === id);
          const status = deletedLeave?.status === 'waiting_for_approve' ? 'pending' : 
                         deletedLeave?.status === 'approved' ? 'approved' : 
                         deletedLeave?.status === 'rejected' ? 'rejected' : 'cancelled';
          
          return {
            ...prev,
            all: prev.all - 1,
            [status]: prev[status] - 1
          };
        });
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: data.message || 'เกิดข้อผิดพลาดในการลบข้อมูลการลา',
          variant: "destructive",
          duration: 10000,
        });
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์',
        variant: "destructive",
        duration: 10000,
      });
      console.error(error);
    } finally {
      setActionLoading(false);
      setSelectedDeleteLeaveId(null);
    }
  };

  // ฟังก์ชันที่เรียกก่อนลบข้อมูล
  const confirmDelete = (id) => {
    setSelectedDeleteLeaveId(id);
    setAlertDialogOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedLeaveId) return;
    
    try {
      setActionLoading(true);
      const res = await fetch(`/api/leaves/${selectedLeaveId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: 'approved',
          approvedById: session.user.id,
          comment: approveReason || null
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        // อัปเดตข้อมูลในรายการ
        setLeaves(leaves.map(leave => 
          leave.id === selectedLeaveId ? { 
            ...leave, 
            status: 'approved',
            approvedBy: {
              id: session.user.id,
              firstName: session.user.firstName || session.user.name?.split(' ')[0] || '',
              lastName: session.user.lastName || session.user.name?.split(' ')[1] || '',
            },
            approvedAt: new Date().toISOString(),
            comment: approveReason || null
          } : leave
        ));
        
        toast({
          title: "ดำเนินการสำเร็จ",
          description: "อนุมัติการลาเรียบร้อยแล้ว",
          duration: 10000,
        });
        
        // อัปเดตสถิติ
        setStatusCounts(prev => ({
          ...prev,
          pending: prev.pending - 1,
          approved: prev.approved + 1
        }));
        
        // ปิด modal
        setShowApproveModal(false);
        setSelectedLeaveId(null);
        setApproveReason('');
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: data.message || 'เกิดข้อผิดพลาดในการอัปเดตสถานะการลา',
          variant: "destructive",
          duration: 10000,
        });
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์',
        variant: "destructive",
        duration: 10000,
      });
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const openApproveModal = (id) => {
    setSelectedLeaveId(id);
    setApproveReason('');
    setShowApproveModal(true);
  };

  const openRejectModal = (id) => {
    setSelectedLeaveId(id);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!selectedLeaveId) return;
    
    try {
      setActionLoading(true);
      const res = await fetch(`/api/leaves/${selectedLeaveId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: 'rejected',
          approvedById: session.user.id,
          comment: rejectReason
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        // อัปเดตข้อมูลในรายการ
        setLeaves(leaves.map(leave => 
          leave.id === selectedLeaveId ? { 
            ...leave, 
            status: 'rejected',
            approvedBy: {
              id: session.user.id,
              firstName: session.user.firstName || session.user.name?.split(' ')[0] || '',
              lastName: session.user.lastName || session.user.name?.split(' ')[1] || '',
            },
            approvedAt: new Date().toISOString(),
            comment: rejectReason
          } : leave
        ));
        
        toast({
          title: "ดำเนินการสำเร็จ",
          description: "ปฏิเสธการลาเรียบร้อยแล้ว",
          duration: 10000,
        });
        
        // อัปเดตสถิติ
        setStatusCounts(prev => ({
          ...prev,
          pending: prev.pending - 1,
          rejected: prev.rejected + 1
        }));
        
        // ปิด modal
        setShowRejectModal(false);
        setSelectedLeaveId(null);
        setRejectReason('');
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: data.message || 'เกิดข้อผิดพลาดในการอัปเดตสถานะการลา',
          variant: "destructive",
          duration: 10000,
        });
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์',
        variant: "destructive",
        duration: 10000,
      });
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const openCancelModal = (id) => {
    setSelectedLeaveId(id);
    setCancelReason('');
    
    // ดึงข้อมูลใบลาที่ถูกเลือก
    const selectedLeave = leaves.find(leave => leave.id === id);
    const isRequestingForSelf = session.user.id === selectedLeave?.employeeId;
    
    // กำหนดข้อความให้เหมาะสมกับกรณี
    if (isRequestingForSelf) {
      setCancelModalTitle("ขอยกเลิกการลา");
      setCancelModalDescription("กรุณาระบุเหตุผลในการขอยกเลิกการลาของคุณ");
    } else {
      setCancelModalTitle("ขอยกเลิกการลาแทน");
      setCancelModalDescription(`กรุณาระบุเหตุผลในการขอยกเลิกการลาของ ${selectedLeave?.employee?.firstName || ''} ${selectedLeave?.employee?.lastName || ''}`);
    }
    
    setShowCancelModal(true);
  };

  const openApproveCancelModal = (id) => {
    setSelectedLeaveId(id);
    setCancelApprovalComment('');
    setShowApproveCancelModal(true);
  };

  const openRejectCancelModal = (id) => {
    setSelectedLeaveId(id);
    setCancelApprovalComment('');
    setShowRejectCancelModal(true);
  };

  const handleCancelRequest = async () => {
    if (!selectedLeaveId) return;
    
    try {
      setActionLoading(true);
      
      // ตรวจสอบว่ามี session และ session.user.id
      if (!session || !session?.user?.id) {
        console.error('Invalid session in client component:', JSON.stringify(session, null, 2));
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ข้อมูลผู้ใช้ไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่",
          variant: "destructive",
          duration: 10000,
        });
        setActionLoading(false);
        return;
      }
      
      // แสดงค่าที่จะส่งไป API
      console.log('Sending cancel request with:', {
        selectedLeaveId,
        cancelReason,
        userId: session?.user?.id,
        userRole: session?.user?.role || 'unknown'
      });
      
      const res = await fetch(`/api/leaves/${selectedLeaveId}/cancel-request`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          cancelReason: cancelReason || null
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        // ดึงข้อมูลใบลาที่ถูกเลือก
        const selectedLeave = leaves.find(leave => leave.id === selectedLeaveId);
        const isRequestingForSelf = session.user.id === selectedLeave?.employeeId;
        
        // อัปเดตข้อมูลในรายการ
        const updatedLeaves = leaves.map(leave => 
          leave.id === selectedLeaveId ? { 
            ...leave,
            isDuringCancel: true,
            approvals: [
              {
                type: 'request_cancel',
                status: 'completed',
                reason: cancelReason || null,
                employeeId: session?.user?.id,
                createdAt: new Date().toISOString()
              },
              ...(leave.approvals || [])
            ]
          } : leave
        );
        
        console.log('Updated leave with isDuringCancel:', updatedLeaves.find(l => l.id === selectedLeaveId));
        setLeaves(updatedLeaves);
        
        toast({
          title: "ดำเนินการสำเร็จ",
          description: isRequestingForSelf 
            ? "ส่งคำขอยกเลิกการลาเรียบร้อยแล้ว กรุณารอการอนุมัติ" 
            : `ส่งคำขอยกเลิกการลาของ ${selectedLeave?.employee?.firstName || ''} ${selectedLeave?.employee?.lastName || ''} เรียบร้อยแล้ว กรุณารอการอนุมัติ`,
          duration: 10000,
        });
        
        // อัปเดตสถิติ
        setStatusCounts(prev => ({
          ...prev,
          approved: prev.approved - 1,
          pendingCancel: prev.pendingCancel + 1
        }));
        
        // ปิด modal
        setShowCancelModal(false);
        setSelectedLeaveId(null);
        setCancelReason('');
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: data.message || 'เกิดข้อผิดพลาดในการส่งคำขอยกเลิกการลา',
          variant: "destructive",
          duration: 10000,
        });
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์',
        variant: "destructive",
        duration: 10000,
      });
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveCancel = async () => {
    if (!selectedLeaveId) return;
    
    try {
      setActionLoading(true);
      const res = await fetch(`/api/leaves/${selectedLeaveId}/approve-cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          comment: cancelApprovalComment || null
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        // อัปเดตข้อมูลในรายการ
        setLeaves(leaves.map(leave => 
          leave.id === selectedLeaveId ? { 
            ...leave,
            status: 'ยกเลิก',
            isDuringCancel: false,
            approvals: [
              {
                type: 'approve_cancel',
                status: 'completed',
                comment: cancelApprovalComment || null,
                employeeId: session?.user?.id,
                createdAt: new Date().toISOString()
              },
              ...(leave.approvals || [])
            ]
          } : leave
        ));
        
        toast({
          title: "ดำเนินการสำเร็จ",
          description: "อนุมัติการยกเลิกการลาเรียบร้อยแล้ว",
          duration: 10000,
        });
        
        // อัปเดตสถิติ
        setStatusCounts(prev => ({
          ...prev,
          approved: prev.approved - 1,
          pendingCancel: prev.pendingCancel - 1,
          cancelled: prev.cancelled + 1
        }));
        
        // ปิด modal
        setShowApproveCancelModal(false);
        setSelectedLeaveId(null);
        setCancelApprovalComment('');
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: data.message || 'เกิดข้อผิดพลาดในการอนุมัติการยกเลิกการลา',
          variant: "destructive",
          duration: 10000,
        });
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์',
        variant: "destructive",
        duration: 10000,
      });
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectCancel = async () => {
    if (!selectedLeaveId) return;
    
    try {
      setActionLoading(true);
      const res = await fetch(`/api/leaves/${selectedLeaveId}/reject-cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          comment: cancelApprovalComment || null
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        // อัปเดตข้อมูลในรายการ
        setLeaves(leaves.map(leave => 
          leave.id === selectedLeaveId ? { 
            ...leave,
            isDuringCancel: false,
            status: 'approved', // ยังคงสถานะอนุมัติไว้
            approvals: [
              {
                type: 'reject_cancel',
                status: 'completed',
                comment: cancelApprovalComment || null,
                employeeId: session?.user?.id,
                createdAt: new Date().toISOString()
              },
              ...(leave.approvals || [])
            ]
          } : leave
        ));
        
        toast({
          title: "ดำเนินการสำเร็จ",
          description: "ปฏิเสธการยกเลิกการลาเรียบร้อยแล้ว",
          duration: 10000,
        });
        
        // อัปเดตสถิติ
        setStatusCounts(prev => ({
          ...prev,
          pendingCancel: prev.pendingCancel - 1,
          approved: prev.approved // ยังเป็นอนุมัติเหมือนเดิม
        }));
        
        // ปิด modal
        setShowRejectCancelModal(false);
        setSelectedLeaveId(null);
        setCancelApprovalComment('');
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: data.message || 'เกิดข้อผิดพลาดในการปฏิเสธการยกเลิกการลา',
          variant: "destructive",
          duration: 10000,
        });
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์',
        variant: "destructive",
        duration: 10000,
      });
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredLeaves = useMemo(() => {
    let filtered = leaves;
    
    // กรองตามสถานะ
    if (filter === 'pending') {
      filtered = leaves.filter(leave => leave.status === 'waiting_for_approve');
    } else if (filter === 'approved') {
      filtered = leaves.filter(leave => 
        leave.status === 'approved' && 
        !leave.isDuringCancel
      );
    } else if (filter === 'rejected') {
      filtered = leaves.filter(leave => leave.status === 'rejected');
    } else if (filter === 'cancelled') {
      filtered = leaves.filter(leave => 
        leave.status === 'canceled' ||
        leave.approvals?.some(a => a.type === 'approve_cancel' && a.status === 'completed')
      );
    } else if (filter === 'pendingCancel') {
      filtered = leaves.filter(leave => leave.isDuringCancel);
    }
    
    // ค้นหาตามข้อความ
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(leave => 
        leave.leaveType?.toLowerCase().includes(query) ||
        leave.employee?.firstName?.toLowerCase().includes(query) ||
        leave.employee?.lastName?.toLowerCase().includes(query) ||
        leave.status?.toLowerCase().includes(query) ||
        leave.reason?.toLowerCase().includes(query)
      );
    }
    
    // เรียงลำดับข้อมูล
    filtered.sort((a, b) => {
      let valueA = a[sortField];
      let valueB = b[sortField];
      
      // กรณีข้อมูลพนักงาน
      if (sortField === 'employee') {
        valueA = a.employee?.firstName || '';
        valueB = b.employee?.firstName || '';
      }
      
      // กรณีเปรียบเทียบวันที่
      if (sortField === 'startDate' || sortField === 'endDate' || sortField === 'createdAt') {
        valueA = new Date(valueA || 0).getTime();
        valueB = new Date(valueB || 0).getTime();
      }
      
      // กรณีเปรียบเทียบตัวเลข
      if (sortField === 'totalDays') {
        valueA = Number(valueA || 0);
        valueB = Number(valueB || 0);
      }
      
      if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    return filtered;
  }, [leaves, filter, searchQuery, sortField, sortDirection]);

  // คำนวณข้อมูลสำหรับแสดงผลตาม pagination
  const paginatedLeaves = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredLeaves.slice(startIndex, startIndex + pageSize);
  }, [filteredLeaves, currentPage, pageSize]);

  // คำนวณจำนวนหน้าทั้งหมด
  const totalPages = useMemo(() => {
    return Math.ceil(filteredLeaves.length / pageSize);
  }, [filteredLeaves, pageSize]);

  // ฟังก์ชันเปลี่ยนหน้า
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // ฟังก์ชันจัดการการเรียงลำดับที่ทำงานได้จริง
  const handleSort = (field) => {
    let newDirection = sortDirection;
    
    if (sortField === field) {
      // ถ้าคลิกที่ field เดิม ให้สลับทิศทางการเรียง
      newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      setSortDirection(newDirection);
    } else {
      // ถ้าคลิกที่ field ใหม่ ให้ตั้งค่าเริ่มต้นเป็นการเรียงจากมากไปน้อย
      setSortField(field);
      newDirection = 'desc';
      setSortDirection('desc');
    }
    
    // สร้างคัดลอกข้อมูลเพื่อเรียงใหม่
    const leavesCopy = [...leaves];
    
    // เรียงข้อมูลใหม่ตามฟิลด์และทิศทางที่เลือก
    leavesCopy.sort((a, b) => {
      let valueA = a[field];
      let valueB = b[field];
      
      // กรณีข้อมูลพนักงาน
      if (field === 'employee') {
        valueA = a.employee?.firstName || '';
        valueB = b.employee?.firstName || '';
      }
      
      // กรณีเปรียบเทียบวันที่
      if (field === 'startDate' || field === 'endDate' || field === 'createdAt') {
        valueA = new Date(valueA || 0).getTime();
        valueB = new Date(valueB || 0).getTime();
      }
      
      // กรณีเปรียบเทียบตัวเลข
      if (field === 'totalDays') {
        valueA = Number(valueA || 0);
        valueB = Number(valueB || 0);
      }
      
      if (valueA < valueB) return newDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return newDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    // อัพเดต state เพื่อให้เกิดการ re-render
    setLeaves(leavesCopy);
    
    // รีเซ็ตกลับไปหน้าแรกเมื่อเปลี่ยนการเรียงลำดับ
    setCurrentPage(1);
    
    // แจ้งเตือนการเรียงลำดับข้อมูล (ตัวอย่าง)
    toast({
      title: "เรียงข้อมูลเรียบร้อย",
      description: `เรียงตาม ${field} ${newDirection === 'asc' ? 'จากน้อยไปมาก' : 'จากมากไปน้อย'}`,
      duration: 3000,
    });
  };

  // ไอคอนแสดงทิศทางการเรียงลำดับ
  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return (
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
          className="h-4 w-4 ml-1 opacity-50"
        >
          <path d="M8 9l4-4 4 4" />
          <path d="M16 15l-4 4-4-4" />
        </svg>
      );
    }
    
    return sortDirection === 'asc' ? (
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
        className="h-4 w-4 ml-1 text-primary font-bold"
      >
        <path d="m18 15-6-6-6 6"/>
      </svg>
    ) : (
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
        className="h-4 w-4 ml-1 text-primary font-bold"
      >
        <path d="m6 9 6 6 6-6"/>
      </svg>
    );
  };

  // เปลี่ยนรูปแบบวันที่
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  const formatDateFull = (dateString) => {
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
  
  // ฟังก์ชันสำหรับแสดงช่วงวันที่
  const formatDateRange = (startDate, endDate) => {
    if (!startDate) return '-';
    
    const formattedStart = formatDate(startDate);
    
    if (!endDate || startDate === endDate) {
      return formattedStart;
    }
    
    const formattedEnd = formatDate(endDate);
    return `${formattedStart} - ${formattedEnd}`;
  };

  // เช็คว่าเป็นหัวหน้างานหรือแอดมินหรือไม่
  const isManager = session?.user?.role === 'supervisor' || session?.user?.role === 'admin';
  
  // คำนวณจำนวนวันลาจากวันเริ่มต้นและวันสิ้นสุด
  const calculateDays = (startDate, endDate, leaveFormat) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // ถ้าเป็นการลาครึ่งวัน
    if (leaveFormat && leaveFormat.includes('ครึ่งวัน')) {
      return 0.5;
    }
    
    // คำนวณจำนวนวัน
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // รวมวันเริ่มต้นและวันสิ้นสุด
    
    return diffDays;
  };

  // เพิ่มฟังก์ชันสำหรับนำทางไปหน้ารายละเอียดการลา
  const navigateToLeaveDetail = (leaveId) => {
    openLeaveDetailSheet(leaveId);
  };

  // ตรวจสอบว่าผู้ใช้มีสิทธิ์อนุมัติหรือไม่
  const canApprove = (leave) => {
    // สามารถอนุมัติได้หาก:
    // 1. เป็นแอดมิน/HR หรือหัวหน้าทีม
    // 2. การลาอยู่ในสถานะรออนุมัติ
    // 3. ไม่ใช่การลาของตัวเอง
    const isAdminOrHROrTeamLead = session?.user?.role === 'admin' || session?.user?.role === 'hr' || session?.user?.role === 'team_lead';
    const isPending = leave.status === 'waiting_for_approve';
    const isNotOwnLeave = String(leave.employeeId) !== String(session?.user?.id);
    
    return isAdminOrHROrTeamLead && isPending && isNotOwnLeave && !leave.isDuringCancel;
  };

  // ตรวจสอบว่าสามารถลบได้หรือไม่
  const canDelete = (leave) => {
    // สามารถลบได้หาก:
    // 1. เป็นแอดมิน หรือ HR
    const isAdminOrHR = session?.user?.role === 'admin' || session?.user?.role === 'hr';
    
    return isAdminOrHR;
  };

  // ฟังก์ชันตรวจสอบสิทธิ์การแก้ไขการลา
  const canEdit = (leave) => {
    // ไม่สามารถแก้ไขได้หาก:
    // 1. ไม่ใช่การลาของตัวเอง และไม่ใช่แอดมิน/HR
    // 2. การลาไม่ได้อยู่ในสถานะรออนุมัติหรือถูกปฏิเสธ
    // 3. การลาอยู่ในสถานะรอยกเลิก
    const isOwnLeave = String(leave.employeeId) === String(session?.user?.id);
    const isAdminOrHR = session?.user?.role === 'admin' || session?.user?.role === 'hr';
    const isPendingOrRejected = leave.status === 'waiting_for_approve' || leave.status === 'rejected';
    
    // ตรวจสอบว่ามีการขอยกเลิกหรือไม่
    return (isOwnLeave || isAdminOrHR) && isPendingOrRejected && !leave.isDuringCancel;
  };

  // ตรวจสอบว่าสามารถอนุมัติคำขอยกเลิกการลาได้หรือไม่
  const canApproveCancelRequest = (leave) => {
    // สามารถอนุมัติการยกเลิกได้หาก:
    // 1. เป็นแอดมิน/HR หรือหัวหน้าทีม
    // 2. มีคำขอยกเลิกที่รออนุมัติ
    // 3. ไม่ใช่การลาของตัวเอง
    const isAdminOrHROrTeamLead = session?.user?.role === 'admin' || session?.user?.role === 'hr' || session?.user?.role === 'team_lead';
    const isNotOwnLeave = String(leave.employeeId) !== String(session?.user?.id);
    
    return isAdminOrHROrTeamLead && leave.isDuringCancel && isNotOwnLeave;
  };

  // ตรวจสอบว่าสามารถขอยกเลิกการลาได้หรือไม่
  const canCancelRequest = (leave) => {
    // สามารถขอยกเลิกได้หาก:
    // 1. เป็นการลาของตัวเอง หรือเป็นแอดมิน/HR
    // 2. การลาอยู่ในสถานะอนุมัติแล้ว
    // 3. ยังไม่มีคำขอยกเลิกที่รออนุมัติ
    const isOwnLeaveOrAdminOrHR = String(leave.employeeId) === String(session?.user?.id) || 
                                 session?.user?.role === 'admin' || 
                                 session?.user?.role === 'hr';
    const isApproved = leave.status === 'approved';
    
    // ตรวจสอบว่ามีการขอยกเลิกหรือไม่
    return isOwnLeaveOrAdminOrHR && isApproved && !leave.isDuringCancel;
  };

  // ฟังก์ชันเปิด Sheet แก้ไขข้อมูล
  const openEditSheet = (leave) => {
    setEditingLeave(leave);
    
    // แปลงวันที่จาก string เป็น Date object สำหรับ Calendar
    const parsedStartDate = leave.startDate ? new Date(leave.startDate) : null;
    const parsedEndDate = leave.endDate ? new Date(leave.endDate) : null;
    
    setStartDate(parsedStartDate);
    setEndDate(parsedEndDate);
    
    setEditFormData({
      leaveType: leave.leaveType || '',
      startDate: leave.startDate ? new Date(leave.startDate).toISOString().split('T')[0] : '',
      endDate: leave.endDate ? new Date(leave.endDate).toISOString().split('T')[0] : '',
      reason: leave.reason || '',
      leaveFormat: leave.leaveFormat || 'เต็มวัน',
      totalDays: leave.totalDays || 0,
      attachments: leave.attachments || [],
    });
    
    setFilesToUpload([]);
    setIsEditSheetOpen(true);
  };

  // ฟังก์ชันจัดการไฟล์ที่อัปโหลด
  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setFilesToUpload(prev => [...prev, ...newFiles]);
  };

  // ฟังก์ชันจัดการการลากไฟล์มาวาง
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      setFilesToUpload(prev => [...prev, ...Array.from(files)]);
    }
  };

  // ฟังก์ชันลบไฟล์ที่เลือก
  const removeFile = (index) => {
    setFilesToUpload(prev => prev.filter((_, i) => i !== index));
  };

  // ฟังก์ชันลบไฟล์เดิมที่มีอยู่
  const removeAttachment = (index) => {
    setEditFormData(prev => {
      const newAttachments = [...prev.attachments];
      newAttachments.splice(index, 1);
      return {
        ...prev,
        attachments: newAttachments
      };
    });
  };

  // ฟังก์ชันอัปโหลดไฟล์
  const uploadFiles = async () => {
    if (filesToUpload.length === 0) return [];
    
    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('type', 'leave');
      
      // เพิ่มไฟล์ทั้งหมดที่ต้องการอัปโหลด
      filesToUpload.forEach(file => {
        formData.append('files', file);
      });
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'อัปโหลดไฟล์ไม่สำเร็จ');
      }
      
      return result.files.map(file => file.url);
    } catch (error) {
      console.error('Error uploading files:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  // อัปเดตฟังก์ชันคำนวณวันลาเมื่อเลือกวันที่ด้วย Calendar
  const calculateTotalDays = () => {
    if (startDate && endDate && editFormData.leaveFormat) {
      if (editFormData.leaveFormat.includes('ครึ่งวัน')) {
        return 0.5;
      } else {
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays;
      }
    }
    return 0;
  };

  // อัปเดตเมื่อมีการเลือกวันที่ด้วย Calendar
  useEffect(() => {
    if (startDate && endDate) {
      const totalDays = calculateTotalDays();
      setEditFormData(prev => ({
        ...prev,
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        totalDays
      }));
    }
  }, [startDate, endDate, editFormData.leaveFormat]);

  // ฟังก์ชันอัปเดตข้อมูลการลา
  const handleUpdateLeave = async (e) => {
    e.preventDefault();
    
    if (!editingLeave) return;
    
    try {
      setActionLoading(true);
      
      // คำนวณจำนวนวันลาอัตโนมัติ
      const startDate = new Date(editFormData.startDate);
      const endDate = new Date(editFormData.endDate);
      let totalDays = editFormData.totalDays;
      
      // คำนวณจำนวนวันลาอัตโนมัติ (ถ้าเป็นการลาเต็มวัน)
      if (editFormData.leaveFormat === 'เต็มวัน') {
        const diffTime = Math.abs(endDate - startDate);
        totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      } else if (editFormData.leaveFormat.includes('ครึ่งวัน')) {
        totalDays = 0.5;
      }
      
      // อัปโหลดไฟล์ (ถ้ามี)
      let uploadedFileUrls = [];
      if (filesToUpload.length > 0) {
        try {
          uploadedFileUrls = await uploadFiles();
        } catch (error) {
          toast({
            title: "เกิดข้อผิดพลาด",
            description: `การอัปโหลดไฟล์ไม่สำเร็จ: ${error.message}`,
            variant: "destructive",
            duration: 10000,
          });
          setActionLoading(false);
          return;
        }
      }
      
      // รวมรายการไฟล์ทั้งหมด (ไฟล์เดิมและไฟล์ใหม่)
      const allAttachments = [
        ...editFormData.attachments,
        ...uploadedFileUrls
      ];
      
      const res = await fetch(`/api/leaves/${editingLeave.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leaveType: editFormData.leaveType,
          startDate: editFormData.startDate,
          endDate: editFormData.endDate,
          reason: editFormData.reason,
          leaveFormat: editFormData.leaveFormat,
          totalDays: totalDays,
          attachments: allAttachments
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        // อัปเดตข้อมูลในรายการ
        setLeaves(leaves.map(leave => 
          leave.id === editingLeave.id ? { 
            ...leave, 
            leaveType: editFormData.leaveType,
            startDate: editFormData.startDate,
            endDate: editFormData.endDate,
            reason: editFormData.reason,
            leaveFormat: editFormData.leaveFormat,
            totalDays: totalDays,
            attachments: allAttachments
          } : leave
        ));
        
        toast({
          title: "ดำเนินการสำเร็จ",
          description: "อัปเดตข้อมูลการลาเรียบร้อยแล้ว",
          duration: 10000,
        });
        
        // ปิด Sheet
        setIsEditSheetOpen(false);
        setEditingLeave(null);
        setFilesToUpload([]);
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: data.message || 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลการลา',
          variant: "destructive",
          duration: 10000,
        });
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์',
        variant: "destructive",
        duration: 10000,
      });
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  // ฟังก์ชันจัดการการเปลี่ยนแปลงข้อมูลในฟอร์ม
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  // คำนวณจำนวนวันลาทั้งหมดสำหรับฟอร์มเพิ่มการลา
  const calculateAddTotalDays = useCallback(() => {
    if (!addFormData.startDate || !addFormData.endDate) return 0;

    const start = new Date(addFormData.startDate);
    const end = new Date(addFormData.endDate);
    
    // ถ้าวันที่สิ้นสุดน้อยกว่าวันที่เริ่ม ไม่คำนวณ
    if (end < start) return 0;
    
    // คำนวณจำนวนวัน
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // รวมวันเริ่มต้นและวันสิ้นสุด
    
    // ถ้าเป็นการลาครึ่งวัน
    if (addFormData.leaveFormat.includes('ครึ่งวัน')) {
      // กรณีลาครึ่งวันแต่กรอกหลายวัน ให้แสดงเฉพาะ 0.5 วัน
      return start.getTime() === end.getTime() ? 0.5 : diffDays;
    }
    
    return diffDays;
  }, [addFormData.startDate, addFormData.endDate, addFormData.leaveFormat]);

  useEffect(() => {
    setAddTotalDays(calculateAddTotalDays());
  }, [addFormData.startDate, addFormData.endDate, addFormData.leaveFormat, calculateAddTotalDays]);

  // จัดการการเปลี่ยนแปลงฟอร์มเพิ่มการลา
  const handleAddFormChange = (e) => {
    const { name, value } = e.target;
    setAddFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // ถ้าเปลี่ยนเป็นการลาครึ่งวัน ให้กำหนดวันสิ้นสุดเป็นวันเดียวกับวันเริ่มต้น
    if (name === 'leaveFormat' && value.includes('ครึ่งวัน') && addFormData.startDate) {
      setAddFormData((prev) => ({
        ...prev,
        endDate: prev.startDate,
      }));
    }
    
    // เมื่อเลือกวันที่เริ่มต้น ให้กำหนดวันที่สิ้นสุดเป็นวันเดียวกัน
    if (name === 'startDate' && value) {
      setAddFormData((prev) => ({
        ...prev,
        endDate: value,
      }));
    }
  };

  // จัดการการเพิ่มไฟล์
  const handleAddFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setAddFilesToUpload(prev => [...prev, ...newFiles]);
  };

  // ลบไฟล์จากรายการที่จะอัปโหลด
  const removeAddFile = (index) => {
    setAddFilesToUpload(prev => prev.filter((_, i) => i !== index));
  };

  // อัปโหลดไฟล์สำหรับการเพิ่มการลา
  const uploadAddFiles = async () => {
    if (addFilesToUpload.length === 0) return [];
    
    try {
      setAddUploading(true);
      
      const formData = new FormData();
      formData.append('type', 'leave');
      
      // เพิ่มไฟล์ทั้งหมดที่ต้องการอัปโหลด
      addFilesToUpload.forEach(file => {
        formData.append('files', file);
      });
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'อัปโหลดไฟล์ไม่สำเร็จ');
      }
      
      return result.files.map(file => file.url);
    } catch (error) {
      console.error('Error uploading files:', error);
      throw error;
    } finally {
      setAddUploading(false);
    }
  };

  // บันทึกข้อมูลการลาใหม่
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setAddLoading(true);
      setAddError('');
      setAddSuccess('');
      
      // ตรวจสอบข้อมูลที่จำเป็น
      if (!addFormData.leaveType || !addFormData.startDate || !addFormData.endDate || !addFormData.reason) {
        setAddError('กรุณากรอกข้อมูลให้ครบถ้วน');
        return;
      }
      
      // คำนวณจำนวนวันลา
      calculateAddTotalDays();
      
      // อัปโหลดไฟล์ (ถ้ามี)
      let attachments = [];
      if (addFilesToUpload.length > 0) {
        try {
          attachments = await uploadAddFiles();
        } catch (error) {
          setAddError(`การอัปโหลดไฟล์ไม่สำเร็จ: ${error.message}`);
          return;
        }
      }
      
      // ส่งข้อมูลไปบันทึก
      const response = await fetch('/api/leaves', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leaveType: addFormData.leaveType,
          startDate: addFormData.startDate,
          endDate: addFormData.endDate,
          reason: addFormData.reason,
          leaveFormat: addFormData.leaveFormat,
          totalDays: addTotalDays,
          attachments: attachments,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAddSuccess('บันทึกข้อมูลการลาเรียบร้อยแล้ว');
        
        // เพิ่มข้อมูลการลาใหม่ลงในรายการ
        setLeaves(prevLeaves => [data.data, ...prevLeaves]);
        
        // ปิด Sheet และรีเซ็ตฟอร์ม
        setTimeout(() => {
          setIsAddSheetOpen(false);
          setAddFormData({
            leaveType: 'ลาป่วย',
            startDate: '',
            endDate: '',
            leaveFormat: 'เต็มวัน',
            reason: '',
          });
          setAddFilesToUpload([]);
          setAddSuccess('');
        }, 1500);
        
        toast({
          title: "ดำเนินการสำเร็จ",
          description: "บันทึกข้อมูลการลาเรียบร้อยแล้ว",
          duration: 5000,
        });
      } else {
        setAddError(data.message || 'เกิดข้อผิดพลาดในการเพิ่มข้อมูลการลา');
      }
    } catch (error) {
      setAddError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
      console.error(error);
    } finally {
      setAddLoading(false);
    }
  };

  // เปิด Sheet เพิ่มการลา
  const openAddSheet = () => {
    setAddFormData({
      leaveType: 'ลาป่วย',
      startDate: '',
      endDate: '',
      leaveFormat: 'เต็มวัน',
      reason: '',
    });
    setAddFilesToUpload([]);
    setAddError('');
    setAddSuccess('');
    setIsAddSheetOpen(true);
  };

  // ฟังก์ชันเปิด Sheet แสดงรายละเอียดการลา
  const openLeaveDetailSheet = async (leaveId) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/leaves/${leaveId}`);
      const data = await res.json();
      
      if (data.success) {
        setSelectedLeaveDetail(data.data);
        setIsDetailSheetOpen(true);
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: data.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลการลา',
          variant: "destructive",
          duration: 10000,
        });
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์',
        variant: "destructive", 
        duration: 10000,
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันบังคับปิด Popover
  const forceClosePopover = () => {
    // สร้าง event เพื่อจำลองการคลิกนอก popover
    const event = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
      view: window
    });
    
    // กระจาย event ไปที่ document เพื่อบังคับให้ popover ปิด
    document.dispatchEvent(event);
  };

  // เพิ่มฟังก์ชันแปลงสถานะเป็นภาษาไทย
  const translateStatus = (status) => {
    if (!status) return '';
    
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

  // ฟังก์ชัน openDetailSheet ต้องทำความสะอาดข้อมูลก่อนแสดง
  const openDetailSheet = (leave) => {
    // ทำสำเนาข้อมูลเพื่อไม่กระทบข้อมูลต้นฉบับ
    const leaveDetail = { ...leave };
    
    // ถ้าไม่มีข้อมูลสถานะในรูปแบบภาษาไทย ให้แปลงสถานะเป็นภาษาไทย
    leaveDetail.statusText = translateStatus(leave.status);
    
    // ตรวจสอบสถานะการขอยกเลิก
    if (leave.cancelStatus) {
      leaveDetail.cancelStatusText = translateStatus(leave.cancelStatus);
    }
    
    setSelectedLeaveDetail(leaveDetail);
    setIsDetailSheetOpen(true);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingPage message="กำลังโหลดข้อมูลการลา..." />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Toaster />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100 flex items-center">
          <FiCalendar className="mr-2 text-primary" /> รายการการลา
        </h1>
        <div className="mt-4 md:mt-0 flex space-x-2">
          <Button
            onClick={openAddSheet}
            className="gap-1"
          >
            <FiPlus className="h-4 w-4" />
            <span>เพิ่มการลา</span>
          </Button>
        </div>
      </div>
      
      {error && <ErrorMessage message={error} type="error" />}
      
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
                  placeholder="ค้นหาจากชื่อพนักงาน, ประเภทการลา..."
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
      
      {/* แสดงรายการการลาแบบตาราง */}
      {filteredLeaves.length > 0 ? (
        <div className="space-y-4">
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b">
                  <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <th 
                      className="px-6 py-3 cursor-pointer select-none" 
                      onClick={() => handleSort('leaveType')}
                    >
                      <div className="flex items-center">
                        ประเภทการลา
                        {renderSortIcon('leaveType')}
                    </div>
                    </th>
                    <th 
                      className="px-6 py-3 cursor-pointer select-none" 
                      onClick={() => handleSort('employee')}
                    >
                      <div className="flex items-center">
                        พนักงาน
                        {renderSortIcon('employee')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 cursor-pointer select-none" 
                      onClick={() => handleSort('startDate')}
                    >
                      <div className="flex items-center">
                        วันที่เริ่มลา
                        {renderSortIcon('startDate')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 cursor-pointer select-none" 
                      onClick={() => handleSort('endDate')}
                    >
                      <div className="flex items-center">
                        วันที่สิ้นสุด
                        {renderSortIcon('endDate')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 cursor-pointer select-none" 
                      onClick={() => handleSort('totalDays')}
                    >
                      <div className="flex items-center">
                        จำนวนวัน
                        {renderSortIcon('totalDays')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 cursor-pointer select-none" 
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center">
                        สถานะ
                        {renderSortIcon('status')}
                      </div>
                    </th>
                    {/* เพิ่มคอลัมน์เอกสารแนบ */}
                    <th className="px-6 py-3">
                      <div className="flex items-center">
                        เอกสารแนบ
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
                  {paginatedLeaves.map((leave) => (
                    <tr 
                      key={leave.id} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FiFileText className="h-4 w-4 text-primary mr-2" />
                          <span>{leave.leaveType}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {leave.employee?.image ? (
                              <div className="h-8 w-8 rounded-full overflow-hidden">
                                <Image
                                  src={leave.employee.image}
                                  alt={leave.employee.firstName}
                                  width={32}
                                  height={32}
                                  className="rounded-full"
                                  unoptimized={isMockImage(leave.employee.image)}
                                />
                            </div>
                          ) : (
                              <div className="flex h-8 w-8 rounded-full bg-primary text-primary-content items-center justify-center">
                                <span className="text-xs font-medium">
                                  {leave.employee?.firstName?.[0] || ''}{leave.employee?.lastName?.[0] || ''}
                                </span>
                            </div>
                          )}
                            <div className="ml-1">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-200">
                                {leave.employee?.firstName || ''} {leave.employee?.lastName || ''}
                              </div>
                            </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-200">
                          {formatDate(leave.startDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-200">
                          {formatDate(leave.endDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-200">{leave.totalDays} วัน</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">({leave.leaveFormat})</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {leave.isDuringCancel ? (
                          // หากมีการขอยกเลิก แสดงป้ายรอยกเลิก
                          <div className="flex items-center">
                            <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                              <FiClock className="mr-1 h-3 w-3" />
                              รอยกเลิก
                            </span>
                          </div>
                        ) : (
                          // แสดงสถานะปกติ
                          <div className={`flex items-center ${
                              leave.status === 'waiting_for_approve' ? 'text-yellow-600 dark:text-yellow-400' : 
                              leave.status === 'approved' ? 'text-green-600 dark:text-green-400' : 
                              leave.status === 'rejected' ? 'text-red-600 dark:text-red-400' : 
                              'text-purple-600 dark:text-purple-400'
                            }`}>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                leave.status === 'waiting_for_approve' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' : 
                                leave.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 
                                leave.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 
                                'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                              }`}>
                              {leave.status === 'waiting_for_approve' ? <FiClock className="mr-1 h-3 w-3" /> : 
                               leave.status === 'approved' ? <FiCheckCircle className="mr-1 h-3 w-3" /> : 
                               leave.status === 'rejected' ? <FiXCircle className="mr-1 h-3 w-3" /> : 
                               <FiSlash className="mr-1 h-3 w-3" />}
                              {translateStatus(leave.status)}
                            </span>
                          </div>
                        )}
                      </td>
                      {/* เซลล์แสดงเอกสารแนบ */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {leave.attachments && leave.attachments.length > 0 ? (
                          <Popover>
                            <PopoverTrigger asChild>
                              <button className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/40">
                                <FiFileText className="mr-1" /> {leave.attachments.length} ไฟล์
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-3" align="start">
                              <div className="space-y-2">
                                <h3 className="font-medium">เอกสารแนบ</h3>
                                <div className="max-h-60 overflow-y-auto space-y-1">
                                  {leave.attachments.map((attachment, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-2 rounded-md">
                                      <div className="flex items-center overflow-hidden">
                                        <FiFileText className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mr-2" />
                                        <span className="text-sm truncate">{attachment.split('/').pop()}</span>
                                      </div>
                                      <div className="flex gap-1 flex-shrink-0 ml-2">
                                        <a
                                          href={attachment}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="p-1 rounded-md text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                                          title="ดูไฟล์"
                                        >
                                          <FiEye size={14} />
                                        </a>
                                        <a
                                          href={attachment}
                                          download
                                          className="p-1 rounded-md text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30"
                                          title="ดาวน์โหลด"
                                        >
                                          <FiDownload size={14} />
                                        </a>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        ) : (
                          <span className="text-xs text-gray-500 dark:text-gray-400">ไม่มีเอกสาร</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(leave.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex justify-center items-center space-x-2">
                          {/* ปุ่มดูรายละเอียด */}
                          <button 
                            className="p-1 rounded-md text-primary hover:text-primary/80 dark:text-primary-foreground dark:hover:text-primary-foreground/80 hover:bg-primary/10 dark:hover:bg-primary/20 focus:outline-none"
                            onClick={() => navigateToLeaveDetail(leave.id)}
                            title="ดูรายละเอียด"
                          >
                            <FiEye className="h-4 w-4" />
                          </button>
                          
                          {/* ปุ่มแก้ไข */}
                          {canEdit(leave) && (
                            <button 
                              className="p-1 rounded-md text-amber-600 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 focus:outline-none"
                              onClick={() => openEditSheet(leave)}
                              title="แก้ไข"
                            >
                              <FiEdit className="h-4 w-4" />
                            </button>
                          )}
                          
                          {/* ปุ่มอนุมัติ */}
                          {canApprove(leave) && (
                            <button 
                              className="p-1 rounded-md text-green-600 hover:text-green-700 dark:text-green-500 dark:hover:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 focus:outline-none"
                              onClick={() => openApproveModal(leave.id)}
                              title="อนุมัติ"
                            >
                              <FiCheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          
                          {/* ปุ่มไม่อนุมัติ */}
                          {canApprove(leave) && (
                            <button 
                              className="p-1 rounded-md text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 focus:outline-none"
                              onClick={() => openRejectModal(leave.id)}
                              title="ไม่อนุมัติ"
                            >
                              <FiXCircle className="h-4 w-4" />
                            </button>
                          )}
                          
                          {/* ปุ่มขอยกเลิกการลา */}
                          {canCancelRequest(leave) && (
                            <button 
                              className="p-1 rounded-md text-orange-600 hover:text-orange-700 dark:text-orange-500 dark:hover:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30 focus:outline-none"
                              onClick={() => openCancelModal(leave.id)}
                              title={session.user.id === leave.employeeId ? "ขอยกเลิกการลา" : "ขอยกเลิกการลาแทน"}
                            >
                              <FiXSquare className="h-4 w-4" />
                            </button>
                          )}
                          
                          {/* ปุ่มอนุมัติการยกเลิก */}
                          {canApproveCancelRequest(leave) && (
                            <button 
                              className="p-1 rounded-md text-green-600 hover:text-green-700 dark:text-green-500 dark:hover:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 focus:outline-none"
                              onClick={() => openApproveCancelModal(leave.id)}
                              title="อนุมัติการยกเลิก"
                            >
                              <FiCheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          
                          {/* ปุ่มไม่อนุมัติการยกเลิก */}
                          {canApproveCancelRequest(leave) && (
                            <button 
                              className="p-1 rounded-md text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 focus:outline-none"
                              onClick={() => openRejectCancelModal(leave.id)}
                              title="ปฏิเสธการยกเลิก"
                            >
                              <FiXCircle className="h-4 w-4" />
                            </button>
                          )}
                          
                          {/* ปุ่มลบ */}
                          {canDelete(leave) && (
                            <button 
                              className="p-1 rounded-md text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 focus:outline-none"
                              onClick={() => confirmDelete(leave.id)}
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
          
          {/* Pagination ตามแบบของ shadcn/ui */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              แสดง {((currentPage - 1) * pageSize) + 1} ถึง {Math.min(currentPage * pageSize, filteredLeaves.length)} จากทั้งหมด {filteredLeaves.length} รายการ
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
                    // ถ้ามีไม่เกิน 5 หน้า แสดงทั้งหมด
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    // ถ้าอยู่หน้าต้นๆ แสดง 1-5
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    // ถ้าอยู่หน้าท้ายๆ แสดง totalPages-4 ถึง totalPages
                    pageNum = totalPages - 4 + i;
                  } else {
                    // ถ้าอยู่ตรงกลาง แสดงหน้าปัจจุบันและหน้ารอบๆ
                    pageNum = currentPage - 2 + i;
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
          
          {/* ตัวเลือกขนาดหน้า */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">แสดงต่อหน้า</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1); // รีเซ็ตกลับไปหน้าแรกเมื่อเปลี่ยนจำนวนรายการต่อหน้า
              }}
              className="flex h-8 w-20 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 border rounded-lg shadow-sm p-8 text-center">
          <FiCalendar className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
          <p className="text-lg text-gray-600 dark:text-gray-300">ไม่พบข้อมูลการลา</p>
        </div>
      )}
      
      {/* Modal สำหรับระบุเหตุผลการไม่อนุมัติ */}
      <AlertDialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-start">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <FiAlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="ml-4">
                <AlertDialogTitle>ไม่อนุมัติการลา</AlertDialogTitle>
                <AlertDialogDescription>
                  กรุณาระบุเหตุผลที่ไม่อนุมัติการลานี้ (ไม่บังคับ)
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <div className="mt-3">
            <textarea
              rows="3"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="ระบุเหตุผลที่ไม่อนุมัติ"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            ></textarea>
          </div>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel
              disabled={actionLoading}
              onClick={() => setShowRejectModal(false)}
            >
              ยกเลิก
            </AlertDialogCancel>
            <LoadingButton
              type="button"
              onClick={handleReject}
              loading={actionLoading}
              disabled={actionLoading}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-10 px-4 py-2"
            >
              <FiXCircle className="mr-1.5 h-4 w-4" />
              <span>ไม่อนุมัติ</span>
            </LoadingButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Modal สำหรับระบุเหตุผลการอนุมัติ */}
      <AlertDialog open={showApproveModal} onOpenChange={setShowApproveModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-start">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <FiCheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <AlertDialogTitle>อนุมัติการลา</AlertDialogTitle>
                <AlertDialogDescription>
                  กรุณาระบุเหตุผลหรือบันทึกเพิ่มเติม (ไม่บังคับ)
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <div className="mt-3">
            <textarea
              rows="3"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="ระบุบันทึกเพิ่มเติม"
              value={approveReason}
              onChange={(e) => setApproveReason(e.target.value)}
            ></textarea>
          </div>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel
              disabled={actionLoading}
              onClick={() => setShowApproveModal(false)}
            >
              ยกเลิก
            </AlertDialogCancel>
            <LoadingButton
              type="button"
              onClick={handleApprove}
              loading={actionLoading}
              disabled={actionLoading}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              <FiCheckCircle className="mr-1.5 h-4 w-4" />
              <span>อนุมัติ</span>
            </LoadingButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Modal สำหรับขอยกเลิกการลา */}
      <AlertDialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-start">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                <FiXSquare className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-4">
                <AlertDialogTitle>{cancelModalTitle}</AlertDialogTitle>
                <AlertDialogDescription>
                  {cancelModalDescription}
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
            <AlertDialogCancel
              disabled={actionLoading}
              onClick={() => setShowCancelModal(false)}
            >
              ยกเลิก
            </AlertDialogCancel>
            <LoadingButton
              type="button"
              onClick={handleCancelRequest}
              loading={actionLoading}
              disabled={actionLoading}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-orange-600 text-white hover:bg-orange-700 h-10 px-4 py-2"
            >
              <FiXSquare className="mr-1.5 h-4 w-4" />
              <span>ขอยกเลิก</span>
            </LoadingButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Modal ยืนยันการอนุมัติการยกเลิกการลา */}
      <AlertDialog open={showApproveCancelModal} onOpenChange={setShowApproveCancelModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการอนุมัติยกเลิกการลา</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการอนุมัติการขอยกเลิกการลานี้ใช่หรือไม่?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-2">ความคิดเห็น (ไม่บังคับ)</label>
            <textarea
              rows="3"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="ระบุความคิดเห็นเพิ่มเติม (ถ้ามี)"
              value={cancelApprovalComment}
              onChange={(e) => setCancelApprovalComment(e.target.value)}
            ></textarea>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleApproveCancel();
              }}
              className="bg-primary hover:bg-primary/90"
              disabled={actionLoading}
            >
              {actionLoading ? (
                <div className="flex items-center">
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  <span>กำลังดำเนินการ</span>
                </div>
              ) : (
                <span>อนุมัติการยกเลิก</span>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal ยืนยันการไม่อนุมัติการยกเลิกการลา */}
      <AlertDialog open={showRejectCancelModal} onOpenChange={setShowRejectCancelModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการไม่อนุมัติยกเลิกการลา</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการไม่อนุมัติการขอยกเลิกการลานี้ใช่หรือไม่?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-2">เหตุผลในการไม่อนุมัติ</label>
            <textarea
              rows="3"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="ระบุเหตุผลในการไม่อนุมัติ"
              value={cancelApprovalComment}
              onChange={(e) => setCancelApprovalComment(e.target.value)}
            ></textarea>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleRejectCancel();
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={actionLoading}
            >
              {actionLoading ? (
                <div className="flex items-center">
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  <span>กำลังดำเนินการ</span>
                </div>
              ) : (
                <span>ไม่อนุมัติการยกเลิก</span>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* AlertDialog สำหรับการลบข้อมูล */}
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
                  คุณต้องการลบข้อมูลการลานี้ใช่หรือไม่? การกระทำนี้ไม่สามารถเรียกคืนได้
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setAlertDialogOpen(false)}
              disabled={actionLoading}
            >
              ยกเลิก
            </AlertDialogCancel>
            <LoadingButton
              type="button"
              onClick={() => {
                if (selectedDeleteLeaveId) {
                  handleDelete(selectedDeleteLeaveId);
                }
                setAlertDialogOpen(false);
              }}
              loading={actionLoading}
              disabled={actionLoading}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-10 px-4 py-2"
            >
              <FiTrash2 className="mr-1.5 h-4 w-4" />
              <span>ลบข้อมูล</span>
            </LoadingButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Edit Leave Sheet */}
      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent side="right" className="w-full max-w-xl overflow-y-auto">
          <SheetHeader className="border-b pb-4 mb-4">
            <SheetTitle className="text-lg">แก้ไขข้อมูลการลา</SheetTitle>
            <SheetDescription>
              กรุณาแก้ไขข้อมูลการลาและกดบันทึกเพื่อดำเนินการต่อ
            </SheetDescription>
          </SheetHeader>
          
          <form onSubmit={handleUpdateLeave} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="leaveType" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                ประเภทการลา <span className="text-red-500">*</span>
              </label>
              <select
                id="leaveType"
                name="leaveType"
                value={editFormData.leaveType}
                onChange={handleEditFormChange}
                required
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">เลือกประเภทการลา</option>
                <option value="ลาป่วย">ลาป่วย</option>
                <option value="ลากิจ">ลากิจ</option>
                <option value="ลาพักร้อน">ลาพักร้อน</option>
                <option value="ลาคลอด">ลาคลอด</option>
                <option value="ลาบวช">ลาบวช</option>
                <option value="ลาเพื่อการศึกษา">ลาเพื่อการศึกษา</option>
                <option value="ลาเพื่อรับราชการทหาร">ลาเพื่อรับราชการทหาร</option>
                <option value="อื่นๆ">อื่นๆ</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="leaveFormat" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                รูปแบบการลา
              </label>
              <select
                id="leaveFormat"
                name="leaveFormat"
                value={editFormData.leaveFormat}
                onChange={handleEditFormChange}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="เต็มวัน">เต็มวัน</option>
                <option value="ครึ่งวัน (ช่วงเช้า)">ครึ่งวัน (ช่วงเช้า)</option>
                <option value="ครึ่งวัน (ช่วงบ่าย)">ครึ่งวัน (ช่วงบ่าย)</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                วันที่เริ่มลา <span className="text-red-500">*</span>
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <div className="relative">
                    <Input
                      value={startDate ? format(startDate, 'dd/MM/yyyy') : ''}
                      className="pl-10"
                      placeholder="เลือกวันที่เริ่มลา"
                      readOnly
                    />
                    <FiCalendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                วันที่สิ้นสุด <span className="text-red-500">*</span>
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <div className="relative">
                    <Input
                      value={endDate ? format(endDate, 'dd/MM/yyyy') : ''}
                      className="pl-10"
                      placeholder="เลือกวันที่สิ้นสุด"
                      readOnly
                    />
                    <FiCalendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => date < startDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            
            
            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-md text-sm">
              <p>จำนวนวันลาทั้งหมด: <span className="font-semibold">{editFormData.totalDays}</span> วัน</p>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="reason" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                เหตุผลการลา <span className="text-red-500">*</span>
              </label>
              <textarea
                id="reason"
                name="reason"
                value={editFormData.reason}
                onChange={handleEditFormChange}
                required
                rows={4}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  เอกสารแนบ (ถ้ามี)
                </label>
                <div className="ml-2 p-1 rounded-full bg-blue-50 dark:bg-blue-900/30">
                  <FiInfo className="h-3 w-3 text-blue-500" />
                </div>
              </div>
              
              {/* แสดงไฟล์ที่มีอยู่เดิม */}
              {editFormData.attachments && editFormData.attachments.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center mb-2 border-b dark:border-gray-700 pb-1">
                    <FiPaperclip className="h-4 w-4 text-primary mr-1.5" />
                    <h3 className="text-sm font-medium">ไฟล์ที่แนบไว้แล้ว ({editFormData.attachments.length})</h3>
                  </div>
                  <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 space-y-2">
                    {editFormData.attachments.map((attachment, index) => {
                      const fileName = attachment.split('/').pop();
                      const fileExt = fileName.split('.').pop()?.toLowerCase();
                      
                      // เลือกไอคอนตามประเภทไฟล์
                      let FileIcon = FiFileText;
                      if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt)) {
                        FileIcon = FiImage;
                      } else if (fileExt === 'pdf') {
                        FileIcon = FiFile;
                      } else if (['zip', 'rar', '7z'].includes(fileExt)) {
                        FileIcon = FiArchive;
                      }
                      
                      return (
                        <div key={index} className="flex justify-between items-center p-2 rounded-md bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/70 transition-colors">
                          <div className="text-sm truncate flex items-center">
                            <div className="h-8 w-8 flex items-center justify-center rounded bg-primary/10 text-primary mr-2">
                              <FileIcon className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col">
                              <a 
                                href={attachment} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="hover:text-primary hover:underline font-medium truncate max-w-[300px]"
                              >
                                {fileName}
                              </a>
                              <span className="text-xs text-gray-500">เปิดดูในแท็บใหม่</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAttachment(index)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 p-2 rounded-full transition-colors"
                            title="ลบไฟล์"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* ส่วนอัปโหลดไฟล์ใหม่ */}
              <div 
                className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-800/50 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center text-center">
                  <FiUploadCloud className="h-10 w-10 text-slate-400 mb-2" />
                  <div className="mb-2">
                    <p className="text-sm text-slate-500">ลากไฟล์มาวางที่นี่ หรือ</p>
                  </div>
                  <label className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 cursor-pointer">
                    <FiFileText className="mr-1.5 h-4 w-4" />
                    <span>เลือกไฟล์</span>
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                      multiple
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-2">รองรับไฟล์ PDF, รูปภาพ, เอกสาร (.zip ไม่เกิน 5MB/ไฟล์)</p>
                </div>
              </div>
              
              {/* แสดงไฟล์ที่จะอัปโหลด */}
              {filesToUpload.length > 0 && (
                <div className="mt-3">
                  <div className="flex items-center mb-2 border-b dark:border-gray-700 pb-1">
                    <FiUpload className="h-4 w-4 text-primary mr-1.5" />
                    <h3 className="text-sm font-medium">ไฟล์ที่เลือก ({filesToUpload.length})</h3>
                  </div>
                  <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 space-y-2">
                    {filesToUpload.map((file, index) => {
                      const fileExt = file.name.split('.').pop()?.toLowerCase();
                      
                      // เลือกไอคอนตามประเภทไฟล์
                      let FileIcon = FiFileText;
                      if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt)) {
                        FileIcon = FiImage;
                      } else if (fileExt === 'pdf') {
                        FileIcon = FiFile;
                      } else if (['zip', 'rar', '7z'].includes(fileExt)) {
                        FileIcon = FiArchive;
                      }
                      
                      return (
                        <div key={index} className="flex justify-between items-center p-2 rounded-md bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/70 transition-colors">
                          <div className="text-sm truncate flex items-center">
                            <div className="h-8 w-8 flex items-center justify-center rounded bg-primary/10 text-primary mr-2">
                              <FileIcon className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium truncate max-w-[300px]">{file.name}</span>
                              <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 p-2 rounded-full transition-colors"
                            title="ลบไฟล์"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            
            <SheetFooter>
              <SheetClose asChild>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                >
                  ยกเลิก
                </button>
              </SheetClose>
              <LoadingButton
                type="submit"
                loading={actionLoading}
                disabled={actionLoading}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
              >
                <FiEdit className="mr-1.5 h-4 w-4" />
                <span>บันทึกการแก้ไข</span>
              </LoadingButton>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
      
      {/* Sheet สำหรับเพิ่มการลา */}
      <Sheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen}>
        <SheetContent side="right" className="w-full max-w-xl overflow-y-auto">
          <SheetHeader className="border-b pb-4 mb-4">
            <SheetTitle className="text-lg">ขอลางาน</SheetTitle>
            <SheetDescription>
              กรอกข้อมูลการลาและกดบันทึกเพื่อส่งคำขอลา
            </SheetDescription>
          </SheetHeader>
          
          {addError && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
            <div className="flex items-center">
              <FiAlertTriangle className="h-5 w-5 mr-2" />
              <span>{addError}</span>
            </div>
          </div>}
          
          {addSuccess && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4" role="alert">
              <div className="flex items-center">
                <FiInfo className="h-5 w-5 mr-2" />
                <span>{addSuccess}</span>
              </div>
            </div>
          )}
          
          <form onSubmit={handleAddSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="leaveType" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                ประเภทการลา <span className="text-red-500">*</span>
              </label>
              <select
                id="leaveType"
                name="leaveType"
                value={addFormData.leaveType}
                onChange={handleAddFormChange}
                required
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="ลาป่วย">ลาป่วย</option>
                <option value="ลากิจ">ลากิจ</option>
                <option value="ลาพักร้อน">ลาพักร้อน</option>
                <option value="ลาคลอด">ลาคลอด</option>
                <option value="ลาบวช">ลาบวช</option>
                <option value="ลาไม่รับเงินเดือน">ลาไม่รับเงินเดือน</option>
                <option value="อื่นๆ">อื่นๆ</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="leaveFormat" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                รูปแบบการลา <span className="text-red-500">*</span>
              </label>
              <select
                id="leaveFormat"
                name="leaveFormat"
                value={addFormData.leaveFormat}
                onChange={handleAddFormChange}
                required
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="เต็มวัน">เต็มวัน</option>
                <option value="ครึ่งวัน-เช้า">ครึ่งวัน (เช้า)</option>
                <option value="ครึ่งวัน-บ่าย">ครึ่งวัน (บ่าย)</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                วันที่เริ่มลา <span className="text-red-500">*</span>
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <div className="relative">
                    <Input
                      value={addFormData.startDate ? format(new Date(addFormData.startDate), 'dd/MM/yyyy') : ''}
                      className="pl-10"
                      placeholder="เลือกวันที่เริ่มลา"
                      readOnly
                    />
                    <FiCalendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={addFormData.startDate ? new Date(addFormData.startDate) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        const formattedDate = format(date, 'yyyy-MM-dd');
                        const e = {
                          target: {
                            name: 'startDate',
                            value: formattedDate
                          }
                        };
                        handleAddFormChange(e);
                        
                        // บังคับปิด Popover หลังจากเลือกวันที่
                        setTimeout(forceClosePopover, 100);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                วันที่สิ้นสุด <span className="text-red-500">*</span>
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <div className="relative">
                    <Input
                      value={addFormData.endDate ? format(new Date(addFormData.endDate), 'dd/MM/yyyy') : ''}
                      className="pl-10"
                      placeholder="เลือกวันที่สิ้นสุด"
                      readOnly
                      disabled={addFormData.leaveFormat.includes('ครึ่งวัน')}
                    />
                    <FiCalendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={addFormData.endDate ? new Date(addFormData.endDate) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        const formattedDate = format(date, 'yyyy-MM-dd');
                        const e = {
                          target: {
                            name: 'endDate',
                            value: formattedDate
                          }
                        };
                        handleAddFormChange(e);
                        
                        // บังคับปิด Popover หลังจากเลือกวันที่
                        setTimeout(forceClosePopover, 100);
                      }
                    }}
                    disabled={(date) => {
                      // อนุญาตให้เลือกวันที่ตั้งแต่วันที่เริ่มต้นเป็นต้นไป
                      if (!addFormData.startDate) return false;
                      
                      const startDate = new Date(addFormData.startDate);
                      startDate.setHours(0, 0, 0, 0);
                      
                      const dateToCheck = new Date(date);
                      dateToCheck.setHours(0, 0, 0, 0);
                      
                      // อนุญาตให้เลือกได้ตั้งแต่วันที่เริ่มต้นเป็นต้นไป (>= วันที่เริ่มต้น)
                      return dateToCheck < startDate;
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-md text-sm">
              <p>จำนวนวันลาทั้งหมด: <span className="font-semibold">{addTotalDays}</span> วัน</p>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="reason" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                เหตุผลการลา <span className="text-red-500">*</span>
              </label>
              <textarea
                id="reason"
                name="reason"
                value={addFormData.reason}
                onChange={handleAddFormChange}
                required
                rows={4}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  เอกสารแนบ (ถ้ามี)
                </label>
                <div className="ml-2 p-1 rounded-full bg-blue-50 dark:bg-blue-900/30">
                  <FiInfo className="h-3 w-3 text-blue-500" />
                </div>
              </div>
              
              {/* ส่วนอัปโหลดไฟล์ใหม่ */}
              <div 
                className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-800/50 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <div className="flex flex-col items-center text-center">
                  <FiUploadCloud className="h-10 w-10 text-slate-400 mb-2" />
                  <div className="mb-2">
                    <p className="text-sm text-slate-500">ลากไฟล์มาวางที่นี่ หรือ</p>
                  </div>
                  <label className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 cursor-pointer">
                    <FiFileText className="mr-1.5 h-4 w-4" />
                    <span>เลือกไฟล์</span>
                    <input
                      type="file"
                      onChange={handleAddFileChange}
                      className="hidden"
                      multiple
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-2">รองรับไฟล์ PDF, รูปภาพ, เอกสาร (.zip ไม่เกิน 5MB/ไฟล์)</p>
                </div>
              </div>
              
              {/* แสดงไฟล์ที่จะอัปโหลด */}
              {addFilesToUpload.length > 0 && (
                <div className="mt-3">
                  <div className="flex items-center mb-2 border-b dark:border-gray-700 pb-1">
                    <FiUpload className="h-4 w-4 text-primary mr-1.5" />
                    <h3 className="text-sm font-medium">ไฟล์ที่เลือก ({addFilesToUpload.length})</h3>
                  </div>
                  <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 space-y-2">
                    {addFilesToUpload.map((file, index) => {
                      const fileExt = file.name.split('.').pop()?.toLowerCase();
                      
                      // เลือกไอคอนตามประเภทไฟล์
                      let FileIcon = FiFileText;
                      if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt)) {
                        FileIcon = FiImage;
                      } else if (fileExt === 'pdf') {
                        FileIcon = FiFile;
                      } else if (['zip', 'rar', '7z'].includes(fileExt)) {
                        FileIcon = FiArchive;
                      }
                      
                      return (
                        <div key={index} className="flex justify-between items-center p-2 rounded-md bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/70 transition-colors">
                          <div className="text-sm truncate flex items-center">
                            <div className="h-8 w-8 flex items-center justify-center rounded bg-primary/10 text-primary mr-2">
                              <FileIcon className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium truncate max-w-[300px]">{file.name}</span>
                              <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAddFile(index)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 p-2 rounded-full transition-colors"
                            title="ลบไฟล์"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            
            <SheetFooter>
              <SheetClose asChild>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                >
                  ยกเลิก
                </button>
              </SheetClose>
              <LoadingButton
                type="submit"
                loading={addLoading || addUploading}
                disabled={addLoading || addUploading}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
              >
                <FiSave className="mr-1.5 h-4 w-4" />
                <span>บันทึกข้อมูล</span>
              </LoadingButton>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
      
      {/* Sheet แสดงรายละเอียดการลา */}
      <AlertDialog open={isDetailSheetOpen} onOpenChange={setIsDetailSheetOpen}>
        <AlertDialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto block p-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <FiFileText className="h-6 w-6 text-primary" />
              <AlertDialogTitle className="text-2xl flex items-center gap-2">
                รายละเอียดการลา
                {selectedLeaveDetail && (
                  <Badge
                    className={cn(
                      "rounded-md px-2.5 py-0.5 text-xs font-medium",
                      {
                        "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-500": selectedLeaveDetail.status === "waiting_for_approve",
                        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500": selectedLeaveDetail.status === "approved",
                        "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500": selectedLeaveDetail.status === "rejected",
                        "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-500": selectedLeaveDetail.status === "canceled"
                      }
                    )}
                  >
                    {selectedLeaveDetail.statusText || translateStatus(selectedLeaveDetail.status)}
                  </Badge>
                )}
                {selectedLeaveDetail?.isDuringCancel && (
                  <Badge variant="outline" className="ml-2 border-amber-500 text-amber-600">
                    รอยกเลิก
                  </Badge>
                )}
              </AlertDialogTitle>
            </div>
            <AlertDialogCancel className="h-10 w-10 p-0 rounded-full">
              <FiX className="h-4 w-4" />
              <span className="sr-only">ปิด</span>
            </AlertDialogCancel>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <LoadingSpinner />
            </div>
          ) : selectedLeaveDetail ? (
            <div className="space-y-8">
              {/* ข้อมูลพนักงาน */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  {selectedLeaveDetail.employee?.image ? (
                    <div className="h-16 w-16 rounded-full overflow-hidden border border-border">
                      <Image
                        src={selectedLeaveDetail.employee.image}
                        alt={`${selectedLeaveDetail.employee.firstName} ${selectedLeaveDetail.employee.lastName}`}
                        width={64}
                        height={64}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-16 w-16 rounded-full bg-primary text-primary-foreground items-center justify-center">
                      <span className="text-xl font-semibold">
                        {selectedLeaveDetail.employee?.firstName?.[0] || ''}{selectedLeaveDetail.employee?.lastName?.[0] || ''}
                      </span>
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-medium">
                      {selectedLeaveDetail.employee?.firstName} {selectedLeaveDetail.employee?.lastName}
                    </h3>
                    <p className="text-muted-foreground">
                      {selectedLeaveDetail.employee?.position || 'ไม่ระบุตำแหน่ง'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* ข้อมูลการลา */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b border-border pb-2">ข้อมูลการลา</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded-md">
                      <FiFileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">ประเภทการลา</div>
                      <div className="font-medium">{selectedLeaveDetail.leaveType}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded-md">
                      <FiCalendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">วันที่ลา</div>
                      <div className="font-medium">{formatDateRange(selectedLeaveDetail.startDate, selectedLeaveDetail.endDate)}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded-md">
                      <FiClock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">รูปแบบการลา</div>
                      <div className="font-medium">{selectedLeaveDetail.leaveFormat || 'เต็มวัน'}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded-md">
                      <FiCalendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">จำนวนวัน</div>
                      <div className="font-medium">{selectedLeaveDetail.leaveDays || selectedLeaveDetail.totalDays} วัน</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* เหตุผลการลา */}
              {selectedLeaveDetail.reason && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold border-b border-border pb-2">เหตุผลการลา</h3>
                  <div className="bg-muted/30 p-4 rounded-lg whitespace-pre-wrap">
                    {selectedLeaveDetail.reason}
                  </div>
                </div>
              )}
              
              {/* เอกสารแนบ */}
              {selectedLeaveDetail.attachments && selectedLeaveDetail.attachments.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b border-border pb-2">
                    เอกสารแนบ ({selectedLeaveDetail.attachments.length})
                  </h3>
                  <div className="space-y-2">
                    {selectedLeaveDetail.attachments.map((attachment, index) => {
                      const fileName = attachment.split('/').pop();
                      return (
                        <div key={index} className="flex justify-between items-center p-3 rounded-md bg-background border">
                          <div className="text-sm truncate flex items-center">
                            <div className="h-10 w-10 flex items-center justify-center rounded bg-primary/10 text-primary mr-3">
                              <FiFileText className="h-5 w-5" />
                            </div>
                            <div className="truncate">
                              <span className="font-medium truncate block">{fileName}</span>
                              <span className="text-xs text-muted-foreground">แนบเมื่อ {formatDate(selectedLeaveDetail.createdAt)}</span>
                            </div>
                          </div>
                          <div className="flex">
                            <a 
                              href={attachment} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              download
                              className="p-2 text-primary rounded-full hover:bg-primary/10 transition-colors"
                              title="ดาวน์โหลด"
                            >
                              <FiDownload className="h-4 w-4" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* ข้อมูลอนุมัติ */}
              {selectedLeaveDetail.status !== 'waiting_for_approve' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b border-border pb-2">ข้อมูลการอนุมัติ</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-start gap-3">
                      <div className="bg-primary/10 p-2 rounded-md">
                        <FiUser className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">ผู้อนุมัติ</div>
                        <div className="font-medium">
                          {selectedLeaveDetail.approvedBy ? 
                            `${selectedLeaveDetail.approvedBy.firstName || ''} ${selectedLeaveDetail.approvedBy.lastName || ''}` : 
                            'ไม่ระบุ'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="bg-primary/10 p-2 rounded-md">
                        <FiCalendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">วันที่อนุมัติ</div>
                        <div className="font-medium">{formatDateFull(selectedLeaveDetail.approvedAt)}</div>
                      </div>
                    </div>
                  </div>
                  
                  {selectedLeaveDetail.comment && (
                    <div className="space-y-2 mt-3">
                      <div className="text-sm text-muted-foreground">ความเห็น</div>
                      <div className="bg-muted/30 p-4 rounded-lg whitespace-pre-wrap">
                        {selectedLeaveDetail.comment}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ข้อมูลการขอยกเลิกและการอนุมัติยกเลิก */}
              {selectedLeaveDetail.cancelStatus && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b border-border pb-2">ข้อมูลการยกเลิก</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* สถานะการยกเลิก */}
                    <div className="flex items-start gap-3">
                      <div className="bg-primary/10 p-2 rounded-md">
                        <FiAlertCircle className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">สถานะการยกเลิก</div>
                        <div className="font-medium">
                          <Badge
                            className={cn(
                              "rounded-md px-2.5 py-0.5 text-xs font-medium mt-1",
                              {
                                "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-500": selectedLeaveDetail.cancelStatus === "waiting_for_approve",
                                "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500": selectedLeaveDetail.cancelStatus === "approved",
                                "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500": selectedLeaveDetail.cancelStatus === "rejected"
                              }
                            )}
                          >
                            {selectedLeaveDetail.cancelStatusText || translateStatus(selectedLeaveDetail.cancelStatus)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    {/* ผู้ขอยกเลิก */}
                    <div className="flex items-start gap-3">
                      <div className="bg-primary/10 p-2 rounded-md">
                        <FiUser className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">ผู้ขอยกเลิก</div>
                        <div className="font-medium">
                          {selectedLeaveDetail.cancelRequestBy ? 
                            `${selectedLeaveDetail.cancelRequestBy.firstName || ''} ${selectedLeaveDetail.cancelRequestBy.lastName || ''}` : 
                            'ไม่ระบุ'}
                        </div>
                      </div>
                    </div>
                    
                    {/* วันที่ขอยกเลิก */}
                    <div className="flex items-start gap-3">
                      <div className="bg-primary/10 p-2 rounded-md">
                        <FiCalendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">วันที่ขอยกเลิก</div>
                        <div className="font-medium">{formatDateFull(selectedLeaveDetail.cancelRequestAt)}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* เหตุผลการยกเลิก */}
                  {selectedLeaveDetail.cancelReason && (
                    <div className="space-y-2 mt-3">
                      <div className="text-sm text-muted-foreground">เหตุผลการยกเลิก</div>
                      <div className="bg-muted/30 p-4 rounded-lg whitespace-pre-wrap">
                        {selectedLeaveDetail.cancelReason}
                      </div>
                    </div>
                  )}
                  
                  {/* ข้อมูลการอนุมัติยกเลิก (ถ้ามี) */}
                  {selectedLeaveDetail.cancelStatus !== 'waiting_for_approve' && selectedLeaveDetail.cancelResponseBy && (
                    <div className="space-y-4 mt-6 pt-6 border-t border-border">
                      <h3 className="text-lg font-semibold">ข้อมูลการตอบกลับการยกเลิก</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-start gap-3">
                          <div className="bg-primary/10 p-2 rounded-md">
                            <FiUser className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">ผู้ตอบกลับการยกเลิก</div>
                            <div className="font-medium">
                              {`${selectedLeaveDetail.cancelResponseBy.firstName || ''} ${selectedLeaveDetail.cancelResponseBy.lastName || ''}`}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <div className="bg-primary/10 p-2 rounded-md">
                            <FiCalendar className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">วันที่ตอบกลับ</div>
                            <div className="font-medium">{formatDateFull(selectedLeaveDetail.cancelResponseAt)}</div>
                          </div>
                        </div>
                      </div>
                      
                      {selectedLeaveDetail.cancelResponseComment && (
                        <div className="space-y-2 mt-3">
                          <div className="text-sm text-muted-foreground">ความคิดเห็น</div>
                          <div className="bg-muted/30 p-4 rounded-lg whitespace-pre-wrap">
                            {selectedLeaveDetail.cancelResponseComment}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* ประวัติการทำรายการ */}
              {selectedLeaveDetail.approvals && selectedLeaveDetail.approvals.length > 0 && (
                <div className="space-y-4 mt-6">
                  <h3 className="text-lg font-semibold border-b border-border pb-2">ประวัติการทำรายการ</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground border-b">วันที่</th>
                          <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground border-b">ประเภทรายการ</th>
                          <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground border-b">ผู้ดำเนินการ</th>
                          <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground border-b">สถานะ</th>
                          <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground border-b">รายละเอียด</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedLeaveDetail.approvals.map((approval, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-muted/20'}>
                            <td className="py-2.5 px-4 text-sm border-b">{formatDateFull(approval.createdAt)}</td>
                            <td className="py-2.5 px-4 text-sm border-b">
                              {approval.type === 'approve' ? 'อนุมัติ' : 
                              approval.type === 'reject' ? 'ไม่อนุมัติ' : 
                              approval.type === 'request_cancel' ? 'ขอยกเลิก' : 
                              approval.type === 'approve_cancel' ? 'อนุมัติการยกเลิก' : 
                              approval.type === 'reject_cancel' ? 'ปฏิเสธการยกเลิก' : approval.type}
                            </td>
                            <td className="py-2.5 px-4 text-sm border-b">
                              {approval.employees ? 
                                `${approval.employees.firstName || ''} ${approval.employees.lastName || ''}` : 
                                'ไม่ระบุ'}
                            </td>
                            <td className="py-2.5 px-4 text-sm border-b">
                              <Badge
                                className={cn(
                                  "rounded-full",
                                  approval.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                                )}
                              >
                                {approval.status === 'completed' ? 'สำเร็จ' : 'รอดำเนินการ'}
                              </Badge>
                            </td>
                            <td className="py-2.5 px-4 text-sm border-b max-w-xs truncate">
                              {approval.reason || approval.comment || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
                        
              {/* ปุ่มด้านล่าง */}
              <div className="flex flex-wrap items-center justify-between border-t border-border pt-4 mt-6 gap-3">
                <div className="flex flex-wrap gap-2">
                  {/* แสดงปุ่มตามสิทธิ์ */}
                  {canApprove(selectedLeaveDetail) && (
                    <Button 
                      onClick={() => {
                        setIsDetailSheetOpen(false);
                        openApproveModal(selectedLeaveDetail.id);
                      }}
                      variant="outline"
                      className="border-green-500 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                    >
                      <FiCheckCircle className="mr-2 h-4 w-4" />
                      อนุมัติ
                    </Button>
                  )}
                  
                  {canApprove(selectedLeaveDetail) && (
                    <Button 
                      onClick={() => {
                        setIsDetailSheetOpen(false);
                        openRejectModal(selectedLeaveDetail.id);
                      }}
                      variant="outline"
                      className="border-red-500 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                    >
                      <FiXCircle className="mr-2 h-4 w-4" />
                      ไม่อนุมัติ
                    </Button>
                  )}
                  
                  {canEdit(selectedLeaveDetail) && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsDetailSheetOpen(false);
                        openEditSheet(selectedLeaveDetail);
                      }}
                    >
                      <FiEdit className="mr-2 h-4 w-4" />
                      แก้ไข
                    </Button>
                  )}
                  
                  {canCancelRequest(selectedLeaveDetail) && (
                    <Button
                      variant="outline"
                      className="border-orange-500 text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950"
                      onClick={() => {
                        setIsDetailSheetOpen(false);
                        openCancelModal(selectedLeaveDetail.id);
                      }}
                    >
                      <FiXSquare className="mr-2 h-4 w-4" />
                      ขอยกเลิก
                    </Button>
                  )}
                  
                  {canApproveCancelRequest(selectedLeaveDetail) && (
                    <Button
                      variant="outline"
                      className="border-green-500 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                      onClick={() => {
                        setIsDetailSheetOpen(false);
                        openApproveCancelModal(selectedLeaveDetail.id);
                      }}
                    >
                      <FiCheckCircle className="mr-2 h-4 w-4" />
                      อนุมัติยกเลิก
                    </Button>
                  )}
                  
                  {canApproveCancelRequest(selectedLeaveDetail) && (
                    <Button
                      variant="outline"
                      className="border-red-500 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                      onClick={() => {
                        setIsDetailSheetOpen(false);
                        openRejectCancelModal(selectedLeaveDetail.id);
                      }}
                    >
                      <FiXCircle className="mr-2 h-4 w-4" />
                      ปฏิเสธยกเลิก
                    </Button>
                  )}
                </div>
                
                <Button
                  variant="outline"
                  onClick={() => setIsDetailSheetOpen(false)}
                >
                  ปิด
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <FiAlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium">ไม่พบข้อมูลการลา</h3>
                <p className="text-muted-foreground mt-2">
                  ข้อมูลที่คุณกำลังค้นหาอาจถูกลบหรือไม่มีอยู่ในระบบ
                </p>
              </div>
            </div>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 