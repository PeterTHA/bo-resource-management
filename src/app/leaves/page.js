'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

// เปลี่ยนจาก Heroicons เป็น react-icons
import { FiCheckCircle, FiXCircle, FiTrash2, FiPlus, FiFilter, FiCalendar, FiUser, FiClock, 
         FiFileText, FiDownload, FiInfo, FiAlertTriangle, FiMessageCircle, FiEdit } from 'react-icons/fi';
import { LoadingPage, LoadingButton } from '../../components/ui/LoadingSpinner';
import ErrorMessage from '../../components/ui/ErrorMessage';

// เพิ่มฟังก์ชันตรวจสอบว่าเป็นรูปภาพจาก mock-images หรือไม่
const isMockImage = (src) => {
  return src && typeof src === 'string' && (src.startsWith('/mock-images/') || src.startsWith('./mock-images/'));
};

export default function LeavesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('all');
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
  const [selectedLeaveId, setSelectedLeaveId] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
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
    const fetchLeaves = async () => {
      try {
        const res = await fetch('/api/leaves');
        const data = await res.json();
        
        if (data.success) {
          setLeaves(data.data);
          
          // คำนวณจำนวนข้อมูลแต่ละสถานะ
          const counts = {
            all: data.data.length,
            pending: data.data.filter(leave => 
              leave.status === 'รออนุมัติ' || 
              (leave.status === 'อนุมัติ' && leave.cancelStatus === 'รออนุมัติ')
            ).length,
            approved: data.data.filter(leave => 
              leave.status === 'อนุมัติ' && 
              !leave.isCancelled && 
              leave.cancelStatus !== 'รออนุมัติ'
            ).length,
            rejected: data.data.filter(leave => leave.status === 'ไม่อนุมัติ').length,
            cancelled: data.data.filter(leave => leave.isCancelled).length,
            pendingCancel: data.data.filter(leave => 
              leave.status === 'อนุมัติ' && leave.cancelStatus === 'รออนุมัติ'
            ).length
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
    if (!confirm('คุณต้องการลบข้อมูลการลานี้ใช่หรือไม่?')) {
      return;
    }
    
    try {
      setActionLoading(true);
      const res = await fetch(`/api/leaves/${id}`, {
        method: 'DELETE',
      });
      
      const data = await res.json();
      
      if (data.success) {
        setLeaves(leaves.filter(leave => leave.id !== id));
        setSuccess('ลบข้อมูลการลาเรียบร้อยแล้ว');
        
        // อัปเดตสถิติ
        setStatusCounts(prev => {
          const deletedLeave = leaves.find(leave => leave.id === id);
          const status = deletedLeave?.status === 'รออนุมัติ' ? 'pending' : 
                         deletedLeave?.status === 'อนุมัติ' ? 'approved' : 'rejected';
          
          return {
            ...prev,
            all: prev.all - 1,
            [status]: prev[status] - 1
          };
        });
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

  const handleApprove = async (id) => {
    if (!confirm('คุณต้องการอนุมัติการลานี้ใช่หรือไม่?')) {
      return;
    }
    
    try {
      setActionLoading(true);
      const res = await fetch(`/api/leaves/${id}`, {
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
        // อัปเดตข้อมูลในรายการ
        setLeaves(leaves.map(leave => 
          leave.id === id ? { 
            ...leave, 
            status: 'อนุมัติ',
            approvedBy: {
              id: session.user.id,
              firstName: session.user.firstName || session.user.name?.split(' ')[0] || '',
              lastName: session.user.lastName || session.user.name?.split(' ')[1] || '',
            },
            approvedAt: new Date().toISOString()
          } : leave
        ));
        
        setSuccess('อนุมัติการลาเรียบร้อยแล้ว');
        
        // อัปเดตสถิติ
        setStatusCounts(prev => ({
          ...prev,
          pending: prev.pending - 1,
          approved: prev.approved + 1
        }));
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
          status: 'ไม่อนุมัติ',
          approvedById: session.user.id,
          comment: rejectReason || null
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        // อัปเดตข้อมูลในรายการ
        setLeaves(leaves.map(leave => 
          leave.id === selectedLeaveId ? { 
            ...leave, 
            status: 'ไม่อนุมัติ',
            approvedBy: {
              id: session.user.id,
              firstName: session.user.firstName || session.user.name?.split(' ')[0] || '',
              lastName: session.user.lastName || session.user.name?.split(' ')[1] || '',
            },
            approvedAt: new Date().toISOString(),
            comment: rejectReason || null
          } : leave
        ));
        
        setSuccess('ปฏิเสธการลาเรียบร้อยแล้ว');
        
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
        setError(data.message || 'เกิดข้อผิดพลาดในการอัปเดตสถานะการลา');
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredLeaves = useMemo(() => {
    let filtered = leaves;
    
    // กรองตามสถานะ
    if (filter === 'pending') {
      filtered = leaves.filter(leave => leave.status === 'รออนุมัติ');
    } else if (filter === 'approved') {
      filtered = leaves.filter(leave => 
        leave.status === 'อนุมัติ' && 
        !leave.isCancelled && 
        !leave.cancelStatus
      );
    } else if (filter === 'rejected') {
      filtered = leaves.filter(leave => leave.status === 'ไม่อนุมัติ');
    } else if (filter === 'cancelled') {
      filtered = leaves.filter(leave => 
        leave.status === 'ยกเลิก' || 
        leave.isCancelled || 
        leave.cancelledById !== null ||
        leave.cancelStatus === 'อนุมัติ'
      );
    } else if (filter === 'pendingCancel') {
      filtered = leaves.filter(leave => 
        leave.status === 'อนุมัติ' && leave.cancelStatus === 'รออนุมัติ'
      );
    }
    
    // กรองตามพนักงาน
    if (employeeFilter !== 'all') {
      filtered = filtered.filter(leave => leave.employeeId === employeeFilter);
    }
    
    return filtered;
  }, [leaves, filter, employeeFilter]);

  const formatDate = (dateString) => {
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
    router.push(`/leaves/${leaveId}`);
  };

  // ตรวจสอบว่าผู้ใช้มีสิทธิ์อนุมัติหรือไม่
  const canApprove = (leave) => {
    if (!session || !leave) return false;
    
    // แอดมินและหัวหน้างานอนุมัติได้ (ไม่ต้องตรวจสอบว่าเป็นการลาของตัวเองหรือไม่)
    if ((session.user.role === 'admin' || session.user.role === 'supervisor') && 
        leave.status === 'รออนุมัติ') {
      return true;
    }
    
    return false;
  };

  // ตรวจสอบว่าสามารถลบได้หรือไม่
  const canDelete = (leave) => {
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
  const canEdit = (leave) => {
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

  if (status === 'loading' || loading) {
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
          <FiCalendar className="mr-2 text-blue-600 dark:text-blue-400" /> รายการการลา
        </h1>
        <Link
          href="/leaves/add"
          className="btn btn-primary inline-flex items-center justify-center text-white shadow-md hover:shadow-lg"
        >
          <FiPlus className="mr-1.5 h-4 w-4" /> <span>ขอลางาน</span>
        </Link>
      </div>
      
      {error && <ErrorMessage message={error} type="error" />}
      {success && <ErrorMessage message={success} type="success" />}
      
      {/* Dashboard สรุปสถิติการลา */}
      <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-6 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border-l-4 border-blue-500 dark:border-blue-400 transition-all duration-200 hover:shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">การลาทั้งหมด</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{statusCounts.all}</p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
              <FiCalendar className="h-5 w-5 text-blue-500 dark:text-blue-400" />
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
              <FiAlertTriangle className="h-5 w-5 text-orange-500 dark:text-orange-400" />
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
      
      {/* แสดงรายการการลาแบบการ์ด */}
      {filteredLeaves.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLeaves.map((leave) => (
            <div key={leave.id} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow duration-300 cursor-pointer" onClick={() => navigateToLeaveDetail(leave.id)}>
              <div className="card-body">
                <div className="flex justify-between items-start">
                  <h2 className="card-title">{leave.leaveType}</h2>
                  <div className="flex flex-col gap-1 items-end">
                    <div className={`badge ${
                      leave.status === 'อนุมัติ' ? 'badge-success' : 
                      leave.status === 'ไม่อนุมัติ' ? 'badge-error' : 
                      'badge-warning'
                    } badge-lg`}>
                      {leave.status}
                    </div>
                    
                    {/* แสดงสถานะการยกเลิกถ้ามี */}
                    {leave.cancelStatus === 'อนุมัติ' && (
                      <div className="badge badge-info badge-sm">
                        ยกเลิกแล้ว
                      </div>
                    )}
                    {leave.cancelStatus === 'รออนุมัติ' && (
                      <div className="badge badge-warning badge-sm">
                        รอยกเลิก
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-2 space-y-3">
                  <div className="flex gap-2 items-start">
                    <FiCalendar size={18} className="mt-1 text-primary" />
                    <div>
                      <div className="font-semibold">วันที่ลา</div>
                      <div>
                        {formatDate(leave.startDate)}
                        {leave.startDate !== leave.endDate && ` - ${formatDate(leave.endDate)}`}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 items-start">
                    <FiUser size={18} className="mt-1 text-primary" />
                    <div>
                      <div className="font-semibold">พนักงาน</div>
                      <div className="flex items-center gap-2">
                        {leave.employee?.image ? (
                          <div className="avatar">
                            <div className="w-8 h-8 rounded-full">
                              <Image
                                src={leave.employee.image}
                                alt={leave.employee.firstName}
                                width={32}
                                height={32}
                                className="rounded-full"
                                unoptimized={isMockImage(leave.employee.image)}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="avatar placeholder">
                            <div className="bg-primary text-primary-content w-8 h-8 rounded-full">
                              <span>{leave.employee?.firstName?.[0] || ''}{leave.employee?.lastName?.[0] || ''}</span>
                            </div>
                          </div>
                        )}
                        <span>
                          {leave.employee?.firstName || ''} {leave.employee?.lastName || ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 items-start">
                    <FiInfo size={18} className="mt-1 text-primary" />
                    <div>
                      <div className="font-semibold">จำนวนวัน</div>
                      <div>{leave.totalDays} วัน ({leave.leaveFormat})</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end mt-4 gap-2">
                  {/* ปุ่มแก้ไข */}
                  {canEdit(leave) && (
                    <button 
                      className="btn btn-info btn-sm"
                      onClick={(e) => {
                        e.stopPropagation(); // ป้องกันการนำทางเมื่อคลิกปุ่ม
                        router.push(`/leaves/${leave.id}/edit`);
                      }}
                      disabled={actionLoading}
                    >
                      <FiEdit size={18} className="mr-1" /> แก้ไข
                    </button>
                  )}
                  
                  {/* ปุ่มอนุมัติ */}
                  {canApprove(leave) && (
                    <button 
                      className="btn btn-success btn-sm"
                      onClick={(e) => {
                        e.stopPropagation(); // ป้องกันการนำทางเมื่อคลิกปุ่ม
                        handleApprove(leave.id);
                      }}
                      disabled={actionLoading}
                    >
                      <FiCheckCircle size={18} className="mr-1" /> อนุมัติ
                    </button>
                  )}
                  
                  {/* ปุ่มไม่อนุมัติ */}
                  {canApprove(leave) && (
                    <button 
                      className="btn btn-error btn-sm"
                      onClick={(e) => {
                        e.stopPropagation(); // ป้องกันการนำทางเมื่อคลิกปุ่ม
                        openRejectModal(leave.id);
                      }}
                      disabled={actionLoading}
                    >
                      <FiXCircle size={18} className="mr-1" /> ไม่อนุมัติ
                    </button>
                  )}
                  
                  {/* ปุ่มลบ */}
                  {canDelete(leave) && (
                    <button 
                      className="btn btn-outline btn-error btn-sm"
                      onClick={(e) => {
                        e.stopPropagation(); // ป้องกันการนำทางเมื่อคลิกปุ่ม
                        handleDelete(leave.id);
                      }}
                      disabled={actionLoading}
                    >
                      <FiTrash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <FiCalendar className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
          <p className="text-lg text-gray-600 dark:text-gray-300">ไม่พบข้อมูลการลา</p>
        </div>
      )}
      
      {/* Modal สำหรับระบุเหตุผลการไม่อนุมัติ */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 sm:mx-0 sm:h-10 sm:w-10">
                    <FiAlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100" id="modal-title">
                      ไม่อนุมัติการลา
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        กรุณาระบุเหตุผลที่ไม่อนุมัติการลานี้ (ไม่บังคับ)
                      </p>
                      <div className="mt-2">
                        <textarea
                          rows="3"
                          className="field-input"
                          placeholder="ระบุเหตุผลที่ไม่อนุมัติ"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <LoadingButton
                  type="button"
                  onClick={handleReject}
                  loading={actionLoading}
                  disabled={actionLoading}
                  className="btn btn-danger w-full sm:w-auto sm:ml-3"
                >
                  <FiXCircle className="mr-1.5 h-4 w-4" />
                  <span>ไม่อนุมัติ</span>
                </LoadingButton>
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  disabled={actionLoading}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 